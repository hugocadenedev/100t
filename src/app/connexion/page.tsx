import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<{ redirectAfter?: string }> }) {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : user.role === "COACH" ? "/coach-studio" : "/tableau-de-bord");
  }

  const { redirectAfter } = await searchParams;
  const safeRedirectAfter = typeof redirectAfter === "string" && redirectAfter.startsWith("/") && !redirectAfter.startsWith("//")
    ? redirectAfter
    : undefined;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <LoginForm redirectAfter={safeRedirectAfter} />
    </div>
  );
}
