import "server-only";

import { prisma } from "@/lib/supabase/prisma";

export async function getUserDashboardBookings(profileId: number) {
  const bookings = await prisma.booking.findMany({
    where: { profileId, isActive: true },
    include: {
      eventAdventure: {
        include: { location: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = Date.now();
  const dashboardBookings = bookings.map((booking) => ({
    id: booking.id,
    eventTitle: booking.eventAdventure.title,
    startsAt: booking.eventAdventure.startDatetime.toISOString(),
    location: booking.eventAdventure.location?.name ?? null,
    price: booking.eventAdventure.price?.toString() ?? null,
    isEventActive: booking.eventAdventure.isActive,
    eventStatus: booking.eventAdventure.status,
    status: booking.status,
    quantity: booking.quantity,
    totalAmount: booking.totalAmount.toString(),
    orderedAt: booking.createdAt.toISOString(),
    isBookingActive: booking.isActive,
  }));

  return {
    bookings: dashboardBookings,
    upcomingBookings: dashboardBookings.filter(
      (booking) =>
        new Date(booking.startsAt).getTime() >= now &&
        booking.isEventActive &&
        booking.isBookingActive &&
        booking.price !== null,
    ),
  };
}
