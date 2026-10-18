"use client";

import { useState, type FormEvent } from "react";

import { FieldError, FormError } from "@/components/ui/form-feedback";
import { EMAIL_MAX } from "@/features/auth/constants";
import { MAX_TICKETS_PER_ORDER } from "@/features/bookings/constants";
import { checkoutSchema, CUSTOMER_NAME_MAX } from "@/features/bookings/schemas";
import { getFieldErrors } from "@/lib/validation/errors";
import { msg } from "@/lib/validation/messages";

const ticketPrice = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

const fieldClass: string = "w-full rounded-lg border border-roya-slate/30 px-3 py-2";
// Red border for fields with an error.
const invalidFieldClass: string = "w-full rounded-lg border border-red-500 px-3 py-2";

type TicketCheckoutFormProps = {
  slug: string;
  price: number | null;
  availableSpots: number | null;
  initialName: string;
  initialEmail: string;
  cancelled: boolean;
};

export function TicketCheckoutForm({
  slug,
  price,
  availableSpots,
  initialName,
  initialEmail,
  cancelled,
}: TicketCheckoutFormProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const maxQuantity = Math.min(MAX_TICKETS_PER_ORDER, availableSpots ?? MAX_TICKETS_PER_ORDER);
  const total = (price ?? 0) * quantity;
  const inventoryError = "There are not enough tickets available.";
  const soldOut = availableSpots !== null && availableSpots < 1;

  /**
   * Clears one field's error once the user changes it.
   * @param field The field's name, e.g. "email".
   */
  function clearFieldError(field: string): void {
    setFieldErrors((current: Record<string, string>) => {
      const next: Record<string, string> = { ...current };
      delete next[field];
      return next;
    });
  }

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setError("");

    const parsed = checkoutSchema.safeParse({ slug, quantity, name, email });
    if (!parsed.success) {
      setFieldErrors(getFieldErrors(parsed.error));
      return;
    }
    if (availableSpots !== null && quantity > availableSpots) {
      setFieldErrors({ quantity: inventoryError });
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result: unknown = await response.json();

      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("url" in result) ||
        typeof result.url !== "string"
      ) {
        const message =
          typeof result === "object" &&
            result !== null &&
            "message" in result &&
            typeof result.message === "string"
            ? result.message
            : msg.unableTo("start checkout");
        throw new Error(message);
      }

      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : msg.unableTo("start checkout"),
      );
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" noValidate onSubmit={startCheckout}>
      {cancelled && (
        <p
          className="border-l-4 border-roya-sun bg-white px-4 py-3 text-roya-ink"
          role="status"
        >
          Checkout was cancelled. Your tickets are not paid for.
        </p>
      )}

      <div>
        <label
          className="mb-1 block text-sm font-semibold text-roya-ink"
          htmlFor="ticket-name"
        >
          Name
        </label>
        <input
          autoComplete="name"
          aria-describedby={fieldErrors.name ? "ticket-name-error" : undefined}
          aria-invalid={Boolean(fieldErrors.name)}
          className={fieldErrors.name ? invalidFieldClass : fieldClass}
          id="ticket-name"
          maxLength={CUSTOMER_NAME_MAX}
          onChange={(event) => {
            setName(event.target.value);
            clearFieldError("name");
          }}
          required
          value={name}
        />
        <FieldError id="ticket-name-error" message={fieldErrors.name} />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-semibold text-roya-ink"
          htmlFor="ticket-email"
        >
          Email for your receipt
        </label>
        <input
          autoComplete="email"
          aria-describedby={fieldErrors.email ? "ticket-email-error" : undefined}
          aria-invalid={Boolean(fieldErrors.email)}
          className={fieldErrors.email ? invalidFieldClass : fieldClass}
          id="ticket-email"
          maxLength={EMAIL_MAX}
          onChange={(event) => {
            setEmail(event.target.value);
            clearFieldError("email");
          }}
          required
          type="email"
          value={email}
        />
        <FieldError id="ticket-email-error" message={fieldErrors.email} />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-semibold text-roya-ink"
          htmlFor="ticket-quantity"
        >
          Number of tickets
        </label>
        <input
          aria-describedby={fieldErrors.quantity ? "ticket-quantity-error" : undefined}
          aria-invalid={Boolean(fieldErrors.quantity)}
          className={fieldErrors.quantity ? invalidFieldClass : fieldClass}
          id="ticket-quantity"
          max={maxQuantity}
          min={1}
          onChange={(event) => {
            setQuantity(Number(event.target.value));
            clearFieldError("quantity");
          }}
          required
          type="number"
          value={quantity}
        />
        <FieldError id="ticket-quantity-error" message={fieldErrors.quantity} />
      </div>

      <p className="flex justify-between border-t border-roya-slate/20 pt-4 text-lg font-semibold text-roya-ink">
        <span>Total</span>
        <span>{ticketPrice.format(total)}</span>
      </p>

      <FormError message={error || (soldOut ? inventoryError : "")} />

      <button
        className="w-full rounded-full bg-roya-sun px-6 py-3 font-semibold text-roya-ink hover:bg-roya-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading || maxQuantity < 1}
        type="submit"
      >
        {loading
          ? "Preparing checkout..."
          : price
            ? "Continue to secure payment"
            : "Reserve free tickets"}
      </button>
      <p className="text-sm text-roya-slate">
        Sign in to your account to reserve tickets. Payments are processed
        securely by Stripe.
      </p>
    </form>
  );
}
