"use client";

import { useState, type FormEvent } from "react";

import { MAX_TICKETS_PER_ORDER } from "@/features/bookings/constants";

const ticketPrice = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

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
  const maxQuantity = Math.min(
    MAX_TICKETS_PER_ORDER,
    availableSpots ?? MAX_TICKETS_PER_ORDER,
  );
  const total = (price ?? 0) * quantity;
  const inventoryError = "There are not enough tickets available.";
  const soldOut = availableSpots !== null && availableSpots < 1;

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, quantity, name, email }),
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
            : "Unable to start checkout. Please try again.";
        throw new Error(message);
      }

      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start checkout. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={startCheckout}>
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
          className="w-full rounded-lg border border-roya-slate/30 px-3 py-2"
          id="ticket-name"
          maxLength={200}
          minLength={2}
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
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
          className="w-full rounded-lg border border-roya-slate/30 px-3 py-2"
          id="ticket-email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-semibold text-roya-ink"
          htmlFor="ticket-quantity"
        >
          Number of tickets
        </label>
        <input
          className="w-full rounded-lg border border-roya-slate/30 px-3 py-2"
          id="ticket-quantity"
          max={maxQuantity}
          min={1}
          onChange={(event) => {
            const requestedQuantity = Number(event.target.value);
            setQuantity(requestedQuantity);
            setError(requestedQuantity > maxQuantity ? inventoryError : "");
          }}
          required
          type="number"
          value={quantity}
        />
      </div>

      <p className="flex justify-between border-t border-roya-slate/20 pt-4 text-lg font-semibold text-roya-ink">
        <span>Total</span>
        <span>{ticketPrice.format(total)}</span>
      </p>

      {(error || soldOut) && (
        <p className="text-sm text-red-700" role="alert">
          {error || inventoryError}
        </p>
      )}

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
