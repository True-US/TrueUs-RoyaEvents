import type { Adventure } from "@/features/adventures/types";

export async function getPublishedAdventures(): Promise<Adventure[]> {
  return [];
}

export async function getAdventureBySlug(
  slug: string,
): Promise<Adventure | null> {
  void slug;
  return null;
}
