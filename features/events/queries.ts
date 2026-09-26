import type { Event } from "@/features/events/types";
import { createClient } from "@/lib/supabase/server";

export async function getPublishedEvents(): Promise<Event[]> {
  const db = await createClient();
  
  // Get all events with status "published", ordered by start date ascending.
  const { data, error } = await db
    .from("events")
    .select("*")
    .eq("status", "published") // TODO: Staus should be an enum.
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("Error fetching published events:", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary ?? "",
    startsAt: row.starts_at,
    location: row.location ?? "",
  }));
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  void slug;
  return null;
}
