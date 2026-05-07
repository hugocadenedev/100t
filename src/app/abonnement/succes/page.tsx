import Link from "next/link";
import { redirect } from "next/navigation";
import type Stripe from "stripe";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const metadata = { title: "Abonnement activé — 100T" };

async function activateSubscriptionFromSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (session.payment_status !== "paid" && session.status !== "complete") {
    return false;
  }

  const { userId, coachId, plan, commitmentMonths } = session.metadata ?? {};
  if (!userId) return false;
  if (!coachId && !plan) return false;

  const stripeSub = session.subscription as Stripe.Subscription | null;
  if (!stripeSub) return false;

  const firstItem = stripeSub.items?.data[0];
  const currentPeriodEnd = firstItem
    ? new Date(firstItem.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Compute commitment end date if applicable
  const commitmentMonthsNum = commitmentMonths ? parseInt(commitmentMonths, 10) : 0;
  const subscriptionStart = new Date(stripeSub.start_date * 1000);
  const commitmentEndDate =
    commitmentMonthsNum > 0
      ? new Date(subscriptionStart.getFullYear(), subscriptionStart.getMonth() + commitmentMonthsNum, subscriptionStart.getDate())
      : null;

  // Persist stripeCustomerId on the user if not already set
  if (session.customer && typeof session.customer === "string") {
    await prisma.user.updateMany({
      where: { id: userId, stripeCustomerId: null },
      data: { stripeCustomerId: session.customer },
    });
  }

  // Idempotent upsert — safe to call even if webhook already ran
  await prisma.subscription.upsert({
    where: { subscriberId: userId },
    update: {
      coachId: coachId ?? null,
      plan: plan ?? "ESSENTIELLE",
      stripeSubscriptionId: stripeSub.id,
      status: stripeSub.status,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      commitmentEndDate,
      pendingCoachId: null,
    },
    create: {
      subscriberId: userId,
      coachId: coachId ?? null,
      plan: plan ?? "ESSENTIELLE",
      stripeSubscriptionId: stripeSub.id,
      status: stripeSub.status,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      commitmentEndDate,
    },
  });

  return true;
}

export default async function AbonnementSuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");

  const { session_id } = await searchParams;
  let activated = false;

  if (session_id) {
    try {
      activated = await activateSubscriptionFromSession(session_id);
    } catch {
      // Webhook may have already handled it — check DB directly
      const sub = await prisma.subscription.findUnique({
        where: { subscriberId: user.id },
        select: { id: true, currentPeriodEnd: true },
      });
      activated = Boolean(sub && sub.currentPeriodEnd > new Date());
    }
  } else {
    // No session_id: check if subscription already exists (e.g. direct nav)
    const sub = await prisma.subscription.findUnique({
      where: { subscriberId: user.id },
      select: { id: true, currentPeriodEnd: true },
    });
    activated = Boolean(sub && sub.currentPeriodEnd > new Date());
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md space-y-6">
        <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full text-4xl ${activated ? "bg-emerald-400/15" : "bg-amber-400/15"}`}>
          {activated ? "✓" : "⏳"}
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">
          {activated ? "Abonnement activé !" : "Paiement en cours de traitement…"}
        </h1>
        <p className="text-sm leading-7 text-white/62">
          {activated
            ? "Ton paiement a bien été confirmé. Tu as maintenant accès à tous les programmes de ton coach."
            : "Ton paiement est en cours de vérification. Actualise la page dans quelques secondes ou accède à ton tableau de bord."}
        </p>
        <Link
          href="/tableau-de-bord"
          className="app-button-accent inline-block px-8 py-3 text-sm font-bold uppercase tracking-wider"
        >
          Accéder à mon tableau de bord
        </Link>
      </div>
    </main>
  );
}
