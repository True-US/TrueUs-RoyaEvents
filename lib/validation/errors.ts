import type { ZodError } from "zod";

/**
 * Groups a zod error's messages by field, so a form can show each one under its input.
 * @param error The error from a failed safeParse.
 * @returns The first message for each field, keyed by the field's name ("startDate").
 */
export function getFieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field: string = issue.path.join(".");
    // Keep the first message per field; later ones are usually consequences.
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return errors;
}

/**
 * Picks the one message to show when a request is rejected.
 * @param error The error from a failed safeParse.
 * @param fallback The message to use if the error has no issues.
 * @returns The first issue's message, or the fallback.
 */
export function getFirstError(error: ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback;
}
