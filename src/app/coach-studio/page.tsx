import { redirect } from "next/navigation";

import { CoachStudioClient } from "@/components/coach-studio-client";
import { getCurrentUser } from "@/lib/auth";
import { getCoachStudioData } from "@/lib/data";

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

  const studio = await getCoachStudioData(user.id);

  if (!studio) {
    redirect("/inscription");
  }

  return <CoachStudioClient studio={studio} />;
}
