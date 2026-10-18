import { z } from "zod";

import { MAX_TICKETS_PER_ORDER } from "@/features/bookings/constants";
import { emailField, textField } from "@/lib/validation/fields";
import { msg } from "@/lib/validation/messages";

// Matches booking.customer_name VarChar(200).
export const CUSTOMER_NAME_MAX: number = 200;

/**
 * The ticket checkout details. Shared by the checkout form (fast feedback) and
 * /api/checkout (the real check).
 */
export const checkoutSchema = z.object({
  slug: z
    .string({ error: msg.invalid("Event") })
    .trim()
    .min(1, msg.invalid("Event"))
    .max(255, msg.invalid("Event")),
  quantity: z
    .number({ error: msg.number("Number of tickets") })
    .int(msg.wholeNumber("Number of tickets"))
    .min(1, msg.minValue("Number of tickets", 1))
    .max(MAX_TICKETS_PER_ORDER, `You can buy up to ${MAX_TICKETS_PER_ORDER} tickets per order.`),
  name: textField("Name", CUSTOMER_NAME_MAX, 2),
  email: emailField(),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
