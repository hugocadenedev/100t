import { notFound } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth-forms";
import { prisma } from "@/lib/prisma";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { id: true, expiresAt: true, usedAt: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
      <ResetPasswordForm token={token} />
    </div>
  );
}
