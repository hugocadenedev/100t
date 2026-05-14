import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { CoachApplicationStatus, Role } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

const PDF_DIRECTORY = path.join(process.cwd(), "public", "uploads", "pdfs");
const PDF_PUBLIC_PREFIX = "/uploads/pdfs";
const MAX_PDF_BYTES = 190 * 1024 * 1024; // 190 MB

export async function POST(request: NextRequest) {
  // Auth
  const user = await getCurrentUser();
  if (!user || user.role !== Role.COACH || !user.coachProfile) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (user.coachProfile.approvalStatus !== CoachApplicationStatus.APPROVED) {
    return NextResponse.json({ error: "Compte coach non approuvé." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const submissionId = formData.get("submissionId");
  const monthNumberRaw = formData.get("monthNumber");
  const label = (formData.get("label") as string | null)?.trim() || null;

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Fichier PDF manquant." }, { status: 400 });
  }
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Le fichier doit être un PDF." }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "Le PDF dépasse la limite de 190 Mo." }, { status: 400 });
  }
  if (!submissionId || typeof submissionId !== "string") {
    return NextResponse.json({ error: "Identifiant du dépôt manquant." }, { status: 400 });
  }
  const monthNumber = Number(monthNumberRaw);
  if (!Number.isInteger(monthNumber) || monthNumber < 1) {
    return NextResponse.json({ error: "Numéro de mois invalide." }, { status: 400 });
  }

  // Verify ownership
  const submission = await prisma.programSubmission.findFirst({
    where: { id: submissionId, coachId: user.coachProfile.id },
    select: { id: true, durationMonths: true },
  });
  if (!submission) {
    return NextResponse.json({ error: "Dépôt introuvable." }, { status: 404 });
  }
  if (monthNumber > submission.durationMonths) {
    return NextResponse.json(
      { error: `Ce programme ne dure que ${submission.durationMonths} mois.` },
      { status: 400 },
    );
  }

  // Save file
  await mkdir(PDF_DIRECTORY, { recursive: true });
  const storedFileName = `${Date.now()}-${randomUUID()}.pdf`;
  const absolutePath = path.join(PDF_DIRECTORY, storedFileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);
  const pdfUrl = `${PDF_PUBLIC_PREFIX}/${storedFileName}`;

  // Save to DB
  await prisma.submissionPdf.upsert({
    where: { submissionId_monthNumber: { submissionId, monthNumber } },
    update: { pdfUrl, label },
    create: { submissionId, monthNumber, pdfUrl, label: label ?? null },
  });

  revalidatePath("/coach-studio");
  return NextResponse.json({ url: pdfUrl });
}
