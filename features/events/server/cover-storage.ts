// Fails the build if a Client Component imports this file.
import "server-only";

import {
  COVER_CONTENT_TYPE,
  COVER_MAX_BYTES,
  EVENT_COVER_BUCKET,
} from "@/features/events/constants";
import { createAdminClient } from "@/lib/supabase/admin";

// Everything that touches the event-covers bucket. The bucket is public to
// read but has no write policies, so only the service-role client (server
// only) can upload or delete.
//
// Files live at events/{eventId}/cover-{timestamp}.webp. The timestamp makes
// every upload a new path, so browsers and CDNs can cache a cover forever,
// and a replaced cover can't be served from a stale cache.

// COVER_MAX_BYTES and COVER_CONTENT_TYPE live in constants.ts, so the
// browser's cover picker applies the same limits before uploading.

// Paths have unique names, so a year of caching is safe.
const COVER_CACHE_SECONDS: string = String(60 * 60 * 24 * 365);

// The Storage API for one bucket, as returned by supabase.storage.from().
type CoverBucket = ReturnType<ReturnType<typeof createAdminClient>["storage"]["from"]>;

/**
 * Builds the storage path for a new cover.
 * @param eventId The event the cover belongs to.
 * @param now The upload time in milliseconds. Defaults to now.
 * @returns A path such as "events/12/cover-1728000000000.webp".
 */
export function buildCoverPath(eventId: number, now: number = Date.now()): string {
  return `events/${eventId}/cover-${now}.webp`;
}

/**
 * Tells uploaded covers apart from other values in cover_image_path. Seed
 * rows hold full Picsum URLs ("https://..."), which are not in the bucket and
 * must never be deleted from it.
 * @param path The stored cover_image_path.
 * @returns True when the path points to a file in the event-covers bucket.
 */
export function isStoredCoverPath(path: string | null): path is string {
  if (!path) {
    return false;
  }

  return path.startsWith("events/");
}

/**
 * Checks an uploaded file before it goes to Storage. The browser's file type
 * can be anything the client claims, so the file's first bytes are checked
 * too: a WebP file starts with "RIFF", 4 size bytes, then "WEBP".
 * @param file The file from the admin form.
 * @returns An error message, or null when the file is a valid cover.
 */
export async function validateCoverFile(file: Blob): Promise<string | null> {
  if (file.size === 0) {
    return "The cover image is empty.";
  }
  if (file.size > COVER_MAX_BYTES) {
    return "The cover image must be 2 MB or smaller.";
  }
  if (file.type !== COVER_CONTENT_TYPE) {
    return "The cover image must be a WebP file.";
  }

  const header: Uint8Array = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const text: string = String.fromCharCode(...header);
  if (!text.startsWith("RIFF") || text.slice(8, 12) !== "WEBP") {
    return "The cover image is not a valid WebP file.";
  }

  return null;
}

/**
 * Uploads a cover for an event. Validates the file first.
 * @param eventId The event the cover belongs to (the event must already exist).
 * @param file The WebP image from the admin form.
 * @returns The new storage path, to save in cover_image_path.
 */
export async function uploadEventCover(eventId: number, file: Blob): Promise<string> {
  const invalid: string | null = await validateCoverFile(file);
  if (invalid) {
    throw new Error(invalid);
  }

  const path: string = buildCoverPath(eventId);
  const { error } = await createAdminClient()
    .storage.from(EVENT_COVER_BUCKET)
    .upload(path, file, {
      contentType: COVER_CONTENT_TYPE,
      cacheControl: COVER_CACHE_SECONDS,
      // Never overwrite: every upload gets its own path.
      upsert: false,
    });
  if (error) {
    throw new Error(`Cover upload failed: ${error.message}`);
  }

  return path;
}

/**
 * Deletes one cover file. Best effort: a failure is logged, not thrown,
 * because the event itself is already saved and a leftover file only costs
 * storage. Seed URLs and empty values are ignored.
 * @param path The cover path to delete (e.g. the old cover after a replace).
 */
export async function deleteEventCover(path: string | null): Promise<void> {
  if (!isStoredCoverPath(path)) {
    return;
  }

  const { error } = await createAdminClient().storage.from(EVENT_COVER_BUCKET).remove([path]);
  if (error) {
    console.error(`Could not delete cover ${path}:`, error.message);
  }
}

/**
 * Deletes every file in an event's folder (events/{eventId}/). Used when a
 * draft is hard-deleted. Best effort, like deleteEventCover.
 * @param eventId The deleted event.
 */
export async function deleteEventCoverFolder(eventId: number): Promise<void> {
  const folder: string = `events/${eventId}`;
  const bucket: CoverBucket = createAdminClient().storage.from(EVENT_COVER_BUCKET);

  const { data: files, error: listError } = await bucket.list(folder);
  if (listError) {
    console.error(`Could not list covers in ${folder}:`, listError.message);
    return;
  }
  if (!files || files.length === 0) {
    return;
  }

  const paths: string[] = files.map((file: { name: string }) => `${folder}/${file.name}`);
  const { error } = await bucket.remove(paths);
  if (error) {
    console.error(`Could not delete covers in ${folder}:`, error.message);
  }
}

/**
 * Saves a new cover in the safe order, so the database and the bucket never
 * point at a missing file:
 * 1. Upload the new file.
 * 2. Run `save` (the database update) with the new path.
 *    If it fails, delete the new file (nothing refers to it) and rethrow.
 * 3. Only then delete the old file.
 * @param eventId The event the cover belongs to.
 * @param file The new WebP image.
 * @param oldPath The current cover_image_path, deleted after a successful save.
 * @param save Writes the new path to the database and returns its result.
 * @returns Whatever `save` returns.
 */
export async function saveWithNewCover<T>(
  eventId: number,
  file: Blob,
  oldPath: string | null,
  save: (newPath: string) => Promise<T>,
): Promise<T> {
  const newPath: string = await uploadEventCover(eventId, file);

  let result: T;
  try {
    result = await save(newPath);
  } catch (error) {
    // The database still points at the old cover, so the new file is unused.
    await deleteEventCover(newPath);
    throw error;
  }

  await deleteEventCover(oldPath);

  return result;
}
