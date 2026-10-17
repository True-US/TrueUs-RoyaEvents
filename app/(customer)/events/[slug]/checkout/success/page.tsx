import Link from "next/link";
import { notFound } from "next/navigation";

import { confirmPaidReservation } from "@/features/bookings/server/checkout";
import { prisma } from "@/lib/supabase/prisma";
import { getStripeClient } from "@/lib/stripe/server";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: PageProps<"/events/[slug]/checkout/success">) {
  const { slug } = await params;
  const query = await searchParams;
  const bookingParam =
    typeof query.booking === "string" ? Number(query.booking) : NaN;

  let eventTitle = "";

  if (Number.isSafeInteger(bookingParam) && bookingParam > 0) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingParam },
      select: {
        status: true,
        eventAdventure: { select: { title: true, slug: true } },
      },
    });
    if (
      !booking ||
      booking.status !== "CONFIRMED" ||
      booking.eventAdventure.slug !== slug
    ) {
      notFound();
    }
    eventTitle = booking.eventAdventure.title;
  } else if (typeof query.session_id === "string") {
    const session = await getStripeClient().checkout.sessions.retrieve(
      query.session_id,
    );
    const bookingId = Number(session.metadata?.bookingId);
    if (
      !Number.isSafeInteger(bookingId) ||
      bookingId < 1 ||
      session.payment_status !== "paid"
    ) {
      notFound();
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        stripeCheckoutSessionId: true,
        eventAdventure: { select: { title: true, slug: true } },
      },
    });
    if (
      !booking ||
      booking.stripeCheckoutSessionId !== session.id ||
      booking.eventAdventure.slug !== slug
    ) {
      notFound();
    }
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);
    await confirmPaidReservation(
      bookingId,
      session.id,
      paymentIntentId,
      session.amount_total ?? -1,
      session.currency,
    );
    eventTitle = booking.eventAdventure.title;
  } else {
    notFound();
  }

  return (
    <section className="mx-auto max-w-2xl px-6 py-16 text-center sm:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-roya-sun-deep">
        Payment confirmed
      </p>
      <h1 className="mt-4 font-display text-4xl font-bold uppercase tracking-tight text-roya-ink">
        You&apos;re going to {eventTitle}
      </h1>
      <p className="mt-5 leading-7 text-roya-slate">
        Stripe confirmed your payment and your ticket is confirmed. A receipt
        will be sent to the email address used at checkout.
      </p>
      <Link
        className="mt-8 inline-block rounded-full bg-roya-sun px-6 py-3 font-semibold text-roya-ink hover:bg-roya-ink hover:text-white"
        href="/dashboard"
      >
        View your bookings
      </Link>
    </section>
  );
}
