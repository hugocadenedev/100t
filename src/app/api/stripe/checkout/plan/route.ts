import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { PLAN_COMMITMENT_MONTHS, PLAN_NAMES, PLAN_PRICES, SubscriptionPlan } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (user.role !== "USER") {
    return NextResponse.json({ error: "Seuls les abonnés peuvent souscrire à un abonnement." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const plan: unknown = body?.plan;

  if (!plan || typeof plan !== "string" || !(plan in SubscriptionPlan)) {
    return NextResponse.json({ error: "Plan invalide." }, { status: 400 });
  }

  // Prevent duplicate active subscription
  const existing = await prisma.subscription.findUnique({
    where: { subscriberId: user.id },
    select: { id: true, cancelAtPeriodEnd: true, currentPeriodEnd: true },
  });

  if (existing && !existing.cancelAtPeriodEnd && existing.currentPeriodEnd > new Date()) {
    return NextResponse.json(
      { error: "Tu as déjà un abonnement actif. Résilie-le avant d'en souscrire un nouveau." },
      { status: 409 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Get or create Stripe customer
  let stripeCustomerId = user.stripeCustomerId ?? null;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
  }

  const commitmentMonths = PLAN_COMMITMENT_MONTHS[plan] ?? 0;
  const hasCommitment = commitmentMonths > 0;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: PLAN_NAMES[plan] ?? plan,
            description: hasCommitment
              ? `Accès illimité à la plateforme — engagement ${commitmentMonths} mois, facturation mensuelle`
              : "Accès illimité à la plateforme — sans engagement",
          },
          unit_amount: PLAN_PRICES[plan],
          // All plans bill monthly — commitment is enforced at the app level
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/abonnement/succes?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/offres`,
    metadata: { userId: user.id, plan, commitmentMonths: String(commitmentMonths) },
    subscription_data: { metadata: { userId: user.id, plan, commitmentMonths: String(commitmentMonths) } },
  });

  return NextResponse.json({ url: session.url });
}
