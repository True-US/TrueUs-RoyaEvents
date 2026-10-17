// Fails the build if a Client Component imports this file.
import "server-only";

import { EventScheduleConflictError } from "@/features/events/server/service";
import { msg } from "@/lib/validation/messages";

/**
 * Turns an error from saving an event into a message that is safe to show.
 * The raw error (Prisma/SQL text) is logged by the caller, never returned.
 * @param error The caught value.
 * @param action What was being done, e.g. "create the event".
 * @returns A friendly message for known database errors, else the generic fallback.
 */
export function getSaveErrorMessage(error: unknown, action: string): string {
  // Written for the user: the new time overlaps another event.
  if (error instanceof EventScheduleConflictError) {
    return error.message;
  }

  const code: unknown =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code: unknown }).code
      : undefined;

  // Unique constraint: event_adventure.slug is the only unique column saved here.
  if (code === "P2002") {
    return "This slug is already in use.";
  }
  // The row to update was not found.
  if (code === "P2025") {
    return "Event not found.";
  }

  return msg.unableTo(action);
}
