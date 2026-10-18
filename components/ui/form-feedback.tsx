/**
 * Red message under an input. Renders nothing when there is no error.
 * @param props.id The id the input points to with aria-describedby.
 * @param props.message The error message, if any.
 * @returns The message paragraph, or null.
 */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    // aria-live: screen readers announce the message when it appears.
    <p aria-live="polite" className="mt-1 text-sm text-red-600" id={id}>
      {message}
    </p>
  );
}

/**
 * Red message for the whole form (a failed submit, a server error).
 * Renders nothing when there is no error.
 * @param props.message The error message, if any.
 * @param props.id Optional id, for aria-describedby.
 * @returns The message paragraph, or null.
 */
export function FormError({ message, id }: { message?: string; id?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-sm text-red-600" id={id} role="alert">
      {message}
    </p>
  );
}

/**
 * Green message for a saved/created/deleted result. Renders nothing when empty.
 * @param props.message The success message, if any.
 * @returns The message paragraph, or null.
 */
export function FormSuccess({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-sm text-green-700" role="status">
      {message}
    </p>
  );
}

// Same look as the normal input border, but red, for fields with an error.
export const invalidInputClass: string =
  "mt-1 w-full rounded-md border border-red-500 bg-white px-3 py-2 text-sm text-roya-ink outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500";
