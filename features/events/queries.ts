import type { Event } from "@/features/events/types";
import { createClient } from "@/lib/supabase/server";

export async function getPublishedEvents(): Promise<Event[]> {
  const db = await createClient();

  const { data, error } = await db
    .from("event_adventure")
    .select("*")
    .eq("status", "PUBLISHED")
    .order("start_datetime", { ascending: true });

  if (error) {
    console.error("Error fetching published events:", error.message);
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
