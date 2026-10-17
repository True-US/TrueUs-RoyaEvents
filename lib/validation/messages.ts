/**
 * Every validation message in the app is built here, so the wording stays the same.
 * Convention: sentence case, ends with a period, no "Please", "required" only
 * for empty values. `field` is the label as the user sees it ("First name").
 */

/**
 * Lowercases the first letter, for messages that put the field mid-sentence.
 * @param field The field label, e.g. "Postal code".
 * @returns The label starting in lowercase, e.g. "postal code".
 */
function lowerFirst(field: string): string {
  return field.charAt(0).toLowerCase() + field.slice(1);
}

export const msg = {
  /** "First name is required." */
  required: (field: string): string => `${field} is required.`,

  /** "Enter a valid email address." */
  invalid: (field: string): string => `Enter a valid ${lowerFirst(field)}.`,

  /** "Password must be at least 8 characters." */
  minLength: (field: string, min: number): string =>
    `${field} must be at least ${min} characters.`,

  /** "Title must be 200 characters or fewer." */
  maxLength: (field: string, max: number): string =>
    `${field} must be ${max} characters or fewer.`,

  /** "Capacity must be a number." */
  number: (field: string): string => `${field} must be a number.`,

  /** "Capacity must be a whole number." */
  wholeNumber: (field: string): string => `${field} must be a whole number.`,

  /** "Price can't be negative." */
  notNegative: (field: string): string => `${field} can't be negative.`,

  /** "Guests must be at least 1." */
  minValue: (field: string, min: number): string => `${field} must be at least ${min}.`,

  /** "Capacity can't be more than 2147483647." */
  maxValue: (field: string, max: number): string => `${field} can't be more than ${max}.`,

  /** "Price can have at most 2 decimal places." */
  maxDecimals: (field: string, places: number): string =>
    `${field} can have at most ${places} decimal places.`,

  /** "Start date must be in the future." */
  futureDate: (field: string): string => `${field} must be in the future.`,

  /** "City can only contain letters, spaces, apostrophes, and hyphens." */
  lettersOnly: (field: string): string =>
    `${field} can only contain letters, spaces, apostrophes, and hyphens.`,

  /** "Address contains invalid characters." */
  invalidCharacters: (field: string): string => `${field} contains invalid characters.`,

  /** "Passwords don't match." */
  passwordsMatch: "Passwords don't match.",

  /** "Password must include at least one letter and one number." */
  passwordStrength: "Password must include at least one letter and one number.",

  /** "The end must be at least 10 minutes after the start." */
  endAfterStart: (minutes: number): string =>
    `The end must be at least ${minutes} minutes after the start.`,

  /** Fallback when an operation fails and we don't want to show internals. */
  unableTo: (action: string): string => `Unable to ${action}. Try again.`,

  /** Shown when a form has fields in error. */
  fixFields: "Fix the fields marked in red.",
} as const;
