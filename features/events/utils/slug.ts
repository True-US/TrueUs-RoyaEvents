import { EVENT_SLUG_MAX } from "@/features/events/constants";

// Length of the random ending added to public request slugs: "-k3x9ab".
const SUFFIX_LENGTH: number = 6;

/**
 * Turns a title into a URL slug: lowercase letters and digits joined by single hyphens.
 * @param title The event title.
 * @param unique True to add a short random ending, so two events with the same
 *   title don't clash on the unique slug column.
 * @returns The slug, never empty and never longer than EVENT_SLUG_MAX.
 */
export function makeSlug(title: string, unique: boolean = false): string {
  const suffix: string = unique ? `-${Math.random().toString(36).slice(2, 2 + SUFFIX_LENGTH)}` : "";
  const base: string = title
    .normalize("NFKD")
    // Drop accent marks left over after splitting "é" into "e" + "´".
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, EVENT_SLUG_MAX - suffix.length)
    .replace(/-+$/g, "");

  return `${base || "event"}${suffix}`;
}
