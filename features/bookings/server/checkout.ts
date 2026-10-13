import "server-only";

import { MAX_TICKETS_PER_ORDER } from "@/features/bookings/constants";
import { EVENT_STATUS, EVENT_TYPE } from "@/features/events/constants";
import { prisma } from "@/lib/supabase/prisma";

export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "CheckoutError";
  }
}

export type TicketBuyer = {
  profileId: number | null;
  name: string;
  email: string;
};

export async function createTicketReservation(
  slug: string,
  quantity: number,
  buyer: TicketBuyer,
) {
  if (quantity > MAX_TICKETS_PER_ORDER) {
    throw new CheckoutError(
      `You can purchase up to ${MAX_TICKETS_PER_ORDER} tickets per order.`,
      400,
    );
  }

  return prisma.$transaction(async (tx) => {
    const event = await tx.eventAdventure.findFirst({
      where: {
        slug,
        eventType: EVENT_TYPE.EVENT,
        status: EVENT_STATUS.PUBLISHED,
        isActive: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        price: true,
        startDatetime: true,
        endDatetime: true,
        capacity: true,
        availableSpots: true,
      },
    });

    if (!event) {
      throw new CheckoutError("This event is not available for purchase.", 404);
    }

    const now = new Date();
    if ((event.endDatetime ?? event.startDatetime) <= now) {
      throw new CheckoutError("This event has ended.", 409);
    }

    if (event.price && event.price.isNegative()) {
      throw new CheckoutError("This event has an invalid ticket price.", 409);
    }
    if (event.price && event.price.isPositive() && event.price.lessThan(0.5)) {
      throw new CheckoutError(
        "Ticket price must be at least $0.50 or free.",
        409,
      );
    }

    if (event.capacity !== null) {
      const inventory = await tx.eventAdventure.updateMany({
        where: {
          id: event.id,
          eventType: EVENT_TYPE.EVENT,
          status: EVENT_STATUS.PUBLISHED,
          isActive: true,
          availableSpots: { gte: quantity },
        },
        data: {
          availableSpots: { decrement: quantity },
        },
      });

      if (inventory.count !== 1) {
        throw new CheckoutError("There are not enough tickets available.", 409);
      }
    }

    const price = event.price ?? 0;
    const totalAmount = event.price?.mul(quantity) ?? 0;
    const booking = await tx.booking.create({
      data: {
        profileId: buyer.profileId,
        eventAdventureId: event.id,
        customerName: buyer.name,
        customerEmail: buyer.email,
        quantity,
        unitPrice: price,
        totalAmount,
        status: price === 0 ? "CONFIRMED" : "PENDING_PAYMENT",
        isActive: true,
      },
      select: {
        id: true,
        totalAmount: true,
      },
    });

    return {
      booking,
      event,
      amountInCents: Math.round(Number(booking.totalAmount) * 100),
    };
  });
}

export async function attachStripeSession(
  bookingId: number,
  sessionId: string,
): Promise<void> {
  await prisma.booking.update({
    where: { id: bookingId },
    data: { stripeCheckoutSessionId: sessionId },
  });
}

export async function releasePendingReservation(
  bookingId: number,
  status: "CANCELLED" | "PAYMENT_FAILED" | "EXPIRED",
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: {
        eventAdventureId: true,
        quantity: true,
        status: true,
      },
    });

    if (!booking || booking.status !== "PENDING_PAYMENT") {
      return;
    }

    const updated = await tx.booking.updateMany({
      where: {
        id: bookingId,
        status: "PENDING_PAYMENT",
      },
      data: {
        status,
        isActive: false,
      },
    });

    if (updated.count === 1) {
      await tx.eventAdventure.updateMany({
        where: {
          id: booking.eventAdventureId,
          capacity: { not: null },
        },
        data: {
          availableSpots: { increment: booking.quantity },
        },
      });
    }
  });
}

export async function confirmPaidReservation(
  bookingId: number,
  sessionId: string,
  paymentIntentId: string | null,
  amountInCents: number,
  currency: string | null,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        stripeCheckoutSessionId: true,
        stripePaymentIntentId: true,
        totalAmount: true,
      },
    });

    if (!booking || booking.stripeCheckoutSessionId !== sessionId) {
      throw new Error("Stripe session does not match a ticket reservation.");
    }

    const expectedAmount = Math.round(Number(booking.totalAmount) * 100);
    if (currency !== "cad" || amountInCents !== expectedAmount) {
      throw new Error("Stripe payment amount does not match the reservation.");
    }

    if (booking.status === "CONFIRMED") {
      return;
    }
    if (booking.status !== "PENDING_PAYMENT") {
      throw new Error("Ticket reservation is no longer awaiting payment.");
    }

    const updated = await tx.booking.updateMany({
      where: {
        id: bookingId,
        status: "PENDING_PAYMENT",
      },
      data: {
        status: "CONFIRMED",
        stripePaymentIntentId: paymentIntentId,
      },
    });

    if (updated.count !== 1) {
      throw new Error("Ticket reservation could not be confirmed.");
    }
  });
}
