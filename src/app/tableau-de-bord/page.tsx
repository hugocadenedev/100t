import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { getUserDashboardData } from "@/lib/data";
import { UserDashboardClient } from "@/components/user-dashboard-client";
import { fullName } from "@/lib/utils";
import type { DifficultyValue } from "@/lib/domain";

export default async function TableauDeBordPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (user.role === "COACH") {
    redirect("/coach-studio");
  }

  const data = await getUserDashboardData(user.id);

  const availablePrograms = data.subscriptions.flatMap(
    (subscription: (typeof data.subscriptions)[number]) => {
      if (!subscription.coach) return [];
      return (subscription.coach.programs ?? []).map(
        (program: { id: string; title: string; description: string; difficulty: string; totalDurationMinutes: number }) => ({
          id: program.id,
          title: program.title,
          description: program.description,
          difficulty: program.difficulty as DifficultyValue,
          totalDurationMinutes: program.totalDurationMinutes,
          coachName: subscription.coach!.displayName,
          coachSlug: subscription.coach!.slug ?? "",
        }),
      );
    },
  );

  return (
    <UserDashboardClient
      data={data}
      availablePrograms={availablePrograms}
      displayName={fullName(user.firstName, user.lastName)}
    />
  );
}
