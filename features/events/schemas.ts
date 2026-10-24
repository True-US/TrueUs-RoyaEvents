import { z } from "zod";

import {
  EVENT_DESCRIPTION_MAX,
  EVENT_SHORT_DESCRIPTION_MAX,
  EVENT_SLUG_MAX,
  EVENT_STATUS,
  EVENT_TITLE_MAX,
  MIN_EVENT_DURATION_MINUTES,
  REQUEST_GUESTS_MAX,
  REQUEST_MESSAGE_MAX,
} from "@/features/events/constants";
import { zonedInputToDate } from "@/features/events/utils/dates";
import {
  addressField,
  cityField,
  countField,
  countryField,
  emailField,
  nameField,
  optionalAddressField,
  optionalPostalCodeField,
  optionalTextField,
  placeNameField,
  postalCodeField,
  priceField,
  provinceField,
  requiredPhoneField,
  slugField,
  textField,
} from "@/lib/validation/fields";
import { msg } from "@/lib/validation/messages";

// One minute in milliseconds.
const MINUTE: number = 60 * 1000;

//---------- Custom event / contact / private adventure request (public wizard) -------------

/**
 * A datetime-local value ("2026-10-10T19:00") that must be a real date and time.
 * @param label The field label, e.g. "Start date".
 * @returns The string schema.
 */
function dateTimeInputField(label: string): z.ZodString {
  return z
    .string({ error: msg.required(label) })
    .min(1, { error: msg.required(label), abort: true })
    .refine((value: string): boolean => zonedInputToDate(value) !== null, {
      error: msg.invalid(label),
    });
}

export const customEventStep1Schema = z.object({
  firstName: nameField("First name"),
  lastName: nameField("Last name"),
  email: emailField(),
  phone: requiredPhoneField(),
});

/** Who sent a customer request. Checked again on the server, which sets the request status itself. */
export const requestContactSchema = z.object({
  contactName: textField("Name", 200, 2),
  contactEmail: emailField(),
  contactPhone: requiredPhoneField(),
});

export const customEventStep2Schema = z
  .object({
    title: textField("Event name", EVENT_TITLE_MAX, 3),
    startDate: dateTimeInputField("Start date"),
    endDate: dateTimeInputField("End date"),
    numberOfGuests: z.coerce
      .number({ error: msg.number("Number of guests") })
      .int(msg.wholeNumber("Number of guests"))
      .min(1, msg.minValue("Number of guests", 1))
      .max(REQUEST_GUESTS_MAX, msg.maxValue("Number of guests", REQUEST_GUESTS_MAX)),
    message: optionalTextField("Message", REQUEST_MESSAGE_MAX),
  })
  .superRefine((data, ctx) => {
    // Dates are read as Edmonton time, like the admin form.
    const start: Date | null = zonedInputToDate(data.startDate);
    const end: Date | null = zonedInputToDate(data.endDate);
    if (!start || !end) {
      return;
    }

    if (start.getTime() <= Date.now()) {
      ctx.addIssue({ code: "custom", path: ["startDate"], message: msg.futureDate("Start date") });
    }
    if (end.getTime() - start.getTime() < MIN_EVENT_DURATION_MINUTES * MINUTE) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: msg.endAfterStart(MIN_EVENT_DURATION_MINUTES),
      });
    }
  });

export const customEventStep3Schema = z.object({
  location: placeNameField(),
  address: addressField(),
  city: cityField(),
  province: provinceField(),
  postalCode: postalCodeField(),
  country: countryField(),
});

//---------- Event text fields and location (admin form + server) -------------

// Values the status can be saved as. Matches the database's status CHECK for these.
const STATUS_VALUES = [
  EVENT_STATUS.DRAFT,
  EVENT_STATUS.PUBLISHED,
  EVENT_STATUS.UNPUBLISHED,
  EVENT_STATUS.CANCELLED,
] as const;

/**
 * Title, slug, descriptions and status of an event. Shared by the admin form
 * (fast feedback) and the server (the real check).
 */
export const eventDetailsSchema = z.object({
  title: textField("Title", EVENT_TITLE_MAX),
  slug: slugField(EVENT_SLUG_MAX),
  shortDescription: optionalTextField("Short description", EVENT_SHORT_DESCRIPTION_MAX),
  description: optionalTextField("Description", EVENT_DESCRIPTION_MAX),
  status: z.enum(STATUS_VALUES, { error: msg.invalid("Status") }).optional(),
});

/** The location of an event. Address and postal code are optional. */
export const eventLocationSchema = z.object({
  name: placeNameField(),
  address: optionalAddressField(),
  city: cityField(),
  province: provinceField(),
  postalCode: optionalPostalCodeField(),
  country: countryField(),
});

//---------- Event rules: price, spots, dates (admin form + server) -------------

/**
 * Business rules for an event's price, spots and dates. Shared by the admin
 * form (fast feedback) and the server (the real check: the server never
 * trusts the browser).
 * - Price: 0 and empty both mean free, and are both saved as null.
 * - Spots: whole numbers, 0 or more; available spots can't exceed capacity,
 *   and need a capacity to count against.
 * - Dates: the end, when set, is at least MIN_EVENT_DURATION_MINUTES after the start.
 */
export const eventRulesSchema = z
  .object({
    price: priceField()
      .nullable()
      .optional()
      // 0, null and undefined all become null, so "free" is stored one way only.
      .transform((price: number | null | undefined): number | null => (price ? price : null)),
    capacity: countField("Capacity").nullable().optional(),
    availableSpots: countField("Available spots").nullable().optional(),
    startDatetime: z
      .string({ error: msg.required("Start date and time") })
      .min(1, msg.required("Start date and time")),
    endDatetime: z.string().nullable().optional(),
  })
  .superRefine((event, ctx) => {
    // Rule 1: available spots against capacity.
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

    // Rule 2: the dates are real, and the end is at least MIN_EVENT_DURATION_MINUTES after the start.
    if (!event.startDatetime) {
      return;
    }
    const start: number = new Date(event.startDatetime).getTime();
    if (Number.isNaN(start)) {
      ctx.addIssue({
        code: "custom",
        path: ["startDatetime"],
        message: msg.invalid("Start date and time"),
      });
      return;
    }
    if (!event.endDatetime) {
      return;
    }
    const end: number = new Date(event.endDatetime).getTime();
    if (Number.isNaN(end)) {
      ctx.addIssue({
        code: "custom",
        path: ["endDatetime"],
        message: msg.invalid("End date and time"),
      });
      return;
    }
    if (end - start < MIN_EVENT_DURATION_MINUTES * MINUTE) {
      ctx.addIssue({
        code: "custom",
        path: ["endDatetime"],
        message: msg.endAfterStart(MIN_EVENT_DURATION_MINUTES),
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
    return { error: result.error.issues[0]?.message ?? msg.invalid("Event details") };
  }

  return { data: result.data };
}
