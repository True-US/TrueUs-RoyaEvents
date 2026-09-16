import type { Event } from "@/features/events/types";

export async function getPublishedEvents(): Promise<Event[]> {
  return [];
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  void slug;
  return null;
}
