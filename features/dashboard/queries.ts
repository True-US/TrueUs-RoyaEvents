import "server-only";

import {
  ADMIN_BOOKINGS_PAGE_SIZE,
  type AdminBookingEvent,
  type AdminEventBookingsPage,
} from "./booking-types";
import { EVENT_TYPE } from "@/features/events/constants";
import { prisma } from "@/lib/supabase/prisma";
import type { ScheduleCalendarItem } from "./schedule-types";
import { getManagedProfilePage } from "./profile-management";
import { MANAGED_PROFILE_ROLE_IDS } from "./profile-management-types";

export async function getAdminBookingEvents(): Promise<AdminBookingEvent[]> {
  const now = new Date();
  const events = await prisma.eventAdventure.findMany({
    where: {
      isActive: true,
      OR: [
        { endDatetime: { gt: now } },
        { endDatetime: null, startDatetime: { gt: now } },
      ],
    },
    select: {
      id: true,
      title: true,
      eventType: true,
      status: true,
      capacity: true,
      availableSpots: true,
      startDatetime: true,
      endDatetime: true,
      location: {
        select: {
          name: true,
          address: true,
          city: true,
          province: true,
          country: true,
        },
      },
    },
    orderBy: { startDatetime: "asc" },
  });

  if (events.length === 0) return [];

  const confirmedBookings = await prisma.booking.groupBy({
    by: ["eventAdventureId"],
    where: {
      eventAdventureId: { in: events.map((event) => event.id) },
      status: "CONFIRMED",
      isActive: true,
    },
    _sum: { quantity: true },
  });
  const confirmedSpotsByEventId = new Map(
    confirmedBookings.map((booking) => [
      booking.eventAdventureId,
      booking._sum.quantity ?? 0,
    ]),
  );

  return events.map((event) => {
    return {
      id: event.id,
      title: event.title,
      eventType: event.eventType,
      status: event.status,
      capacity: event.capacity,
      availableSpots: event.availableSpots,
      spotsPurchased:
        event.capacity !== null && event.availableSpots !== null
          ? event.capacity - event.availableSpots
          : (confirmedSpotsByEventId.get(event.id) ?? 0),
      startDatetime: event.startDatetime.toISOString(),
      endDatetime: event.endDatetime?.toISOString() ?? null,
      location: event.location,
    };
  });
}

export async function getAdminEventBookingsPage(
  eventId: number,
  requestedPage: number,
): Promise<AdminEventBookingsPage | null> {
  const now = new Date();
  const event = await prisma.eventAdventure.findFirst({
    where: {
      id: eventId,
      isActive: true,
      OR: [
        { endDatetime: { gt: now } },
        { endDatetime: null, startDatetime: { gt: now } },
      ],
    },
    select: { id: true },
  });
  if (!event) return null;

  const where = { eventAdventureId: event.id };
  const totalBookings = await prisma.booking.count({ where });
  const totalPages = Math.max(
    1,
    Math.ceil(totalBookings / ADMIN_BOOKINGS_PAGE_SIZE),
  );
  const page = Math.min(requestedPage, totalPages);

  const bookings = await prisma.booking.findMany({
    where,
    select: {
      id: true,
      customerName: true,
      customerEmail: true,
      quantity: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * ADMIN_BOOKINGS_PAGE_SIZE,
    take: ADMIN_BOOKINGS_PAGE_SIZE,
  });

  return {
    bookings: bookings.map((booking) => ({
      id: booking.id,
      customerName: booking.profile
        ? `${booking.profile.firstName} ${booking.profile.lastName}`.trim()
        : booking.customerName ?? "Customer details unavailable",
      customerEmail: booking.profile?.email ?? booking.customerEmail,
      customerPhone: booking.profile?.phone ?? null,
      quantity: booking.quantity,
      status: booking.status,
      totalAmount: booking.totalAmount.toString(),
      createdAt: booking.createdAt.toISOString(),
    })),
    page,
    pageSize: ADMIN_BOOKINGS_PAGE_SIZE,
    totalBookings,
    totalPages,
  };
}

export async function getAdminScheduleItems(): Promise<ScheduleCalendarItem[]> {
  const items = await prisma.eventAdventure.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      eventType: true,
      status: true,
      isActive: true,
      startDatetime: true,
      endDatetime: true,
      location: { select: { name: true, city: true } },
    },
    orderBy: { startDatetime: "asc" },
  });

  return items.map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    eventType: item.eventType || EVENT_TYPE.EVENT,
    status: item.status,
    isActive: item.isActive,
    startsAt: item.startDatetime.toISOString(),
    endsAt: item.endDatetime?.toISOString() ?? null,
    location: item.location
      ? `${item.location.name}, ${item.location.city}`
      : null,
  }));
}

export async function getInitialManagedProfiles() {
  const [users, admins] = await Promise.all([
    getManagedProfilePage(MANAGED_PROFILE_ROLE_IDS.user, 1),
    getManagedProfilePage(MANAGED_PROFILE_ROLE_IDS.admin, 1),
  ]);

  return { users, admins };
}

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
    slug: booking.eventAdventure.slug,
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
        booking.eventStatus === "PUBLISHED" &&
        booking.status === "CONFIRMED",
    ),
  };
}
