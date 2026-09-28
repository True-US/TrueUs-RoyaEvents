import { z } from "zod";

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
