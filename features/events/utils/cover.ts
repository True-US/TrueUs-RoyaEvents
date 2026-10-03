import { EVENT_COVER_BUCKET } from "@/features/events/constants";

/**
 * Turns event_adventure.cover_image_path into an image URL.
 * - "https://...": seed data (Picsum), already a full URL.
 * - "events/12/cover-123.webp": an uploaded file in the public bucket.
 * Public bucket URLs follow a fixed pattern, so no Supabase client or network call is needed.
 * @param path The stored cover path, or null if the event has no cover.
 * @returns The image URL, or null if there is no cover.
 */
export function getCoverUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }

  if (path.startsWith("https://")) {
    return path;
  }

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${EVENT_COVER_BUCKET}/${path}`;
}
