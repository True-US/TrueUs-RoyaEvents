import { z } from "zod";
export const roleIdSchema = z.union([z.literal(2), z.literal(3)]);

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
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\d+$/, "Phone number must contain only numbers")
    .max(30)
    .nullable(),
});

export const deactivateProfileSchema = z.object({
  id: z.number().int().positive(),
  roleId: roleIdSchema,
});

export const reactivateProfileSchema = z.object({
  id: z.number().int().positive(),
  roleId: roleIdSchema,
});
