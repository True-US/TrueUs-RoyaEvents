// Fails the build if a Client Component imports this file.
import "server-only";

import { validateEventRules } from "@/features/events/schemas";
import type { CreateEventInput } from "@/features/events/types";

// Server-side checks for an event payload, shared by the admin server actions
// and the /api/events route. The form runs the same rules first, but the
// server must not trust the browser.

/**
 * Checks that a date string ends with a zone: "Z" or an offset like "-06:00".
 * @param value The date string from the payload.
 * @returns True when the moment it describes is unambiguous.
 */
export function hasTimeZone(value: string): boolean {
  return /(Z|[+-]\d{2}:\d{2})$/.test(value);
}

/**
 * Applies the event business rules (price, spots, dates) to a payload's event.
 * @param event The event part of a create/update payload.
 * @returns The event with its price normalized (0 -> null), or an error message.
 */
export function checkEventRules(
  event: CreateEventInput | undefined,
): { event: CreateEventInput; error?: never } | { event?: never; error: string } {
  if (!event) {
    return { error: "Event details are missing." };
  }

  // Times must name their zone ("...Z" or "...-06:00"). A bare "2026-10-10T19:00"
  // would be read in the server's zone, which is UTC on Vercel.
  if (!hasTimeZone(event.startDatetime) || (event.endDatetime && !hasTimeZone(event.endDatetime))) {
    return { error: "Dates must include a time zone (ISO 8601, e.g. 2026-10-11T01:00:00.000Z)." };
  }

  const result: ReturnType<typeof validateEventRules> = validateEventRules(event);
  if (result.error !== undefined) {
    return { error: result.error };
  }

  // The cover path is set by the server after an upload, never by the client.
  const { coverImagePath: _ignored, ...fields } = event;
  void _ignored;

  return { event: { ...fields, price: result.data.price } };
}
