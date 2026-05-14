import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/auth-forms";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function InscriptionPage({ searchParams }: { searchParams: Promise<{ role?: string; redirectAfter?: string }> }) {
  const user = await getCurrentUser();

  if (user) {
    redirect(user.role === "ADMIN" ? "/admin" : user.role === "COACH" ? "/coach-studio" : "/tableau-de-bord");
  }

  const { role, redirectAfter } = await searchParams;
  const initialRole = role === "COACH" ? "COACH" : role === "USER" ? "USER" : undefined;

  // Validate redirectAfter is a safe relative URL
  const safeRedirectAfter = typeof redirectAfter === "string" && redirectAfter.startsWith("/") && !redirectAfter.startsWith("//")
    ? redirectAfter
    : undefined;

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <RegisterForm initialRole={initialRole} categories={categories} redirectAfter={safeRedirectAfter} />
    </div>
  );
}
