import { z } from "zod";

import { MIN_EVENT_DURATION_MINUTES } from "@/features/events/constants";

export const customEventStep1Schema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name is required")
    .regex(
      /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/,
      "Only letters, spaces, apostrophes, and hyphens are allowed",
    ),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name is required")
    .regex(
      /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/,
      "Only letters, spaces, apostrophes, and hyphens are allowed",
    ),

  email: z.string().trim().email("Enter a valid email address"),

  phone: z.string().trim().min(7, "Phone number is required"),
});

export const customEventStep2Schema = z
  .object({
    title: z.string().trim().min(3, "Event name is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    numberOfGuests: z.coerce
      .number()
      .int("Guests count must be a whole number")
      .min(0, "Guests count must be 0 or more"),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true;
      return new Date(data.endDate) >= new Date(data.startDate);
    },
    {
      message: "End date must be after the start date",
      path: ["endDate"],
    },
  );

export const customEventStep3Schema = z.object({
  location: z
    .string()
    .trim()
    .min(2, "Location is required")
    .regex(
      /^[A-Za-z0-9À-ÖØ-öø-ÿ\s'.,#/-]+$/,
      "Location contains invalid characters",
    ),

  address: z
    .string()
    .trim()
    .min(2, "Address is required")
    .regex(
      /^[A-Za-z0-9À-ÖØ-öø-ÿ\s'.,#/-]+$/,
      "Address contains invalid characters",
    ),

  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .regex(
      /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/,
      "City can only contain letters, spaces, apostrophes, and hyphens",
    ),

  province: z
    .string()
    .trim()
    .min(2, "Province is required")
    .regex(
      /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/,
      "Province can only contain letters, spaces, apostrophes, and hyphens",
    ),

  postalCode: z
    .string()
    .trim()
    .min(3, "Postal code is required")
    .regex(/^[A-Za-z0-9 -]+$/, "Postal code is invalid"),

  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .regex(
      /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/,
      "Country can only contain letters, spaces, apostrophes, and hyphens",
    ),
});

//---------- Admin event form -------------

// One minute in milliseconds.
const MINUTE: number = 60 * 1000;
/**
 * Business rules for an event's price, spots and dates. Shared by the admin
 * form (fast feedback) and /api/events (the real check: the server never
 * trusts the browser).
 * - Price: 0 and empty both mean free, and are both saved as null.
 * - Spots: whole numbers, 0 or more; available spots can't exceed capacity,
 *   and need a capacity to count against.
 * - Dates: the end, when set, is at least MIN_EVENT_DURATION_MINUTES after the start.
 */
export const eventRulesSchema = z
  .object({
    price: z
      .number("Price must be a number.")
      .min(0, "Price can't be negative.")
      .nullable()
      .optional()
      // 0, null and undefined all become null, so "free" is stored one way only.
      .transform((price: number | null | undefined): number | null => (price ? price : null)),
    capacity: z
      .number("Capacity must be a number.")
      .int("Capacity must be a whole number.")
      .min(0, "Capacity can't be negative.")
      .nullable()
      .optional(),
    availableSpots: z
      .number("Available spots must be a number.")
      .int("Available spots must be a whole number.")
      .min(0, "Available spots can't be negative.")
      .nullable()
      .optional(),
    startDatetime: z.string().min(1, "Start date and time is required."),
    endDatetime: z.string().nullable().optional(),
  })
  .superRefine((event, ctx) => {
    // Rule 2: available spots against capacity.
    const hasSpots: boolean = event.availableSpots !== null && event.availableSpots !== undefined;
    const hasCapacity: boolean = event.capacity !== null && event.capacity !== undefined;
    if (hasSpots && !hasCapacity) {
      ctx.addIssue({
        code: "custom",
        path: ["availableSpots"],
        message: "Set a capacity before setting available spots.",
      });
    }
    if (hasSpots && hasCapacity && event.availableSpots! > event.capacity!) {
      ctx.addIssue({
        code: "custom",
        path: ["availableSpots"],
        message: "Available spots can't be more than the capacity.",
      });
    }

    // Rule 3: end at least MIN_EVENT_DURATION_MINUTES after start.
    if (!event.endDatetime) {
      return;
    }
    const start: number = new Date(event.startDatetime).getTime();
    const end: number = new Date(event.endDatetime).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) {
      ctx.addIssue({
        code: "custom",
        path: ["endDatetime"],
        message: "Start or end date is not a valid date.",
      });
      return;
    }
    if (end - start < MIN_EVENT_DURATION_MINUTES * MINUTE) {
      ctx.addIssue({
        code: "custom",
        path: ["endDatetime"],
        message: `The end must be after the start.`,
      });
    }
  });

// Input accepted by eventRulesSchema (before price is normalized).
export type EventRulesInput = z.input<typeof eventRulesSchema>;

// The fields eventRulesSchema can report an error on.
export type EventRuleField = keyof EventRulesInput;

/**
 * Checks an event against eventRulesSchema and groups the messages by field,
 * so a form can show each one under its input.
 * @param input The event's price, spots and dates.
 * @returns The first error message for each invalid field; {} when all is valid.
 */
export function getEventRuleErrors(
  input: EventRulesInput,
): Partial<Record<EventRuleField, string>> {
  const result: ReturnType<typeof eventRulesSchema.safeParse> = eventRulesSchema.safeParse(input);
  if (result.success) {
    return {};
  }

  const errors: Partial<Record<EventRuleField, string>> = {};
  for (const issue of result.error.issues) {
    const field: EventRuleField = issue.path[0] as EventRuleField;
    // Keep the first message per field; later ones are usually consequences.
    if (!errors[field]) {
      errors[field] = issue.message;
    }
  }

  return errors;
}

/**
 * Checks an event against eventRulesSchema.
 * @param input The event's price, spots and dates.
 * @returns The normalized values (price 0 -> null), or the first error message.
 */
export function validateEventRules(
  input: EventRulesInput,
): { data: z.output<typeof eventRulesSchema>; error?: never } | { data?: never; error: string } {
  const result: ReturnType<typeof eventRulesSchema.safeParse> = eventRulesSchema.safeParse(input);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Invalid event details." };
  }

  return { data: result.data };
}
