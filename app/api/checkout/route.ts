import { NextResponse } from "next/server";
import { z } from "zod";
import type Stripe from "stripe";

import {
  attachStripeSession,
  CheckoutError,
  createTicketReservation,
  releasePendingReservation,
} from "@/features/bookings/server/checkout";
import { MAX_TICKETS_PER_ORDER } from "@/features/bookings/constants";
import { getCurrentProfile } from "@/features/auth/current-profile";
import { getStripeClient } from "@/lib/stripe/server";

const checkoutSchema = z.object({
  slug: z.string().trim().min(1).max(255),
  quantity: z.number().int().min(1).max(MAX_TICKETS_PER_ORDER),
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(255),
});

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = checkoutSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid checkout details." },
      { status: 400 },
    );
  }

  try {
    const profile = await getCurrentProfile();
    if (profile && (!profile.isActive || !profile.role.isActive)) {
      return NextResponse.json(
        { message: "This account cannot purchase tickets." },
        { status: 403 },
      );
    }

    const buyer = profile
      ? {
          profileId: profile.id,
          name: parsed.data.name,
          email: parsed.data.email.toLowerCase(),
        }
      : {
          profileId: null,
          name: parsed.data.name,
          email: parsed.data.email.toLowerCase(),
        };

    const reservation = await createTicketReservation(
      parsed.data.slug,
      parsed.data.quantity,
      buyer,
    );

    if (reservation.amountInCents === 0) {
      return NextResponse.json({
        url: `/events/${encodeURIComponent(reservation.event.slug)}/checkout/success?booking=${reservation.booking.id}`,
      });
    }

    if (reservation.amountInCents < 50) {
      await releasePendingReservation(reservation.booking.id, "PAYMENT_FAILED");
      return NextResponse.json(
        { message: "Ticket prices must be at least $0.50 for online payment." },
        { status: 400 },
      );
    }

    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!configuredAppUrl) {
      await releasePendingReservation(reservation.booking.id, "PAYMENT_FAILED");
      throw new Error("NEXT_PUBLIC_APP_URL is not configured.");
    }
    let appUrl: URL;
    try {
      appUrl = new URL(configuredAppUrl);
      if (
        appUrl.protocol !== "https:" &&
        appUrl.hostname !== "localhost" &&
        appUrl.hostname !== "127.0.0.1"
      ) {
        throw new Error("NEXT_PUBLIC_APP_URL must use HTTPS outside local development.");
      }
    } catch (error) {
      await releasePendingReservation(reservation.booking.id, "PAYMENT_FAILED");
      throw error;
    }

    let session: Stripe.Checkout.Session | null = null;

    try {
      const stripe = getStripeClient();
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        client_reference_id: String(reservation.booking.id),
        customer_email: buyer.email,
        line_items: [
          {
            quantity: parsed.data.quantity,
            price_data: {
              currency: "cad",
              unit_amount: reservation.amountInCents / parsed.data.quantity,
              product_data: { name: reservation.event.title },
            },
          },
        ],
        metadata: { bookingId: String(reservation.booking.id) },
        success_url: `${appUrl.origin}/events/${encodeURIComponent(reservation.event.slug)}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl.origin}/events/${encodeURIComponent(reservation.event.slug)}/checkout?cancelled=1`,
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      });

      if (!session.url) {
        throw new Error("Stripe did not return a Checkout URL.");
      }

      await attachStripeSession(reservation.booking.id, session.id);

      return NextResponse.json({ url: session.url });
    } catch (error) {
      if (session?.status === "open") {
        try {
          await getStripeClient().checkout.sessions.expire(session.id);
        } catch (expireError) {
          console.error("Could not expire abandoned Stripe Checkout session:", expireError);
        }
      }
      try {
        await releasePendingReservation(reservation.booking.id, "PAYMENT_FAILED");
      } catch (releaseError) {
        console.error("Could not release failed ticket reservation:", releaseError);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("Create Stripe Checkout session error:", error);
    return NextResponse.json(
      { message: "Unable to start checkout. Please try again." },
      { status: 500 },
    );
  }
}
