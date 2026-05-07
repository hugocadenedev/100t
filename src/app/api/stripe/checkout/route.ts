import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { CoachApplicationStatus } from "@/lib/domain";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (user.role !== "USER") {
    return NextResponse.json(
      { error: "Seuls les abonnés peuvent souscrire à un abonnement." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const coachId: unknown = body?.coachId;

  if (!coachId || typeof coachId !== "string") {
    return NextResponse.json({ error: "coachId invalide." }, { status: 400 });
  }

  const coach = await prisma.coachProfile.findUnique({
    where: { id: coachId },
    select: {
      id: true,
      slug: true,
      approvalStatus: true,
      monthlyPrice: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });

  if (!coach || coach.approvalStatus !== CoachApplicationStatus.APPROVED) {
    return NextResponse.json(
      { error: "Coach introuvable ou non disponible à l'abonnement." },
      { status: 404 },
    );
  }

  // Prevent duplicate active subscription
  const existing = await prisma.subscription.findUnique({
    where: { subscriberId: user.id },
    select: { id: true, cancelAtPeriodEnd: true, currentPeriodEnd: true, coachId: true },
  });

  if (existing && !existing.cancelAtPeriodEnd && existing.currentPeriodEnd > new Date()) {
    return NextResponse.json(
      { error: "Tu as déjà un abonnement actif. Utilise l'option \"Changer de coach\" depuis ton tableau de bord." },
      { status: 409 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Get or create Stripe customer
  let stripeCustomerId = user.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
      metadata: { userId: user.id },
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId },
    });
  }

  const coachName =
    [coach.user.firstName, coach.user.lastName].filter(Boolean).join(" ") ||
    "Coach 100T";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Abonnement coaching — ${coachName}`,
            description: "Accès illimité à tous les programmes de coaching présents et futurs.",
          },
          unit_amount: coach.monthlyPrice * 100, // centimes
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/abonnement/succes?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/abonnement/annule?coach=${coach.slug}`,
    metadata: {
      userId: user.id,
      coachId: coach.id,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        coachId: coach.id,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
