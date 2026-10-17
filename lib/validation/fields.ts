import { z } from "zod";

import {
  EMAIL_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  PERSON_NAME_MAX,
  PHONE_MAX,
  PHONE_MAX_DIGITS,
  PHONE_MIN_DIGITS,
} from "@/features/auth/constants";
import {
  INT_MAX,
  LOCATION_ADDRESS_MAX,
  LOCATION_CITY_MAX,
  LOCATION_COUNTRY_MAX,
  LOCATION_NAME_MAX,
  LOCATION_POSTAL_CODE_MAX,
  LOCATION_PROVINCE_MAX,
  MIN_PAID_PRICE,
  PRICE_MAX,
} from "@/features/events/constants";
import { msg } from "@/lib/validation/messages";

// Letters (with accents), spaces, apostrophes and hyphens.
const LETTERS_PATTERN: RegExp = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
// Letters, digits, spaces and the punctuation found in names and street addresses.
const PLACE_PATTERN: RegExp = /^[A-Za-z0-9À-ÖØ-öø-ÿ\s'.,#/&()-]+$/;
// Canadian (A1A 1A1) or US (12345, 12345-6789) postal codes.
const POSTAL_CODE_PATTERN: RegExp = /^([A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d|\d{5}(-\d{4})?)$/;
const SLUG_PATTERN: RegExp = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Characters people type in a phone number.
const PHONE_CHARS_PATTERN: RegExp = /^\+?[\d\s().-]+$/;

/**
 * A string that reports "<label> is required." when it is missing or empty.
 * @param label The field label shown to the user.
 * @returns A trimmed string schema, stopping at the first (required) error.
 */
function requiredString(label: string): z.ZodString {
  return z
    .string({ error: msg.required(label) })
    .trim()
    .min(1, { error: msg.required(label), abort: true });
}

/**
 * A required name made of letters, spaces, apostrophes and hyphens.
 * @param label The field label, e.g. "First name".
 * @returns The schema, limited to the profile column size.
 */
export function nameField(label: string): z.ZodString {
  return requiredString(label)
    .min(2, msg.minLength(label, 2))
    .max(PERSON_NAME_MAX, msg.maxLength(label, PERSON_NAME_MAX))
    .regex(LETTERS_PATTERN, msg.lettersOnly(label));
}

/**
 * A required email address, trimmed and lowercased so lookups always match.
 * @returns The schema, limited to the profile column size.
 */
export function emailField(): z.ZodString {
  return requiredString("Email")
    .toLowerCase()
    .max(EMAIL_MAX, msg.maxLength("Email", EMAIL_MAX))
    .email(msg.invalid("Email address"));
}

/**
 * Checks a phone number typed in any common format and keeps only its digits.
 * @param value The raw text, or empty/null for "no phone".
 * @param ctx The zod context, used to report problems.
 * @param label The field label, for the message.
 * @param required True when an empty value is an error.
 * @returns The digits, or null when empty and not required.
 */
function normalizePhone(
  value: string | null | undefined,
  ctx: z.RefinementCtx,
  label: string,
  required: boolean,
): string | null {
  const raw: string = (value ?? "").trim();
  if (raw === "") {
    if (required) {
      ctx.addIssue({ code: "custom", message: msg.required(label) });
      return z.NEVER;
    }
    return null;
  }

  const digits: string = raw.replace(/\D/g, "");
  if (
    raw.length > PHONE_MAX ||
    !PHONE_CHARS_PATTERN.test(raw) ||
    digits.length < PHONE_MIN_DIGITS ||
    digits.length > PHONE_MAX_DIGITS
  ) {
    ctx.addIssue({ code: "custom", message: msg.invalid(label) });
    return z.NEVER;
  }

  return digits;
}

/**
 * An optional phone number. "" and missing both become null.
 * @returns The schema; output is the digits, or null.
 */
export function optionalPhoneField(): z.ZodPipe<
  z.ZodOptional<z.ZodNullable<z.ZodString>>,
  z.ZodTransform<string | null, string | null | undefined>
> {
  return z
    .string()
    .nullable()
    .optional()
    .transform((value: string | null | undefined, ctx: z.RefinementCtx): string | null =>
      normalizePhone(value, ctx, "Phone number", false),
    );
}

/**
 * A required phone number.
 * @returns The schema; output is the digits.
 */
export function requiredPhoneField(): z.ZodPipe<
  z.ZodOptional<z.ZodNullable<z.ZodString>>,
  z.ZodTransform<string, string | null | undefined>
> {
  return z
    .string()
    .nullable()
    .optional()
    .transform(
      (value: string | null | undefined, ctx: z.RefinementCtx): string =>
        normalizePhone(value, ctx, "Phone number", true) as string,
    );
}

/**
 * A new password: 8 to 72 characters with at least one letter and one number.
 * Not trimmed, because spaces are allowed in passwords.
 * @returns The schema.
 */
export function passwordField(): z.ZodString {
  return z
    .string({ error: msg.required("Password") })
    .min(1, { error: msg.required("Password"), abort: true })
    .min(PASSWORD_MIN, msg.minLength("Password", PASSWORD_MIN))
    .max(PASSWORD_MAX, msg.maxLength("Password", PASSWORD_MAX))
    .regex(/[A-Za-z]/, msg.passwordStrength)
    .regex(/\d/, msg.passwordStrength);
}

/**
 * A required text value with a length limit.
 * @param label The field label.
 * @param max The longest allowed length (the column size).
 * @param min The shortest allowed length; 1 means "just not empty".
 * @returns The schema.
 */
export function textField(label: string, max: number, min: number = 1): z.ZodString {
  const field: z.ZodString = requiredString(label);
  const sized: z.ZodString = min > 1 ? field.min(min, msg.minLength(label, min)) : field;
  return sized.max(max, msg.maxLength(label, max));
}

/**
 * An optional text value with a length limit. "" and missing both become null.
 * @param label The field label.
 * @param max The longest allowed length.
 * @returns The schema; output is the trimmed text, or null.
 */
export function optionalTextField(
  label: string,
  max: number,
  pattern?: { regex: RegExp; message: string },
): z.ZodPipe<
  z.ZodOptional<z.ZodNullable<z.ZodString>>,
  z.ZodTransform<string | null, string | null | undefined>
> {
  return z
    .string()
    .nullable()
    .optional()
    .transform((value: string | null | undefined, ctx: z.RefinementCtx): string | null => {
      const text: string = (value ?? "").trim();
      if (text === "") {
        return null;
      }
      if (text.length > max) {
        ctx.addIssue({ code: "custom", message: msg.maxLength(label, max) });
        return z.NEVER;
      }
      if (pattern && !pattern.regex.test(text)) {
        ctx.addIssue({ code: "custom", message: pattern.message });
        return z.NEVER;
      }
      return text;
    });
}

/** @returns An optional street address. */
export function optionalAddressField(): ReturnType<typeof optionalTextField> {
  return optionalTextField("Address", LOCATION_ADDRESS_MAX, {
    regex: PLACE_PATTERN,
    message: msg.invalidCharacters("Address"),
  });
}

/** @returns An optional Canadian or US postal code, saved in uppercase. */
export function optionalPostalCodeField(): z.ZodPipe<
  z.ZodOptional<z.ZodNullable<z.ZodString>>,
  z.ZodTransform<string | null, string | null | undefined>
> {
  return z
    .string()
    .nullable()
    .optional()
    .transform((value: string | null | undefined, ctx: z.RefinementCtx): string | null => {
      const text: string = (value ?? "").trim();
      if (text === "") {
        return null;
      }
      if (text.length > LOCATION_POSTAL_CODE_MAX || !POSTAL_CODE_PATTERN.test(text)) {
        ctx.addIssue({ code: "custom", message: msg.invalid("Postal code") });
        return z.NEVER;
      }
      return text.toUpperCase();
    });
}

/**
 * A URL-safe slug: lowercase letters, digits and single hyphens.
 * @param max The longest allowed length.
 * @returns The schema.
 */
export function slugField(max: number): z.ZodString {
  return requiredString("Slug")
    .max(max, msg.maxLength("Slug", max))
    .regex(SLUG_PATTERN, "Slug can only contain lowercase letters, numbers, and single hyphens.");
}

/** @returns A required venue/place name. */
export function placeNameField(): z.ZodString {
  return textField("Location name", LOCATION_NAME_MAX, 2).regex(
    PLACE_PATTERN,
    msg.invalidCharacters("Location name"),
  );
}

/** @returns A required street address. */
export function addressField(): z.ZodString {
  return textField("Address", LOCATION_ADDRESS_MAX, 2).regex(
    PLACE_PATTERN,
    msg.invalidCharacters("Address"),
  );
}

/** @returns A required city. */
export function cityField(): z.ZodString {
  return textField("City", LOCATION_CITY_MAX, 2).regex(LETTERS_PATTERN, msg.lettersOnly("City"));
}

/** @returns A required province. */
export function provinceField(): z.ZodString {
  return textField("Province", LOCATION_PROVINCE_MAX, 2).regex(
    LETTERS_PATTERN,
    msg.lettersOnly("Province"),
  );
}

/** @returns A required country. */
export function countryField(): z.ZodString {
  return textField("Country", LOCATION_COUNTRY_MAX, 2).regex(
    LETTERS_PATTERN,
    msg.lettersOnly("Country"),
  );
}

/** @returns A required Canadian or US postal code. */
export function postalCodeField(): z.ZodString {
  return textField("Postal code", LOCATION_POSTAL_CODE_MAX).regex(
    POSTAL_CODE_PATTERN,
    msg.invalid("Postal code"),
  );
}

/**
 * Checks that a number has at most two decimal places (price is Decimal(10,2)).
 * @param value The number to check.
 * @returns True when cents are the smallest unit used.
 */
function hasMaxTwoDecimals(value: number): boolean {
  return Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
}

/**
 * A ticket price: 0 (free) or at least the Stripe minimum, in whole cents.
 * @returns The number schema; null/empty handling is left to the caller.
 */
export function priceField(): z.ZodNumber {
  return z
    .number({ error: msg.number("Price") })
    .min(0, msg.notNegative("Price"))
    .max(PRICE_MAX, msg.maxValue("Price", PRICE_MAX))
    .refine(hasMaxTwoDecimals, msg.maxDecimals("Price", 2))
    .refine((price: number): boolean => price === 0 || price >= MIN_PAID_PRICE, {
      error: `Ticket price must be at least $${MIN_PAID_PRICE.toFixed(2)} or free.`,
    });
}

/**
 * A whole number from 0 up to the Postgres INTEGER limit.
 * @param label The field label.
 * @returns The number schema.
 */
export function countField(label: string): z.ZodNumber {
  return z
    .number({ error: msg.number(label) })
    .int(msg.wholeNumber(label))
    .min(0, msg.notNegative(label))
    .max(INT_MAX, msg.maxValue(label, INT_MAX));
}
