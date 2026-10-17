import { z } from "zod";

import {
  emailField,
  nameField,
  optionalPhoneField,
  passwordField,
} from "@/lib/validation/fields";
import { msg } from "@/lib/validation/messages";

export const signupSchema = z
  .object({
    firstName: nameField("First name"),
    lastName: nameField("Last name"),
    email: emailField(),
    phone: optionalPhoneField(),
    password: passwordField(),
    confirmPassword: z
      .string({ error: msg.required("Confirm password") })
      .min(1, msg.required("Confirm password")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: msg.passwordsMatch,
    path: ["confirmPassword"],
  });

// What the signup form sends.
export type SignupInput = z.input<typeof signupSchema>;

// Login only checks the password is there: strength rules apply when it is created.
export const loginSchema = z.object({
  email: emailField(),
  password: z
    .string({ error: msg.required("Password") })
    .min(1, msg.required("Password")),
});
