import { redirect } from "next/navigation";

import { CoachStudioClient } from "@/components/coach-studio-client";
import { getCurrentUser } from "@/lib/auth";
import { getCoachStudioData } from "@/lib/data";
import { prisma } from "@/lib/prisma";

export default async function CoachStudioPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (user.role !== "COACH") {
    redirect("/tableau-de-bord");
  }

  const [studio, categories] = await Promise.all([
    getCoachStudioData(user.id),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!studio) {
    redirect("/inscription");
  }

  return <CoachStudioClient studio={studio} categories={categories} />;
}
