import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";

export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : user.role === "COACH" ? "/coach-studio" : "/tableau-de-bord");
  }

  const { role } = await searchParams;
  const initialRole = role === "COACH" ? "COACH" : role === "USER" ? "USER" : undefined;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <RegisterForm initialRole={initialRole} />
    </div>
  );
}
