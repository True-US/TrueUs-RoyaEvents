// Fails the build if a Client Component imports this file.
import "server-only";

import { EVENT_STATUS } from "@/features/events/constants";
import {
  eventDetailsSchema,
  eventLocationSchema,
  requestContactSchema,
  validateEventRules,
} from "@/features/events/schemas";
import type { CreateEventInput, CreateEventLocationInput } from "@/features/events/types";
import { getFirstError } from "@/lib/validation/errors";
import { msg } from "@/lib/validation/messages";

// Server-side checks for an event payload, shared by the admin server actions
// and the /api/events route. The form runs the same rules first, but the
// server must not trust the browser.

type CheckedPayload =
  | { event: CreateEventInput; location: CreateEventLocationInput; error?: never }
  | { event?: never; location?: never; error: string };

/**
 * Checks that a date string ends with a zone: "Z" or an offset like "-06:00".
 * @param value The date string from the payload.
 * @returns True when the moment it describes is unambiguous.
 */
export function hasTimeZone(value: string): boolean {
  return /(Z|[+-]\d{2}:\d{2})$/.test(value);
}

/**
 * Checks an event and its location: text fields (trimmed, length-limited),
 * price, spots and dates.
 * @param event The event part of a create/update payload.
 * @param location The location part of a create/update payload.
 * @returns The event and location with their values normalized (trimmed, price 0 -> null,
 *   empty optional text -> null), or the first error message.
 */
export function checkEventPayload(
  event: CreateEventInput | undefined,
  location: CreateEventLocationInput | undefined,
): CheckedPayload {
  if (!event || !location) {
    return { error: "Event details are missing." };
  }

  // Times must name their zone ("...Z" or "...-06:00"). A bare "2026-10-10T19:00"
  // would be read in the server's zone, which is UTC on Vercel.
  if (
    typeof event.startDatetime !== "string" ||
    !hasTimeZone(event.startDatetime) ||
    (event.endDatetime && !hasTimeZone(event.endDatetime))
  ) {
    return { error: "Dates must include a time zone (ISO 8601, e.g. 2026-10-11T01:00:00.000Z)." };
  }

  const details: ReturnType<typeof eventDetailsSchema.safeParse> = eventDetailsSchema.safeParse(event);
  if (!details.success) {
    return { error: getFirstError(details.error, msg.invalid("Event details")) };
  }

  const place: ReturnType<typeof eventLocationSchema.safeParse> = eventLocationSchema.safeParse(location);
  if (!place.success) {
    return { error: getFirstError(place.error, msg.invalid("Location")) };
  }

  const rules: ReturnType<typeof validateEventRules> = validateEventRules(event);
  if (rules.error !== undefined) {
    return { error: rules.error };
  }

  // The cover path is set by the server after an upload, never by the client.
  const { coverImagePath: _ignored, ...fields } = event;
  void _ignored;

  return {
    event: {
      ...fields,
      title: details.data.title,
      slug: details.data.slug,
      shortDescription: details.data.shortDescription,
      description: details.data.description,
      status: details.data.status,
      price: rules.data.price,
    },
    location: { ...location, ...place.data },
  };
}

/**
 * Checks the contact details of a public request.
 * @param event The event, already checked by checkEventPayload.
 * @returns The trimmed contact fields, or the first error message.
 */
export function checkRequestContact(
  event: CreateEventInput,
):
  | { contact: { contactName: string; contactEmail: string; contactPhone: string }; error?: never }
  | { contact?: never; error: string } {
  const result: ReturnType<typeof requestContactSchema.safeParse> = requestContactSchema.safeParse(event);
  if (!result.success) {
    return { error: getFirstError(result.error, msg.invalid("Contact details")) };
  }

  return { contact: result.data };
}

/**
 * Limits an event sent by someone who isn't an admin (the public request forms)
 * to what a request may set: it always lands as an active draft, with no price.
 * @param event The event, already checked by checkEventPayload.
 * @param contact The contact details, already checked by checkRequestContact.
 * @returns The event with every admin-only value replaced.
 */
export function toPrivateRequestEvent(
  event: CreateEventInput,
  contact: { contactName: string; contactEmail: string; contactPhone: string },
): CreateEventInput {
  return {
    // Kept so the request is saved as a private event, not a plain event.
    eventType: event.eventType,
    ...contact,
    title: event.title,
    slug: event.slug,
    shortDescription: event.shortDescription,
    description: event.description,
    startDatetime: event.startDatetime,
    endDatetime: event.endDatetime,
    capacity: event.capacity,
    availableSpots: event.capacity,
    price: null,
    status: EVENT_STATUS.DRAFT,
    isActive: true,
  };
}
