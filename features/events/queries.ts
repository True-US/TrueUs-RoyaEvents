import type { AdminEvent,Event } from "@/features/events/types";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/supabase/prisma";

/*
 * CUSTOMER QUERY
 *
 * This remains the existing customer-side query.
 */
export async function getPublishedEvents(): Promise<Event[]> {
  const db = await createClient();

  const { data, error } = await db
    .from("event_adventure")
    .select("*")
    .eq("event_type", "event")
    .eq("status", "PUBLISHED")
    .eq("is_active", true)
    .order("start_datetime", { ascending: true });

  if (error) {
    //console.error("Error fetching published events:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.event_adventure_id),
    title: row.title,
    slug: row.slug,
    summary: row.short_description ?? row.description ?? "",
    startsAt: row.start_datetime,
    location: "",
  }));
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  void slug;
  return null;
}



/*
 * ADMIN QUERY
 *
 * Admin needs to see ALL events, including inactive events.
 * We filter only eventType = "event" so adventures are excluded.
 */
export async function getAdminEvents(): Promise<AdminEvent[]> {
  const events = await prisma.eventAdventure.findMany({
    where: {
      eventType: "event",
    },
    include: {
      location: true,
    },
    orderBy: {
      startDatetime: "asc",
    },
  });

  return events.map((event) => ({
    id: String(event.id),
    title: event.title,
    slug: event.slug,
    summary: event.shortDescription ?? event.description ?? "",
    description: event.description ?? "",
    price: event.price === null ? null : Number(event.price),
    startsAt: event.startDatetime.toISOString(),
    endsAt: event.endDatetime
      ? event.endDatetime.toISOString()
      : null,
    status: event.status,
    capacity: event.capacity,
    availableSpots: event.availableSpots,
    eventType: event.eventType,
    isActive: event.isActive,

    location: event.location
      ? {
          id: event.location.id,
          name: event.location.name,
          address: event.location.address ?? "",
          city: event.location.city,
          province: event.location.province,
          postalCode: event.location.postalCode ?? "",
          country: event.location.country,
        }
      : null,
  }));
}