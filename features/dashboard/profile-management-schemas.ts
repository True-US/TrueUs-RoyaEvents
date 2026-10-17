import { z } from "zod";

import { PERSON_NAME_MAX } from "@/features/auth/constants";
import { optionalPhoneField, textField } from "@/lib/validation/fields";
import { msg } from "@/lib/validation/messages";

export const roleIdSchema = z.union([z.literal(2), z.literal(3)], { error: msg.invalid("Role") });

export const pageRequestSchema = z.object({
  roleId: roleIdSchema,
  page: z.number().int().min(1),
});

export const profilePageRequestSchema = z.object({
  roleId: roleIdSchema,
  profileId: z.number().int().positive(),
});

export const updateProfileSchema = z.object({
  id: z.number().int().positive(),
  currentRoleId: roleIdSchema,
  roleId: roleIdSchema,
  // Admins can save any name, so no letters-only rule here (signup keeps it).
  firstName: textField("First name", PERSON_NAME_MAX),
  lastName: textField("Last name", PERSON_NAME_MAX),
  phone: optionalPhoneField(),
});

export const deactivateProfileSchema = z.object({
  id: z.number().int().positive(),
  roleId: roleIdSchema,
});

export const reactivateProfileSchema = z.object({
  id: z.number().int().positive(),
  roleId: roleIdSchema,
});
