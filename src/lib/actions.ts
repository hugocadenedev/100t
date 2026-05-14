"use server";

import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createPasswordResetToken,
  createUserSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CoachApplicationStatus, Difficulty, PLAN_MONTHLY_LIMIT, PLATFORM_MONTHLY_PRICE, Role } from "@/lib/domain";
import {
  adminCoachApplicationReviewSchema,
  adminPdfProgramSchema,
  adminProgramSubmissionReviewSchema,
  adminUserRoleSchema,
  coachProfileSchema,
  forgotPasswordSchema,
  initialActionState,
  loginSchema,
  programSchema,
  programSubmissionSchema,
  registerSchema,
  resetPasswordSchema,
  type ActionState,
  workoutSessionSchema,
} from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { stripe } from "@/lib/stripe";

async function createUniqueSlug(baseValue: string, excludeCoachId?: string) {
  const baseSlug = slugify(baseValue) || "coach-100t";
  let candidate = baseSlug;
  let index = 1;

  while (true) {
    const existing = await prisma.coachProfile.findFirst({
      where: {
        slug: candidate,
        ...(excludeCoachId ? { id: { not: excludeCoachId } } : {}),
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return candidate;
    }

    index += 1;
    candidate = `${baseSlug}-${index}`;
  }
}

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
}

function normalizeOptionalString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

const PROGRAM_PDF_DIRECTORY = path.join(process.cwd(), "public", "uploads", "programs");
const PROGRAM_PDF_PUBLIC_PREFIX = "/uploads/programs";
const MAX_PROGRAM_PDF_BYTES = 10 * 1024 * 1024;

function getPublicAssetAbsolutePath(publicPath: string) {
  return path.join(process.cwd(), "public", ...publicPath.replace(/^\/+/, "").split("/"));
}

async function persistProgramPdf(file: File) {
  if (!file.size) {
    throw new Error("Ajoute un PDF à importer.");
  }

  const fileName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");

  if (!isPdf) {
    throw new Error("Le fichier doit être un PDF.");
  }

  if (file.size > MAX_PROGRAM_PDF_BYTES) {
    throw new Error("Le PDF dépasse la limite de 10 Mo.");
  }

  await mkdir(PROGRAM_PDF_DIRECTORY, { recursive: true });

  const storedFileName = `${Date.now()}-${randomUUID()}.pdf`;
  const absolutePath = path.join(PROGRAM_PDF_DIRECTORY, storedFileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, buffer);

  return `${PROGRAM_PDF_PUBLIC_PREFIX}/${storedFileName}`;
}

async function deleteProgramPdfIfPresent(pdfUrl?: string | null) {
  if (!pdfUrl || !pdfUrl.startsWith(PROGRAM_PDF_PUBLIC_PREFIX)) {
    return;
  }

  try {
    await unlink(getPublicAssetAbsolutePath(pdfUrl));
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  if (user.role !== Role.ADMIN) {
    redirect("/");
  }

  return user;
}

async function requireApprovedCoachUser() {
  const user = await getCurrentUser();

  if (!user || user.role !== Role.COACH || !user.coachProfile) {
    redirect("/connexion");
  }

  if (user.coachProfile.approvalStatus !== CoachApplicationStatus.APPROVED) {
    redirect("/coach-studio");
  }

  return user;
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
    headline: formData.get("headline") || undefined,
    bio: formData.get("bio") || undefined,
    photoUrl: formData.get("photoUrl") || undefined,
    monthlyPrice: formData.get("monthlyPrice") || undefined,
    discipline: formData.get("discipline") || undefined,
    specialities: formData.get("specialities") || undefined,
    diplomas: formData.get("diplomas") || undefined,
    diplomaFileUrl: formData.get("diplomaFileUrl") || undefined,
    skills: formData.get("skills") || undefined,
    experienceYears: formData.get("experienceYears") || undefined,
    coachedClientsCount: formData.get("coachedClientsCount") || undefined,
    addressLine1: formData.get("addressLine1") || undefined,
    city: formData.get("city") || undefined,
    postalCode: formData.get("postalCode") || undefined,
    country: formData.get("country") || undefined,
    phone: formData.get("phone") || undefined,
    instagramUrl: formData.get("instagramUrl") || undefined,
    tiktokUrl: formData.get("tiktokUrl") || undefined,
    youtubeUrl: formData.get("youtubeUrl") || undefined,
    linkedinUrl: formData.get("linkedinUrl") || undefined,
    websiteUrl: formData.get("websiteUrl") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message,
    };
  }

  const {
    firstName,
    lastName,
    email,
    password,
    role,
    headline,
    bio,
    photoUrl,
    discipline,
    specialities,
    diplomas,
    diplomaFileUrl,
    skills,
    experienceYears,
    coachedClientsCount,
    addressLine1,
    city,
    postalCode,
    country,
    phone,
    instagramUrl,
    tiktokUrl,
    youtubeUrl,
    linkedinUrl,
    websiteUrl,
  } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return {
      status: "error",
      message: "Un compte existe déjà avec cette adresse email.",
    };
  }

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      role,
      passwordHash: await hashPassword(password),
      ...(role === Role.COACH
        ? {
            coachProfile: {
              create: {
                slug: await createUniqueSlug(`${firstName}-${lastName}`),
                approvalStatus: CoachApplicationStatus.PENDING,
                headline: headline!,
                bio: bio!,
                photoUrl: normalizeOptionalString(photoUrl),
                monthlyPrice: PLATFORM_MONTHLY_PRICE,
                discipline: discipline!,
                specialities: specialities!,
                diplomas: diplomas ?? null,
                diplomaFileUrl: diplomaFileUrl ?? null,
                skills: skills ?? "",
                experienceYears: experienceYears!,
                coachedClientsCount: coachedClientsCount!,
                addressLine1: addressLine1 ?? "",
                city: city ?? "",
                postalCode: postalCode ?? "",
                country: country ?? "France",
                phone: normalizeOptionalString(phone),
                instagramUrl: normalizeOptionalString(instagramUrl),
                tiktokUrl: normalizeOptionalString(tiktokUrl),
                youtubeUrl: normalizeOptionalString(youtubeUrl),
                linkedinUrl: normalizeOptionalString(linkedinUrl),
                websiteUrl: normalizeOptionalString(websiteUrl),
              },
            },
          }
        : {}),
    },
  });

  await createUserSession(user.id);

  if (role === Role.COACH) {
    redirect("/coach-studio");
  }

  redirect("/tableau-de-bord");
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: {
      coachProfile: true,
    },
  });

  if (!user) {
    return {
      status: "error",
      message: "Aucun compte ne correspond à ces identifiants.",
    };
  }

  const passwordIsValid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!passwordIsValid) {
    return {
      status: "error",
      message: "Aucun compte ne correspond à ces identifiants.",
    };
  }

  await createUserSession(user.id);

  if (user.role === Role.ADMIN) {
    redirect("/admin");
  }

  if (user.role === Role.COACH) {
    redirect("/coach-studio");
  }

  redirect("/tableau-de-bord");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function requestPasswordResetAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (user) {
    await createPasswordResetToken(user.id);
  }

  return {
    status: "success",
    message:
      "Si cette adresse existe, un email de réinitialisation a été simulé. En local, consulte la base pour récupérer le lien.",
  };
}

export async function resetPasswordAction(
  token: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message,
    };
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    return {
      status: "error",
      message: "Ce lien de réinitialisation n'est plus valide.",
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: await hashPassword(parsed.data.password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return {
    status: "success",
    message: "Mot de passe mis à jour. Tu peux maintenant te connecter.",
  };
}

export async function subscribeToCoachAction(coachId: string): Promise<ActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  if (user.role !== Role.USER) {
    return {
      status: "error",
      message: "Un compte coach ne peut pas souscrire à un abonnement utilisateur.",
    };
  }

  const coach = await prisma.coachProfile.findUnique({
    where: { id: coachId },
    select: { slug: true, approvalStatus: true },
  });

  if (!coach) {
    return {
      status: "error",
      message: "Coach introuvable.",
    };
  }

  if (coach.approvalStatus !== CoachApplicationStatus.APPROVED) {
    return {
      status: "error",
      message: "Ce profil coach n'est pas encore disponible à l'abonnement.",
    };
  }

  // Enforce one subscription per user
  const existingSub = await prisma.subscription.findUnique({
    where: { subscriberId: user.id },
  });

  if (existingSub && existingSub.currentPeriodEnd > new Date() && !existingSub.cancelAtPeriodEnd) {
    return {
      status: "error",
      message: "Tu es déjà abonné à un coach. Résilie d'abord ton abonnement ou utilise \"Changer de coach\".",
    };
  }

  const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.subscription.upsert({
    where: { subscriberId: user.id },
    update: {
      coachId,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
      pendingCoachId: null,
    },
    create: {
      subscriberId: user.id,
      coachId,
      currentPeriodEnd,
    },
  });

  revalidatePath(`/coach/${coach.slug}`);
  revalidatePath("/tableau-de-bord");

  return {
    status: "success",
    message: "Abonnement confirmé. Les programmes sont débloqués immédiatement.",
  };
}

export async function switchCoachAction(newCoachId: string): Promise<ActionState> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  if (user.role !== Role.USER) {
    return { status: "error", message: "Action non autorisée." };
  }

  const newCoach = await prisma.coachProfile.findUnique({
    where: { id: newCoachId },
    select: { slug: true, approvalStatus: true, user: { select: { firstName: true, lastName: true } } },
  });

  if (!newCoach || newCoach.approvalStatus !== CoachApplicationStatus.APPROVED) {
    return { status: "error", message: "Coach introuvable ou indisponible." };
  }

  const newCoachName = [newCoach.user.firstName, newCoach.user.lastName].filter(Boolean).join(" ") || "ce coach";

  const subscription = await prisma.subscription.findUnique({
    where: { subscriberId: user.id },
    include: { coach: true },
  });

  if (!subscription || subscription.currentPeriodEnd <= new Date() || subscription.cancelAtPeriodEnd) {
    return { status: "error", message: "Aucun abonnement actif à reporter. Souscris directement." };
  }

  if (subscription.coachId === newCoachId) {
    return { status: "error", message: "Tu es déjà abonné à ce coach." };
  }

  await prisma.subscription.update({
    where: { subscriberId: user.id },
    data: { pendingCoachId: newCoachId },
  });

  revalidatePath(`/coach/${newCoach.slug}`);
  if (subscription.coach?.slug) revalidatePath(`/coach/${subscription.coach.slug}`);
  revalidatePath("/tableau-de-bord");

  return {
    status: "success",
    message: `Changement de coach programmé. Tu rejoindras ${newCoachName} à la prochaine période.`,
  };
}

export async function cancelPendingCoachSwitchAction(): Promise<void> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  await prisma.subscription.updateMany({
    where: { subscriberId: user.id },
    data: { pendingCoachId: null },
  });

  revalidatePath("/tableau-de-bord");
}

export async function cancelSubscriptionAction(subscriptionId: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { coach: true },
  });

  if (!subscription || subscription.subscriberId !== user.id) {
    throw new Error("Abonnement introuvable.");
  }

  // Block cancellation during commitment period
  if (subscription.commitmentEndDate && subscription.commitmentEndDate > new Date()) {
    const end = subscription.commitmentEndDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    throw new Error(`Ton engagement court jusqu'au ${end}. La résiliation sera possible à partir de cette date.`);
  }

  // Cancel in Stripe at period end if a Stripe subscription exists
  if (subscription.stripeSubscriptionId) {
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      cancelAtPeriodEnd: true,
    },
  });

  revalidatePath("/tableau-de-bord");
  if (subscription.coach?.slug) revalidatePath(`/coach/${subscription.coach.slug}`);
}

export async function saveCoachProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireApprovedCoachUser();

    const parsed = coachProfileSchema.safeParse({
      slug: formData.get("slug"),
      headline: formData.get("headline"),
      bio: formData.get("bio"),
      photoUrl: formData.get("photoUrl"),
      coverImageUrl: formData.get("coverImageUrl"),
      discipline: formData.get("discipline"),
      specialities: formData.get("specialities"),
      skills: formData.get("skills"),
      experienceYears: formData.get("experienceYears"),
      coachedClientsCount: formData.get("coachedClientsCount"),
      addressLine1: formData.get("addressLine1"),
      city: formData.get("city"),
      postalCode: formData.get("postalCode"),
      country: formData.get("country"),
      phone: formData.get("phone"),
      instagramUrl: formData.get("instagramUrl"),
      tiktokUrl: formData.get("tiktokUrl"),
      youtubeUrl: formData.get("youtubeUrl"),
      linkedinUrl: formData.get("linkedinUrl"),
      websiteUrl: formData.get("websiteUrl"),
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message,
      };
    }

    const currentProfile = await prisma.coachProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    const slug = await createUniqueSlug(parsed.data.slug, currentProfile?.id);

    await prisma.coachProfile.upsert({
      where: { userId: user.id },
      update: {
        ...parsed.data,
        slug,
        photoUrl: normalizeOptionalString(parsed.data.photoUrl),
        coverImageUrl: normalizeOptionalString(parsed.data.coverImageUrl),
        phone: normalizeOptionalString(parsed.data.phone),
        instagramUrl: normalizeOptionalString(parsed.data.instagramUrl),
        tiktokUrl: normalizeOptionalString(parsed.data.tiktokUrl),
        youtubeUrl: normalizeOptionalString(parsed.data.youtubeUrl),
        linkedinUrl: normalizeOptionalString(parsed.data.linkedinUrl),
        websiteUrl: normalizeOptionalString(parsed.data.websiteUrl),
      },
      create: {
        userId: user.id,
        ...parsed.data,
        slug,
        monthlyPrice: PLATFORM_MONTHLY_PRICE,
        approvalStatus: CoachApplicationStatus.APPROVED,
        photoUrl: normalizeOptionalString(parsed.data.photoUrl),
        coverImageUrl: normalizeOptionalString(parsed.data.coverImageUrl),
        phone: normalizeOptionalString(parsed.data.phone),
        instagramUrl: normalizeOptionalString(parsed.data.instagramUrl),
        tiktokUrl: normalizeOptionalString(parsed.data.tiktokUrl),
        youtubeUrl: normalizeOptionalString(parsed.data.youtubeUrl),
        linkedinUrl: normalizeOptionalString(parsed.data.linkedinUrl),
        websiteUrl: normalizeOptionalString(parsed.data.websiteUrl),
      },
    });

    revalidatePath("/coach-studio");
    revalidatePath(`/coach/${slug}`);

    return {
      status: "success",
      message: "Profil coach mis à jour.",
    };
  } catch (error) {
    return {
      status: "error",
      message: messageFromError(error),
    };
  }
}

export async function saveProgramAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireApprovedCoachUser();
    const coachProfile = user.coachProfile!;

    const parsed = programSchema.safeParse({
      programId: formData.get("programId") || undefined,
      title: formData.get("title"),
      description: formData.get("description"),
      coverImage: formData.get("coverImage"),
      difficulty: formData.get("difficulty") || Difficulty.DEBUTANT,
      totalDurationMinutes: formData.get("totalDurationMinutes"),
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message,
      };
    }

    const data = {
      title: parsed.data.title,
      description: parsed.data.description,
      coverImage: parsed.data.coverImage || null,
      difficulty: parsed.data.difficulty,
      totalDurationMinutes: parsed.data.totalDurationMinutes,
      coachId: coachProfile.id,
      isPublished: true,
    };

    if (parsed.data.programId) {
      const existing = await prisma.program.findUnique({
        where: { id: parsed.data.programId },
        select: { coachId: true },
      });

      if (!existing || existing.coachId !== coachProfile.id) {
        throw new Error("Programme introuvable.");
      }

      await prisma.program.update({
        where: { id: parsed.data.programId },
        data,
      });
    } else {
      await prisma.program.create({
        data,
      });
    }

    revalidatePath("/coach-studio");
    revalidatePath(`/coach/${coachProfile.slug}`);

    return {
      status: "success",
      message: "Programme enregistré.",
    };
  } catch (error) {
    return {
      status: "error",
      message: messageFromError(error),
    };
  }
}

export async function deleteProgramAction(programId: string) {
  const user = await requireApprovedCoachUser();
  const coachProfile = user.coachProfile!;

  const existing = await prisma.program.findUnique({
    where: { id: programId },
    select: { coachId: true, pdfUrl: true },
  });

  if (!existing || existing.coachId !== coachProfile.id) {
    throw new Error("Programme introuvable.");
  }

  await prisma.program.delete({
    where: { id: programId },
  });

  await deleteProgramPdfIfPresent(existing.pdfUrl);

  revalidatePath("/coach-studio");
  revalidatePath(`/coach/${coachProfile.slug}`);
}

export async function saveWorkoutSessionAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireApprovedCoachUser();
    const coachProfile = user.coachProfile!;

    const blocks = JSON.parse(String(formData.get("exerciseBlocks") || "[]")) as unknown[];
    const parsed = workoutSessionSchema.safeParse({
      sessionId: formData.get("sessionId") || undefined,
      programId: formData.get("programId"),
      title: formData.get("title"),
      description: formData.get("description"),
      durationMinutes: formData.get("durationMinutes"),
      difficulty: formData.get("difficulty") || Difficulty.DEBUTANT,
      videoUrl: formData.get("videoUrl"),
      exerciseBlocks: blocks,
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message,
      };
    }

    const program = await prisma.program.findUnique({
      where: { id: parsed.data.programId },
      include: {
        coach: true,
        workoutSessions: {
          orderBy: { order: "desc" },
          take: 1,
        },
      },
    });

    if (!program || program.coachId !== coachProfile.id) {
      throw new Error("Programme introuvable.");
    }

    const blocksData = parsed.data.exerciseBlocks.map((block, index) => ({
      name: block.name,
      sets: block.sets,
      reps: block.reps,
      restSeconds: block.restSeconds,
      notes: block.notes || null,
      videoUrl: block.videoUrl || null,
      order: index + 1,
    }));

    if (parsed.data.sessionId) {
      const session = await prisma.workoutSession.findUnique({
        where: { id: parsed.data.sessionId },
        select: { id: true, programId: true },
      });

      if (!session || session.programId !== program.id) {
        throw new Error("Séance introuvable.");
      }

      await prisma.$transaction([
        prisma.exerciseBlock.deleteMany({
          where: { sessionId: session.id },
        }),
        prisma.workoutSession.update({
          where: { id: session.id },
          data: {
            title: parsed.data.title,
            description: parsed.data.description,
            durationMinutes: parsed.data.durationMinutes,
            difficulty: parsed.data.difficulty,
            videoUrl: parsed.data.videoUrl || null,
            exerciseBlocks: {
              create: blocksData,
            },
          },
        }),
      ]);
    } else {
      const nextOrder = (program.workoutSessions[0]?.order || 0) + 1;

      await prisma.workoutSession.create({
        data: {
          programId: program.id,
          title: parsed.data.title,
          description: parsed.data.description,
          durationMinutes: parsed.data.durationMinutes,
          difficulty: parsed.data.difficulty,
          videoUrl: parsed.data.videoUrl || null,
          order: nextOrder,
          exerciseBlocks: {
            create: blocksData,
          },
        },
      });
    }

    revalidatePath("/coach-studio");
    revalidatePath(`/coach/${program.coach.slug}`);

    return {
      status: "success",
      message: "Séance enregistrée.",
    };
  } catch (error) {
    return {
      status: "error",
      message: messageFromError(error),
    };
  }
}

export async function deleteWorkoutSessionAction(sessionId: string) {
  const user = await requireApprovedCoachUser();
  const coachProfile = user.coachProfile!;

  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: {
      program: {
        include: {
          coach: true,
        },
      },
    },
  });

  if (!session || session.program.coachId !== coachProfile.id) {
    throw new Error("Séance introuvable.");
  }

  await prisma.workoutSession.delete({
    where: { id: sessionId },
  });

  const remainingSessions = await prisma.workoutSession.findMany({
    where: { programId: session.programId },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  await prisma.$transaction(
    remainingSessions.map((item: { id: string }, index: number) =>
      prisma.workoutSession.update({
        where: { id: item.id },
        data: { order: index + 1 },
      }),
    ),
  );

  revalidatePath("/coach-studio");
  revalidatePath(`/coach/${session.program.coach.slug}`);
}

export async function reorderWorkoutSessionsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireApprovedCoachUser();
    const coachProfile = user.coachProfile!;

    const programId = String(formData.get("programId") || "");
    const orderedSessionIds = String(formData.get("orderedSessionIds") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const program = await prisma.program.findUnique({
      where: { id: programId },
      include: {
        coach: true,
        workoutSessions: {
          select: { id: true },
        },
      },
    });

    if (!program || program.coachId !== coachProfile.id) {
      throw new Error("Programme introuvable.");
    }

    if (orderedSessionIds.length !== program.workoutSessions.length) {
      throw new Error("Ordre de séances invalide.");
    }

    await prisma.$transaction(
      orderedSessionIds.map((sessionId, index) =>
        prisma.workoutSession.update({
          where: { id: sessionId },
          data: { order: index + 1 },
        }),
      ),
    );

    revalidatePath("/coach-studio");
    revalidatePath(`/coach/${program.coach.slug}`);

    return {
      status: "success",
      message: "Ordre des séances mis à jour.",
    };
  } catch (error) {
    return {
      status: "error",
      message: messageFromError(error),
    };
  }
}

export async function adminUpdateUserRoleAction(userId: string, formData: FormData): Promise<void> {
  const admin = await requireAdminUser();
  const parsed = adminUserRoleSchema.safeParse({
    role: formData.get("role"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Rôle invalide.");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      coachProfile: true,
    },
  });

  if (!targetUser) {
    throw new Error("Utilisateur introuvable.");
  }

  if (targetUser.id === admin.id && parsed.data.role !== Role.ADMIN) {
    const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });

    if (adminCount <= 1) {
      throw new Error("Impossible de retirer le dernier accès administrateur.");
    }
  }

  if (targetUser.role === Role.COACH && parsed.data.role !== Role.COACH && targetUser.coachProfile) {
    throw new Error(
      "Convertir un coach vers un autre rôle supprimerait sa logique métier. Gère ce compte manuellement après migration de son contenu.",
    );
  }

  const updateData =
    parsed.data.role === Role.COACH && !targetUser.coachProfile
      ? {
          role: parsed.data.role,
          coachProfile: {
            create: {
              slug: await createUniqueSlug(`${targetUser.firstName || "coach"}-${targetUser.lastName || targetUser.id}`),
              approvalStatus: CoachApplicationStatus.APPROVED,
              headline: "Coach sportif professionnel sur 100T.",
              bio: "Profil créé par un administrateur. Personnalise ensuite la bio, les spécialités et l'offre.",
              monthlyPrice: 29,
              discipline: "Musculation",
              specialities: "Transformation physique",
              skills: "Programmation, progression",
              experienceYears: 1,
              coachedClientsCount: 0,
              addressLine1: "Adresse à compléter",
              city: "Ville à compléter",
              postalCode: "00000",
              country: "France",
            },
          },
        }
      : {
          role: parsed.data.role,
        };

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  revalidatePath("/admin");
}

export async function adminReviewCoachApplicationAction(coachId: string, formData: FormData): Promise<void> {
  await requireAdminUser();

  const parsed = adminCoachApplicationReviewSchema.safeParse({
    status: formData.get("status"),
    reviewNotes: formData.get("reviewNotes"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Décision invalide.");
  }

  const coach = await prisma.coachProfile.findUnique({
    where: { id: coachId },
    select: { id: true, slug: true, userId: true },
  });

  if (!coach) {
    throw new Error("Candidature introuvable.");
  }

  await prisma.coachProfile.update({
    where: { id: coachId },
    data: {
      approvalStatus: parsed.data.status,
      reviewedAt: new Date(),
      reviewNotes: normalizeOptionalString(parsed.data.reviewNotes),
    },
  });

  revalidatePath("/admin");
  revalidatePath("/coach-studio");
  revalidatePath(`/coach/${coach.slug}`);
  revalidatePath("/coachs");
}

export async function adminToggleProgramPublishAction(programId: string): Promise<void> {
  await requireAdminUser();

  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      coach: true,
    },
  });

  if (!program) {
    throw new Error("Programme introuvable.");
  }

  await prisma.program.update({
    where: { id: programId },
    data: {
      isPublished: !program.isPublished,
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/coach/${program.coach.slug}`);
  revalidatePath(`/programmes/${program.id}`);
}

export async function adminCreatePdfProgramAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let pdfUrl: string | null = null;

  try {
    await requireAdminUser();

    const parsed = adminPdfProgramSchema.safeParse({
      coachId: formData.get("coachId"),
      title: formData.get("title"),
      description: formData.get("description"),
      coverImage: formData.get("coverImage"),
      difficulty: formData.get("difficulty") || Difficulty.DEBUTANT,
      totalDurationMinutes: formData.get("totalDurationMinutes"),
    });

    if (!parsed.success) {
      return {
        status: "error",
        message: parsed.error.issues[0]?.message,
      };
    }

    const file = formData.get("pdfFile");

    if (!(file instanceof File)) {
      return {
        status: "error",
        message: "Ajoute un PDF à importer.",
      };
    }

    const coach = await prisma.coachProfile.findUnique({
      where: { id: parsed.data.coachId },
      select: { id: true, slug: true },
    });

    if (!coach) {
      return {
        status: "error",
        message: "Coach introuvable.",
      };
    }

    pdfUrl = await persistProgramPdf(file);

    const program = await prisma.program.create({
      data: {
        coachId: coach.id,
        title: parsed.data.title,
        description: parsed.data.description,
        coverImage: parsed.data.coverImage || null,
        pdfUrl,
        difficulty: parsed.data.difficulty,
        totalDurationMinutes: parsed.data.totalDurationMinutes,
        isPublished: true,
      },
    });

    revalidatePath("/admin");
    revalidatePath(`/coach/${coach.slug}`);
    revalidatePath(`/programmes/${program.id}`);

    return {
      status: "success",
      message: "Programme PDF importé et attribué au coach.",
    };
  } catch (error) {
    if (pdfUrl) {
      await deleteProgramPdfIfPresent(pdfUrl);
    }

    return {
      status: "error",
      message: messageFromError(error),
    };
  }
}

export async function adminDeleteSubscriptionAction(subscriptionId: string): Promise<void> {
  await requireAdminUser();

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      coach: true,
    },
  });

  if (!subscription) {
    throw new Error("Abonnement introuvable.");
  }

  await prisma.subscription.delete({
    where: { id: subscriptionId },
  });

  revalidatePath("/admin");
  if (subscription.coach?.slug) revalidatePath(`/coach/${subscription.coach.slug}`);
  revalidatePath("/tableau-de-bord");
}

export async function adminCreateCategoryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdminUser();

    const name = formData.get("name");
    if (!name || typeof name !== "string" || !name.trim()) {
      return { status: "error", message: "Le nom de la catégorie est requis." };
    }

    const trimmedName = name.trim();
    const slug = slugify(trimmedName) || `categorie-${Date.now()}`;

    await prisma.category.create({
      data: { name: trimmedName, slug },
    });

    revalidatePath("/admin");
    revalidatePath("/coachs");
    return { status: "success", message: `Catégorie « ${trimmedName} » créée.` };
  } catch (error) {
    return { status: "error", message: messageFromError(error) };
  }
}

export async function adminDeleteCategoryAction(categoryId: string): Promise<void> {
  await requireAdminUser();

  await prisma.category.delete({ where: { id: categoryId } });

  revalidatePath("/admin");
  revalidatePath("/coachs");
}

export async function adminAssignCoachCategoryAction(coachId: string, formData: FormData): Promise<void> {
  await requireAdminUser();

  const categoryId = formData.get("categoryId");

  await prisma.coachProfile.update({
    where: { id: coachId },
    data: { categoryId: categoryId && typeof categoryId === "string" && categoryId !== "" ? categoryId : null },
  });

  revalidatePath("/admin");
  revalidatePath("/coachs");
}

export async function selectMonthlyProgramAction(
  programId: string,
  month: number,
  year: number,
): Promise<ActionState> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/connexion");
    }

    if (user.role !== Role.USER) {
      return { status: "error", message: "Seuls les abonnés peuvent sélectionner un programme du mois." };
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: { coachId: true, isPublished: true },
    });

    if (!program || !program.isPublished) {
      return { status: "error", message: "Programme introuvable." };
    }

    const subscription = await prisma.subscription.findUnique({
      where: { subscriberId: user.id },
      select: { currentPeriodEnd: true, plan: true },
    });

    if (!subscription || subscription.currentPeriodEnd <= new Date()) {
      return { status: "error", message: "Aucun abonnement actif. Abonne-toi à une offre sur /offres." };
    }

    // Check monthly limit based on plan
    const plan = subscription.plan ?? "ESSENTIELLE";
    const limit = PLAN_MONTHLY_LIMIT[plan] ?? 1;

    // Check if this program is already selected this month (idempotent)
    const alreadySelected = await prisma.monthlyProgramSelection.findUnique({
      where: { userId_programId_month_year: { userId: user.id, programId, month, year } },
    });

    if (!alreadySelected) {
      // Count how many different programs selected this month
      const currentSelections = await prisma.monthlyProgramSelection.count({
        where: { userId: user.id, month, year },
      });

      if (currentSelections >= limit) {
        return {
          status: "error",
          message: `Tu as atteint la limite de ${limit} programme${limit > 1 ? "s" : ""} par mois pour ton offre.`,
        };
      }
    }

    await prisma.monthlyProgramSelection.upsert({
      where: { userId_programId_month_year: { userId: user.id, programId, month, year } },
      update: {},
      create: { userId: user.id, programId, month, year },
    });

    revalidatePath("/tableau-de-bord");
    revalidatePath(`/programmes/${programId}`);
    revalidatePath(`/coach`);

    return { status: "success", message: "Programme sélectionné pour ce mois." };
  } catch (error) {
    return { status: "error", message: messageFromError(error) };
  }
}

const COVER_IMAGE_DIRECTORY = path.join(process.cwd(), "public", "uploads", "covers");
const COVER_IMAGE_PUBLIC_PREFIX = "/uploads/covers";
const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024;

const PDF_DIRECTORY = path.join(process.cwd(), "public", "uploads", "pdfs");
const PDF_PUBLIC_PREFIX = "/uploads/pdfs";
const MAX_PDF_BYTES = 190 * 1024 * 1024;

async function persistPdf(file: File): Promise<string> {
  if (file.type !== "application/pdf") {
    throw new Error("Le fichier doit être au format PDF.");
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error("Le fichier PDF dépasse la limite de 190 Mo.");
  }
  await mkdir(PDF_DIRECTORY, { recursive: true });
  const storedFileName = `${Date.now()}-${randomUUID()}.pdf`;
  const absolutePath = path.join(PDF_DIRECTORY, storedFileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);
  return `${PDF_PUBLIC_PREFIX}/${storedFileName}`;
}

async function persistCoverImage(file: File): Promise<string> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("L'image de couverture doit être un fichier JPG, PNG ou WebP.");
  }
  if (file.size > MAX_COVER_IMAGE_BYTES) {
    throw new Error("L'image de couverture dépasse la limite de 5 Mo.");
  }
  await mkdir(COVER_IMAGE_DIRECTORY, { recursive: true });
  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const storedFileName = `${Date.now()}-${randomUUID()}.${ext}`;
  const absolutePath = path.join(COVER_IMAGE_DIRECTORY, storedFileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);
  return `${COVER_IMAGE_PUBLIC_PREFIX}/${storedFileName}`;
}

export async function submitProgramAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireApprovedCoachUser();

    const rawEquipment = formData.getAll("equipment") as string[];

    const parsed = programSubmissionSchema.safeParse({
      submissionId: formData.get("submissionId") || undefined,
      title: formData.get("title"),
      description: formData.get("description"),
      coverImageUrl: formData.get("coverImageUrl") || "",
      level: formData.get("level"),
      durationMonths: formData.get("durationMonths"),
      sessionsPerWeek: formData.get("sessionsPerWeek"),
      avgSessionMinutes: formData.get("avgSessionMinutes"),
      equipment: rawEquipment,
      equipmentFreeText: formData.get("equipmentFreeText") || undefined,
    });

    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message };
    }

    const { submissionId, coverImageUrl, equipment, ...fields } = parsed.data;

    // Handle cover image file upload if provided
    let finalCoverImageUrl: string | undefined = coverImageUrl || undefined;
    const coverFile = formData.get("coverImageFile");
    if (coverFile instanceof File && coverFile.size > 0) {
      finalCoverImageUrl = await persistCoverImage(coverFile);
    }

    // Handle PDF upload if provided (becomes month 1 PDF)
    let firstPdfUrl: string | null = null;
    const pdfFile = formData.get("pdfFile");
    if (pdfFile instanceof File && pdfFile.size > 0) {
      firstPdfUrl = await persistPdf(pdfFile);
    }

    const coachProfile = user.coachProfile!;

    const data = {
      title: fields.title,
      description: fields.description,
      coverImageUrl: finalCoverImageUrl ?? null,
      level: fields.level,
      durationMonths: fields.durationMonths,
      sessionsPerWeek: fields.sessionsPerWeek,
      avgSessionMinutes: fields.avgSessionMinutes,
      equipment: JSON.stringify(equipment),
      equipmentFreeText: fields.equipmentFreeText ?? null,
    };

    if (submissionId) {
      // Only allow editing PENDING submissions
      const existing = await prisma.programSubmission.findFirst({
        where: { id: submissionId, coachId: coachProfile.id, status: "PENDING" },
        select: { id: true },
      });
      if (!existing) {
        return { status: "error", message: "Ce dépôt ne peut plus être modifié." };
      }
      await prisma.programSubmission.update({
        where: { id: submissionId },
        data,
      });
      // Upsert month 1 PDF if a new file was provided
      if (firstPdfUrl) {
        await prisma.submissionPdf.upsert({
          where: { submissionId_monthNumber: { submissionId, monthNumber: 1 } },
          update: { pdfUrl: firstPdfUrl },
          create: { submissionId, monthNumber: 1, pdfUrl: firstPdfUrl },
        });
      }
    } else {
      // First PDF is required for new submissions
      if (!firstPdfUrl) {
        return { status: "error", message: "Le PDF du mois 1 est obligatoire pour créer un dépôt." };
      }
      const newSub = await prisma.programSubmission.create({
        data: { ...data, coachId: coachProfile.id },
      });
      await prisma.submissionPdf.create({
        data: { submissionId: newSub.id, monthNumber: 1, pdfUrl: firstPdfUrl },
      });
    }

    revalidatePath("/coach-studio");
    return { status: "success", message: "Dépôt de programme envoyé à l'administration." };
  } catch (error) {
    return { status: "error", message: messageFromError(error) };
  }
}

export async function addSubmissionPdfAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await requireApprovedCoachUser();
    const coachProfile = user.coachProfile!;

    const submissionId = formData.get("submissionId");
    if (!submissionId || typeof submissionId !== "string") {
      return { status: "error", message: "Identifiant du dépôt manquant." };
    }

    const monthNumber = Number(formData.get("monthNumber"));
    if (!Number.isInteger(monthNumber) || monthNumber < 1) {
      return { status: "error", message: "Numéro de mois invalide." };
    }

    const label = (formData.get("label") as string | null)?.trim() || null;

    // Verify ownership
    const submission = await prisma.programSubmission.findFirst({
      where: { id: submissionId, coachId: coachProfile.id },
      select: { id: true, durationMonths: true },
    });
    if (!submission) {
      return { status: "error", message: "Dépôt introuvable." };
    }
    if (monthNumber > submission.durationMonths) {
      return { status: "error", message: `Ce programme ne dure que ${submission.durationMonths} mois.` };
    }

    const pdfFile = formData.get("pdfFile");
    if (!(pdfFile instanceof File) || pdfFile.size === 0) {
      return { status: "error", message: "Sélectionne un fichier PDF." };
    }

    const pdfUrl = await persistPdf(pdfFile);

    await prisma.submissionPdf.upsert({
      where: { submissionId_monthNumber: { submissionId, monthNumber } },
      update: { pdfUrl, label },
      create: { submissionId, monthNumber, pdfUrl, label: label ?? null },
    });

    revalidatePath("/coach-studio");
    return { status: "success", message: `PDF du mois ${monthNumber} enregistré.` };
  } catch (error) {
    return { status: "error", message: messageFromError(error) };
  }
}

export async function removeSubmissionPdfAction(pdfId: string): Promise<void> {
  const user = await requireApprovedCoachUser();
  const coachProfile = user.coachProfile!;

  const pdf = await prisma.submissionPdf.findFirst({
    where: {
      id: pdfId,
      submission: { coachId: coachProfile.id },
    },
    select: { id: true, pdfUrl: true },
  });
  if (!pdf) return;

  await prisma.submissionPdf.delete({ where: { id: pdfId } });

  // Remove physical file
  try {
    const absPath = getPublicAssetAbsolutePath(pdf.pdfUrl);
    await unlink(absPath);
  } catch { /* ignore if file already gone */ }

  revalidatePath("/coach-studio");
}

export async function adminReviewProgramSubmissionAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    await requireAdminUser();

    const submissionId = formData.get("submissionId");
    if (!submissionId || typeof submissionId !== "string") {
      return { status: "error", message: "Identifiant du dépôt manquant." };
    }

    const parsed = adminProgramSubmissionReviewSchema.safeParse({
      status: formData.get("status"),
      adminNotes: formData.get("adminNotes") || undefined,
    });

    if (!parsed.success) {
      return { status: "error", message: parsed.error.issues[0]?.message };
    }

    const submission = await prisma.programSubmission.findUnique({
      where: { id: submissionId },
      include: { coach: { select: { id: true, slug: true } } },
    });

    if (!submission) {
      return { status: "error", message: "Dépôt introuvable." };
    }

    let linkedProgramId: string | null = submission.linkedProgramId;

    if (parsed.data.status === "APPROVED" && !linkedProgramId) {
      const equipment: string[] = JSON.parse(submission.equipment) as string[];
      const equipmentLabel = [
        ...equipment,
        ...(submission.equipmentFreeText ? [submission.equipmentFreeText] : []),
      ].join(", ");

      // Map ProgramLevel to Difficulty (best effort)
      const levelToDifficulty: Record<string, string> = {
        ACCESSIBLE_TOUS: "DEBUTANT",
        DEBUTANT: "DEBUTANT",
        INTERMEDIAIRE: "INTERMEDIAIRE",
        AVANCE: "AVANCE",
        EXPERT: "EXPERT",
      };
      const difficulty = levelToDifficulty[submission.level] ?? "DEBUTANT";

      const program = await prisma.program.create({
        data: {
          coachId: submission.coach.id,
          title: submission.title,
          description: `${submission.description}\n\n[Niveau : ${submission.level.replace("_", " ")}] [Durée : ${submission.durationMonths} mois] [${submission.sessionsPerWeek} séances/sem.] [${submission.avgSessionMinutes} min/séance] [Matériel : ${equipmentLabel}]`,
          coverImage: submission.coverImageUrl,
          difficulty: difficulty as "DEBUTANT" | "INTERMEDIAIRE" | "AVANCE" | "EXPERT",
          totalDurationMinutes: submission.durationMonths * 4 * (parseInt(submission.sessionsPerWeek, 10) || 3) * submission.avgSessionMinutes,
          isPublished: true,
        },
      });
      linkedProgramId = program.id;
    }

    await prisma.programSubmission.update({
      where: { id: submissionId },
      data: {
        status: parsed.data.status,
        adminNotes: parsed.data.adminNotes ?? null,
        reviewedAt: new Date(),
        linkedProgramId,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/coach-studio");
    revalidatePath(`/coach/${submission.coach.slug}`);
    return {
      status: "success",
      message: parsed.data.status === "APPROVED" ? "Programme approuvé et publié." : "Dépôt refusé.",
    };
  } catch (error) {
    return { status: "error", message: messageFromError(error) };
  }
}

export async function adminReviewProgramSubmissionFormAction(formData: FormData): Promise<void> {
  await adminReviewProgramSubmissionAction({ status: "idle" }, formData);
}
