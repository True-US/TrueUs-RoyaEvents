import { NextResponse } from "next/server";
import type Stripe from "stripe";

import {
  confirmPaidReservation,
  releasePendingReservation,
} from "@/features/bookings/server/checkout";
import { prisma } from "@/lib/supabase/prisma";
import { getStripeClient } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return NextResponse.json(
      { message: "Stripe webhook is not configured." },
      { status: 500 },
    );
  }
  if (!signature) {
    return NextResponse.json(
      { message: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  let stripeEvent: Stripe.Event;
  try {
    const rawBody = await request.text();
    stripeEvent = getStripeClient().webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ message: "Invalid Stripe webhook." }, { status: 400 });
  }

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = stripeEvent.data.object;
        if (session.payment_status !== "paid") {
          break;
        }

        const bookingId = Number(session.metadata?.bookingId);
        if (!Number.isSafeInteger(bookingId) || bookingId < 1) {
          throw new Error("Stripe Checkout session has no valid booking ID.");
        }

        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

        await confirmPaidReservation(
          bookingId,
          session.id,
          paymentIntentId,
          session.amount_total ?? -1,
          session.currency,
        );
        break;
      }

      case "checkout.session.expired":
      case "checkout.session.async_payment_failed": {
        const session = stripeEvent.data.object;
        const booking = await prisma.booking.findUnique({
          where: { stripeCheckoutSessionId: session.id },
          select: { id: true },
        });

        if (booking) {
          await releasePendingReservation(
            booking.id,
            stripeEvent.type === "checkout.session.expired"
              ? "EXPIRED"
              : "PAYMENT_FAILED",
          );
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);
    return NextResponse.json(
      { message: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
