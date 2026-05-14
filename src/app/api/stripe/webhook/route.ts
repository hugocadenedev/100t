import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Required to receive the raw body for signature verification
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET n'est pas configuré.");
    return NextResponse.json({ error: "Configuration webhook manquante." }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Vérification de la signature Stripe échouée :", err);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (err) {
    console.error("Erreur dans le gestionnaire webhook :", err);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, coachId, plan, commitmentMonths: commitmentMonthsStr } = session.metadata ?? {};
  if (!userId) return;
  if (session.mode !== "subscription" || !session.subscription) return;

  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription.id;

  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ["items"],
  });
  const firstItem = stripeSub.items.data[0];
  const currentPeriodEnd = firstItem
    ? new Date(firstItem.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Persist stripeCustomerId on the user if not already set
  if (session.customer && typeof session.customer === "string") {
    await prisma.user.updateMany({
      where: { id: userId, stripeCustomerId: null },
      data: { stripeCustomerId: session.customer },
    });
  }

  const commitmentMonths = parseInt(commitmentMonthsStr ?? "0", 10);
  const commitmentEndDate =
    commitmentMonths > 0
      ? new Date(Date.now() + commitmentMonths * 30 * 24 * 60 * 60 * 1000)
      : null;

  await prisma.subscription.upsert({
    where: { subscriberId: userId },
    update: {
      coachId: coachId ?? null,
      plan: plan ?? "ESSENTIELLE",
      stripeSubscriptionId,
      status: stripeSub.status,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      pendingCoachId: null,
      ...(commitmentEndDate ? { commitmentEndDate } : {}),
    },
    create: {
      subscriberId: userId,
      coachId: coachId ?? null,
      plan: plan ?? "ESSENTIELLE",
      stripeSubscriptionId,
      status: stripeSub.status,
      currentPeriodEnd,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      ...(commitmentEndDate ? { commitmentEndDate } : {}),
    },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const firstItem = subscription.items.data[0];
  const currentPeriodEnd = firstItem
    ? new Date(firstItem.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

// Apply pending coach switch when a subscription invoice is paid (renewal)
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subRef = invoice.parent?.subscription_details?.subscription;
  const stripeSubscriptionId =
    typeof subRef === "string" ? subRef : (subRef as Stripe.Subscription | null)?.id ?? null;

  if (!stripeSubscriptionId) return;

  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
    select: { id: true, pendingCoachId: true },
  });

  if (!sub || !sub.pendingCoachId) return;

  // Apply the scheduled coach switch
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      coachId: sub.pendingCoachId,
      pendingCoachId: null,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "canceled",
      cancelAtPeriodEnd: true,
    },
  });
}
