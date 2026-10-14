"use server";

// Server Actions for the admin event popup. "use server" turns every exported
// async function here into an endpoint the browser can call directly, with no
// API route or fetch code. Each one still runs on the server, so it checks
// the admin itself: anyone can send a request to a Server Action.
//
// The form sends a FormData with two entries:
// - "payload": the event + location as JSON (same shape as /api/events),
// - "cover":   the new cover image as a WebP File (optional).

import { revalidatePath } from "next/cache";

import { getCurrentProfile, isAdminRole } from "@/features/auth/current-profile";
import { EVENT_STATUS } from "@/features/events/constants";
import { saveWithNewCover, validateCoverFile } from "@/features/events/server/cover-storage";
import { checkEventRules } from "@/features/events/server/event-payload";
import { createEventWithLocation, updateEventWithLocation } from "@/features/events/server/service";
import type {
  CreateEventInput,
  CreateEventWithLocationInput,
  EventActionResult,
  UpdateEventWithLocationInput,
} from "@/features/events/types";
import { prisma } from "@/lib/supabase/prisma";

// Shown when trying to publish an event that has no cover.
const COVER_REQUIRED_MESSAGE: string = "A cover image is required to publish. Add one, or save as a draft.";

/**
 * Creates an event, and its cover when one is attached.
 * With a cover, the event is first saved as a draft: the cover's storage path
 * needs the new event's id, and a published event must never exist without
 * its cover. The requested status is applied together with the cover.
 * @param formData "payload" (event + location JSON) and optional "cover" (WebP file).
 * @returns The new event id; coverError when the event saved but the cover didn't.
 */
export async function createEventAction(formData: FormData): Promise<EventActionResult> {
  if (!(await isCurrentUserAdmin())) {
    return failure("Unauthorized.");
  }

  const payload: CreateEventWithLocationInput | null = readPayload<CreateEventWithLocationInput>(formData);
  if (!payload || !payload.location) {
    return failure("Event details are missing.");
  }

  const checked: ReturnType<typeof checkEventRules> = checkEventRules(payload.event);
  if (checked.error !== undefined) {
    return failure(checked.error);
  }

  const cover: File | null = readCover(formData);
  if (cover) {
    const invalid: string | null = await validateCoverFile(cover);
    if (invalid) {
      return failure(invalid);
    }
  }

  const requestedStatus: string = checked.event.status ?? EVENT_STATUS.DRAFT;
  if (requestedStatus === EVENT_STATUS.PUBLISHED && !cover) {
    return failure(COVER_REQUIRED_MESSAGE);
  }

  // 1. Create the event (as a draft when a cover still has to be uploaded).
  let eventId: number;
  try {
    const event: CreateEventInput = {
      ...checked.event,
      status: cover ? EVENT_STATUS.DRAFT : requestedStatus,
    };
    const created: Awaited<ReturnType<typeof createEventWithLocation>> = await createEventWithLocation({
      ...payload,
      event,
    });
    eventId = created.createdEvent.id;
  } catch (error) {
    console.error("Create event error:", error);
    return failure(errorMessage(error, "Failed to create event."));
  }

  // 2. Upload the cover and apply the requested status in the same update.
  let coverError: string | undefined;
  if (cover) {
    try {
      await saveWithNewCover(eventId, cover, null, (path: string) =>
        prisma.eventAdventure.update({
          where: { id: eventId },
          data: { coverImagePath: path, status: requestedStatus },
        }),
      );
    } catch (error) {
      console.error("Create event cover error:", error);
      // The event exists, so this is still a success: the popup switches to
      // editing it, and the admin can try the cover again.
      coverError = `The event was saved as a draft, but the cover didn't upload: ${errorMessage(error, "unknown error")}`;
    }
  }

  // The public list and detail pages read from the database on every
  // request; this also clears any copy cached in the browser's router.
  revalidatePath("/events", "layout");

  return { success: true, eventId, coverError };
}

/**
 * Updates an event, and replaces its cover when a new one is attached.
 * The new cover is uploaded first and the old file is deleted only after the
 * database update succeeds (see saveWithNewCover), so nothing is ever left
 * pointing at a missing file. If anything fails, nothing is changed.
 * @param formData "payload" (id + event + location JSON) and optional "cover" (WebP file).
 * @returns The event id, or an error message.
 */
export async function updateEventAction(formData: FormData): Promise<EventActionResult> {
  if (!(await isCurrentUserAdmin())) {
    return failure("Unauthorized.");
  }

  const payload: UpdateEventWithLocationInput | null = readPayload<UpdateEventWithLocationInput>(formData);
  if (!payload || !Number.isInteger(payload.id) || !payload.location) {
    return failure("Event details are missing.");
  }

  const checked: ReturnType<typeof checkEventRules> = checkEventRules(payload.event);
  if (checked.error !== undefined) {
    return failure(checked.error);
  }

  const cover: File | null = readCover(formData);
  if (cover) {
    const invalid: string | null = await validateCoverFile(cover);
    if (invalid) {
      return failure(invalid);
    }
  }

  const existing: { coverImagePath: string | null } | null = await prisma.eventAdventure.findUnique({
    where: { id: payload.id },
    select: { coverImagePath: true },
  });
  if (!existing) {
    return failure("Event not found.");
  }

  // A seed event's Picsum URL counts as a cover too.
  const status: string = checked.event.status ?? EVENT_STATUS.DRAFT;
  if (status === EVENT_STATUS.PUBLISHED && !cover && !existing.coverImagePath) {
    return failure(COVER_REQUIRED_MESSAGE);
  }

  try {
    if (cover) {
      await saveWithNewCover(payload.id, cover, existing.coverImagePath, (newPath: string) =>
        updateEventWithLocation({
          ...payload,
          event: { ...checked.event, coverImagePath: newPath },
        }),
      );
    } else {
      await updateEventWithLocation({ ...payload, event: checked.event });
    }
  } catch (error) {
    console.error("Update event error:", error);
    return failure(errorMessage(error, "Failed to update event."));
  }

  revalidatePath("/events", "layout");

  return { success: true, eventId: payload.id };
}

//---------- Helpers (not exported: only async functions may be exported here) -------------

/**
 * Checks that the logged-in user is an admin. Prisma bypasses RLS, so this
 * check is what protects the data.
 * @returns True for a logged-in admin.
 */
async function isCurrentUserAdmin(): Promise<boolean> {
  const profile: Awaited<ReturnType<typeof getCurrentProfile>> = await getCurrentProfile();
  if (!profile || !profile.role) {
    return false;
  }

  return isAdminRole(profile.role.name);
}

/**
 * Reads the "payload" JSON entry.
 * @param formData The submitted form data.
 * @returns The parsed payload, or null when missing or not valid JSON.
 */
function readPayload<T>(formData: FormData): T | null {
  const raw: FormDataEntryValue | null = formData.get("payload");
  if (typeof raw !== "string") {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Reads the optional "cover" file entry.
 * @param formData The submitted form data.
 * @returns The file, or null when no cover was attached.
 */
function readCover(formData: FormData): File | null {
  const value: FormDataEntryValue | null = formData.get("cover");
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

/**
 * Builds a failed result.
 * @param message What went wrong, shown to the admin.
 * @returns The failure result.
 */
function failure(message: string): EventActionResult {
  return { success: false, message };
}

/**
 * Gets a readable message from a caught error.
 * @param error The caught value.
 * @param fallback Used when the error has no message.
 * @returns The message.
 */
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
