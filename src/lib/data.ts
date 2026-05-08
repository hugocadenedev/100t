import "server-only";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fullName } from "@/lib/utils";

type MarketplaceSort = "popular" | "price-asc" | "price-desc" | "newest";
type MarketplacePrice = "all" | "under-30" | "30-45" | "45-plus";
type MarketplaceCoachRecord = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  slug: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  headline: string;
  bio: string;
  photoUrl: string | null;
  monthlyPrice: number;
  discipline: string;
  specialities: string;
  skills: string;
  experienceYears: number;
  coachedClientsCount: number;
  city: string;
  country: string;
  user: {
    firstName: string;
    lastName: string;
  };
  _count: {
    subscriptions: number;
    programs: number;
  };
};

export async function getMarketplaceData(
  search?: string,
  discipline?: string,
  speciality?: string,
  price: MarketplacePrice = "all",
  sort: MarketplaceSort = "popular",
) {
  const user = await getCurrentUser();
  const filters: Array<Record<string, unknown>> = [{ approvalStatus: "APPROVED" }];

  if (discipline) {
    filters.push({
      OR: [
        { category: { slug: discipline } },
        { category: { name: discipline } },
      ],
    });
  }

  if (speciality) {
    filters.push({ specialities: { contains: speciality, mode: "insensitive" as const } });
  }

  if (price === "under-30") {
    filters.push({ monthlyPrice: { lt: 30 } });
  }

  if (price === "30-45") {
    filters.push({ monthlyPrice: { gte: 30, lte: 45 } });
  }

  if (price === "45-plus") {
    filters.push({ monthlyPrice: { gt: 45 } });
  }

  if (search) {
    filters.push({
      OR: [
        { discipline: { contains: search } },
        { specialities: { contains: search } },
        { headline: { contains: search } },
        { city: { contains: search } },
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
      ],
    });
  }

  const where = filters.length ? { AND: filters } : {};
  const orderBy =
    sort === "price-asc"
      ? [{ monthlyPrice: "asc" as const }, { createdAt: "desc" as const }]
      : sort === "price-desc"
        ? [{ monthlyPrice: "desc" as const }, { createdAt: "desc" as const }]
        : sort === "newest"
          ? [{ createdAt: "desc" as const }]
          : [{ subscriptions: { _count: "desc" as const } }, { createdAt: "desc" as const }];

  const [coachesRaw, categoriesFromDb, allSpecialities] = await Promise.all([
    prisma.coachProfile.findMany({
      where,
      orderBy,
      include: {
        user: true,
        _count: {
          select: {
            subscriptions: true,
            programs: true,
          },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.coachProfile.findMany({
      where: {
        approvalStatus: "APPROVED",
      },
      select: {
        specialities: true,
      },
    }),
  ]);

  const coaches = coachesRaw as MarketplaceCoachRecord[];

  const specialityValues: string[] = allSpecialities
    .flatMap((item: { specialities: string }) => item.specialities.split(","))
    .map((item: string) => item.trim())
    .filter(Boolean);

  const specialities = [...new Set<string>(specialityValues)].sort((left, right) => left.localeCompare(right, "fr"));

  // Only use official admin-created categories as discipline filters
  const uniqueDisciplines: string[] = categoriesFromDb.map((c: { name: string }) => c.name);

  return {
    user,
    disciplines: uniqueDisciplines,
    specialities,
    coaches: coaches.map((coach: (typeof coaches)[number]) => ({
      ...coach,
      displayName: fullName(coach.user.firstName, coach.user.lastName),
    })),
  };
}

export async function getCoachPageData(slug: string) {
  const user = await getCurrentUser();
  const coach = await prisma.coachProfile.findUnique({
    where: { slug },
    include: {
      user: true,
      programs: {
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          coverImage: true,
          pdfUrl: true,
          difficulty: true,
          totalDurationMinutes: true,
          _count: {
            select: {
              workoutSessions: true,
            },
          },
        },
      },
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });

  if (!coach || coach.approvalStatus !== "APPROVED") {
    return { user, coach: null, isSubscribed: false };
  }

  const isOwner = user?.coachProfile?.id === coach.id;

  // Find any active subscription for this user (one sub per user)
  const activeSubscription = user
    ? await prisma.subscription.findUnique({
        where: { subscriberId: user.id },
        select: {
          id: true,
          coachId: true,
          plan: true,
          currentPeriodEnd: true,
          cancelAtPeriodEnd: true,
          pendingCoachId: true,
        },
      })
    : null;

  const hasActivePlatformSub = Boolean(
    user?.role === "ADMIN" ||
      isOwner ||
      (activeSubscription && activeSubscription.currentPeriodEnd > new Date() && !activeSubscription.cancelAtPeriodEnd),
  );

  // Legacy: was subscribed to this specific coach
  const isSubscribed = Boolean(
    user?.role === "ADMIN" ||
      isOwner ||
      (activeSubscription &&
        activeSubscription.coachId === coach.id &&
        activeSubscription.currentPeriodEnd > new Date()),
  );

  // Current month selections for the user (to show which programs are already selected)
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthlySelections = user
    ? await prisma.monthlyProgramSelection.findMany({
        where: { userId: user.id, month: currentMonth, year: currentYear },
        select: { programId: true },
      })
    : [];
  const selectedProgramIds = new Set(monthlySelections.map((s) => s.programId));

  // Plan monthly limit
  const planLimit = activeSubscription ? (
    activeSubscription.plan === "PREMIUM" ? 3 : 1
  ) : 0;
  const selectionLimitReached = selectedProgramIds.size >= planLimit;

  // Can the user subscribe to this coach?
  const hasActiveSubElsewhere = Boolean(
    activeSubscription &&
      activeSubscription.coachId !== coach.id &&
      activeSubscription.currentPeriodEnd > new Date() &&
      !activeSubscription.cancelAtPeriodEnd,
  );

  // Is a switch to this coach already scheduled?
  const switchPendingToThisCoach = Boolean(
    activeSubscription && activeSubscription.pendingCoachId === coach.id,
  );

  // Fetch submission metadata (durationMonths, sessionsPerWeek, level) for each program
  const programIds = coach.programs.map((p) => p.id);
  const submissions = programIds.length
    ? await prisma.programSubmission.findMany({
        where: { linkedProgramId: { in: programIds } },
        select: {
          linkedProgramId: true,
          durationMonths: true,
          sessionsPerWeek: true,
          level: true,
        },
      })
    : [];
  const submissionByProgramId = Object.fromEntries(
    submissions.map((s) => [s.linkedProgramId, s]),
  );

  return {
    user,
    coach: {
      ...coach,
      programs: coach.programs.map((program) => ({
        ...program,
        pdfUrl: (program as { pdfUrl?: string | null }).pdfUrl ?? null,
        submissionMeta: submissionByProgramId[program.id] ?? null,
      })),
      displayName: fullName(coach.user.firstName, coach.user.lastName),
    },
    isSubscribed,
    hasActivePlatformSub,
    selectedProgramIds,
    planLimit,
    selectionLimitReached,
    hasActiveSubElsewhere,
    switchPendingToThisCoach,
    activeSubscription,
  };
}

export async function getProgramPageData(programId: string) {
  const user = await getCurrentUser();
  const program = await prisma.program.findUnique({
    where: { id: programId },
    select: {
      id: true,
      coachId: true,
      coach: {
        select: {
          id: true,
          slug: true,
          userId: true,
        },
      },
    },
  });

  if (!program) {
    return null;
  }

  const isOwner = user?.coachProfile?.id === program.coachId;
  const subscription = user
    ? await prisma.subscription.findUnique({
        where: { subscriberId: user.id },
      })
    : null;

  // Check monthly selection (new plan-based model)
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthlySelection = user
    ? await prisma.monthlyProgramSelection.findUnique({
        where: {
          userId_programId_month_year: {
            userId: user.id,
            programId,
            month: currentMonth,
            year: currentYear,
          },
        },
      })
    : null;

  // Legacy check: old-style coach subscription
  const hasLegacyCoachSub = Boolean(
    subscription &&
      subscription.coachId === program.coachId &&
      subscription.currentPeriodEnd > new Date(),
  );

  const canAccess = Boolean(
    user?.role === "ADMIN" ||
      isOwner ||
      monthlySelection !== null ||
      hasLegacyCoachSub,
  );

  const coachSlug = program.coach.slug;

  const fullProgram = await prisma.program.findUnique({
    where: { id: programId },
    include: {
      coach: {
        include: {
          user: true,
        },
      },
      workoutSessions: {
        orderBy: { order: "asc" },
        include: {
          exerciseBlocks: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!fullProgram) {
    return null;
  }

  // Fetch monthly PDFs from the linked submission
  const submission = await prisma.programSubmission.findFirst({
    where: { linkedProgramId: programId },
    include: { pdfs: { orderBy: { monthNumber: "asc" } } },
  });

  if (user) {
    await prisma.viewedProgram.upsert({
      where: {
        userId_programId: {
          userId: user.id,
          programId,
        },
      },
      update: {
        lastViewedAt: new Date(),
      },
      create: {
        userId: user.id,
        programId,
      },
    });
  }

  return {
    user,
    canAccess,
    program: {
      ...fullProgram,
      pdfUrl: (fullProgram as { pdfUrl?: string | null }).pdfUrl ?? null,
      coachName: fullName(fullProgram.coach.user.firstName, fullProgram.coach.user.lastName),
      coachSlug,
      monthlyPdfs: submission?.pdfs ?? [],
      submissionMeta: submission
        ? {
            durationMonths: submission.durationMonths,
            sessionsPerWeek: submission.sessionsPerWeek,
            avgSessionMinutes: submission.avgSessionMinutes,
            equipment: submission.equipment,
            level: submission.level,
          }
        : null,
    },
  };
}

export async function getUserDashboardData(userId: string) {
  const [subscriptions, recentPrograms, monthlySelections] = await Promise.all([
    prisma.subscription.findMany({
      where: {
        subscriberId: userId,
        currentPeriodEnd: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        coach: {
          include: {
            user: true,
            programs: {
              where: { isPublished: true },
              orderBy: { createdAt: "desc" },
              include: {
                _count: { select: { workoutSessions: true } },
              },
            },
          },
        },
        pendingCoach: {
          include: { user: true },
        },
      },
    }),
    prisma.viewedProgram.findMany({
      where: { userId },
      orderBy: { lastViewedAt: "desc" },
      take: 4,
      include: {
        program: {
          include: {
            coach: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    }),
    prisma.monthlyProgramSelection.findMany({
      where: { userId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 12,
      include: {
        program: {
          include: {
            coach: {
              include: { user: true },
            },
          },
        },
      },
    }),
  ]);

  return {
    subscriptions: subscriptions.map((subscription: (typeof subscriptions)[number]) => ({
      ...subscription,
      coach: subscription.coach ? {
        ...subscription.coach,
        displayName: fullName(subscription.coach.user.firstName, subscription.coach.user.lastName),
      } : null,
      pendingCoach: subscription.pendingCoach
        ? {
            ...subscription.pendingCoach,
            displayName: fullName(
              subscription.pendingCoach.user.firstName,
              subscription.pendingCoach.user.lastName,
            ),
          }
        : null,
    })),
    recentPrograms: recentPrograms.map((item: (typeof recentPrograms)[number]) => ({
      ...item,
      program: {
        ...item.program,
        coachName: fullName(item.program.coach.user.firstName, item.program.coach.user.lastName),
      },
    })),
    monthlySelections: monthlySelections.map((sel: (typeof monthlySelections)[number]) => ({
      ...sel,
      program: {
        ...sel.program,
        coachName: fullName(sel.program.coach.user.firstName, sel.program.coach.user.lastName),
        coachSlug: sel.program.coach.slug,
      },
    })),
  };
}

export async function getCoachStudioData(userId: string) {
  const coach = await prisma.coachProfile.findUnique({
    where: { userId },
    include: {
      user: true,
      programs: {
        orderBy: { createdAt: "desc" },
        include: {
          workoutSessions: {
            orderBy: { order: "asc" },
            include: {
              exerciseBlocks: {
                orderBy: { order: "asc" },
              },
            },
          },
        },
      },
      programSubmissions: {
        orderBy: { createdAt: "desc" },
        include: {
          pdfs: { orderBy: { monthNumber: "asc" } },
        },
      },
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });

  if (!coach) {
    return null;
  }

  const totalSessions = coach.programs.reduce(
    (sum: number, program: (typeof coach.programs)[number]) => sum + program.workoutSessions.length,
    0,
  );

  return {
    coach: {
      ...coach,
      displayName: fullName(coach.user.firstName, coach.user.lastName),
    },
    metrics: {
      subscribers: coach._count.subscriptions,
      programs: coach.programs.length,
      sessions: totalSessions,
    },
  };
}

export async function getAdminDashboardData() {
  const [
    totalUsers,
    totalSubscribers,
    totalCoachAccounts,
    approvedCoaches,
    pendingCoachApplications,
    totalAdmins,
    totalPrograms,
    publishedPrograms,
    totalSubscriptions,
    totalSessions,
    users,
    coaches,
    coachOptions,
    coachApplications,
    programs,
    subscriptions,
    programSubmissions,
    categories,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "COACH" } }),
    prisma.coachProfile.count({ where: { approvalStatus: "APPROVED" } }),
    prisma.coachProfile.count({ where: { approvalStatus: "PENDING" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.program.count(),
    prisma.program.count({ where: { isPublished: true } }),
    prisma.subscription.count(),
    prisma.workoutSession.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        coachProfile: {
          select: {
            id: true,
            slug: true,
            discipline: true,
            approvalStatus: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    }),
    prisma.coachProfile.findMany({
      where: {
        approvalStatus: "APPROVED",
      },
      orderBy: [{ subscriptions: { _count: "desc" } }, { createdAt: "desc" }],
      take: 8,
      include: {
        user: true,
        _count: {
          select: {
            subscriptions: true,
            programs: true,
          },
        },
      },
    }),
    prisma.coachProfile.findMany({
      orderBy: [{ approvalStatus: "asc" }, { createdAt: "desc" }],
      include: {
        user: true,
        category: true,
      },
    }),
    prisma.coachProfile.findMany({
      where: {
        approvalStatus: {
          not: "APPROVED",
        },
      },
      orderBy: [{ approvalStatus: "asc" }, { createdAt: "desc" }],
      take: 12,
      include: {
        user: true,
      },
    }),
    prisma.program.findMany({
      orderBy: { updatedAt: "desc" },
      take: 12,
      include: {
        coach: {
          include: {
            user: true,
          },
        },
        _count: {
          select: {
            workoutSessions: true,
          },
        },
      },
    }),
    prisma.subscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        subscriber: true,
        coach: {
          include: {
            user: true,
          },
        },
      },
    }),
    prisma.programSubmission.findMany({
      orderBy: [
        { createdAt: "desc" },
      ],
      include: {
        coach: {
          include: { user: true },
        },
        pdfs: { orderBy: { monthNumber: "asc" } },
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { coaches: true },
        },
      },
    }),
  ]);

  return {
    metrics: {
      totalUsers,
      totalSubscribers,
      totalCoachAccounts,
      approvedCoaches,
      pendingCoachApplications,
      totalAdmins,
      totalPrograms,
      publishedPrograms,
      unpublishedPrograms: totalPrograms - publishedPrograms,
      totalSubscriptions,
      totalSessions,
    },
    users: users.map((user: (typeof users)[number]) => ({
      ...user,
      displayName: fullName(user.firstName, user.lastName),
    })),
    coaches: coaches.map((coach: (typeof coaches)[number]) => ({
      ...coach,
      displayName: fullName(coach.user.firstName, coach.user.lastName),
    })),
    coachOptions: coachOptions.map((coach: (typeof coachOptions)[number]) => ({
      id: coach.id,
      slug: coach.slug,
      approvalStatus: coach.approvalStatus,
      discipline: coach.discipline,
      categoryId: coach.categoryId ?? null,
      categoryName: coach.category?.name ?? null,
      displayName: fullName(coach.user.firstName, coach.user.lastName),
    })),
    coachApplications: coachApplications.map((coach: (typeof coachApplications)[number]) => ({
      ...coach,
      displayName: fullName(coach.user.firstName, coach.user.lastName),
    })),
    programs: programs.map((program: (typeof programs)[number]) => ({
      ...program,
      pdfUrl: (program as { pdfUrl?: string | null }).pdfUrl ?? null,
      coachName: fullName(program.coach.user.firstName, program.coach.user.lastName),
    })),
    subscriptions: subscriptions.map((subscription: (typeof subscriptions)[number]) => ({
      ...subscription,
      subscriberName: fullName(subscription.subscriber.firstName, subscription.subscriber.lastName),
      coachName: subscription.coach ? fullName(subscription.coach.user.firstName, subscription.coach.user.lastName) : "",
    })),
    programSubmissions: programSubmissions.map((sub: (typeof programSubmissions)[number]) => ({
      ...sub,
      coachName: fullName(sub.coach.user.firstName, sub.coach.user.lastName),
      coachSlug: sub.coach.slug,
    })),
    categories: categories.map((cat: (typeof categories)[number]) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      createdAt: cat.createdAt,
      coachCount: cat._count.coaches,
    })),
  };
}
