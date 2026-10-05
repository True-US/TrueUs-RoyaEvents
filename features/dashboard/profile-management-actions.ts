"use server";

import { revalidatePath } from "next/cache";

import {
  getCurrentProfile,
  isAdminRole,
} from "@/features/auth/current-profile";
import { getManagedProfilePage } from "@/features/dashboard/profile-management";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  PROFILES_PER_PAGE,
  type ManagedProfile,
} from "@/features/dashboard/profile-management-types";
import { prisma } from "@/lib/supabase/prisma";
import {
  pageRequestSchema,
  profilePageRequestSchema,
  updateProfileSchema,
  deactivateProfileSchema,
  reactivateProfileSchema,
} from "@/features/dashboard/profile-management-schemas";

async function requireActiveAdmin() {
  const profile = await getCurrentProfile();

  if (
    !profile ||
    !profile.isActive ||
    !profile.role.isActive ||
    !isAdminRole(profile.role.name)
  ) {
    throw new Error("You are not authorized to manage profiles.");
  }

  return profile;
}

export async function loadManagedProfilesPage(input: unknown) {
  await requireActiveAdmin();
  const result = pageRequestSchema.safeParse(input);

  if (!result.success) {
    throw new Error("Invalid profile page request.");
  }

  const { roleId, page } = result.data;
  const pageData = await getManagedProfilePage(roleId, page);
  const lastPage = Math.max(1, pageData.totalPages);

  return page > lastPage ? getManagedProfilePage(roleId, lastPage) : pageData;
}

export async function loadManagedProfilePageContaining(input: unknown) {
  await requireActiveAdmin();
  const result = profilePageRequestSchema.safeParse(input);

  if (!result.success) {
    throw new Error("Invalid profile page request.");
  }

  const { roleId, profileId } = result.data;
  const profilesBeforeTarget = await prisma.profile.count({
    where: { roleId, id: { lte: profileId } },
  });
  if (profilesBeforeTarget === 0) {
    throw new Error("The profile was not found in the selected role.");
  }

  const page = Math.ceil(profilesBeforeTarget / PROFILES_PER_PAGE);
  return getManagedProfilePage(roleId, page);
}

export async function updateManagedProfile(
  input: unknown,
): Promise<
  | { success: true; profile: ManagedProfile }
  | { success: false; message: string }
> {
  const currentAdmin = await requireActiveAdmin();
  const result = updateProfileSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      message:
        result.error.issues[0]?.message ?? "Invalid profile information.",
    };
  }

  const { id, currentRoleId, roleId, firstName, lastName, phone } = result.data;

  if (currentAdmin.id === id && roleId !== currentRoleId) {
    return {
      success: false,
      message: "You cannot change your own role.",
    };
  }

  const updated = await prisma.profile.updateMany({
    where: { id, roleId: currentRoleId },
    data: {
      roleId,
      firstName,
      lastName,
      phone: phone || null,
    },
  });

  if (updated.count === 0) {
    return { success: false, message: "Profile not found." };
  }

  const updatedProfile = await prisma.profile.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      roleId: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      isActive: true,
      authUserId: true,
    },
  });

  const { data: authResult, error: authError } =
    await createAdminClient().auth.admin.getUserById(updatedProfile.authUserId);

  if (authError) {
    throw new Error(
      `Unable to load authentication dates for profile ${id}: ${authError.message}`,
    );
  }

  if (!authResult.user) {
    throw new Error(`No Supabase Auth user exists for profile ${id}.`);
  }

  revalidatePath("/dashboard");
  return {
    success: true,
    profile: {
      id: updatedProfile.id,
      roleId,
      firstName: updatedProfile.firstName,
      lastName: updatedProfile.lastName,
      email: updatedProfile.email,
      phone: updatedProfile.phone,
      isActive: updatedProfile.isActive,
      createdAt: authResult.user.created_at,
      lastSignInAt: authResult.user.last_sign_in_at ?? null,
    },
  };
}

export async function deactivateManagedProfile(input: unknown) {
  const currentAdmin = await requireActiveAdmin();
  const result = deactivateProfileSchema.safeParse(input);

  if (!result.success) {
    return { success: false as const, message: "Invalid profile request." };
  }

  const { id, roleId } = result.data;
  if (currentAdmin.id === id) {
    return {
      success: false as const,
      message: "You cannot deactivate your own admin profile.",
    };
  }

  const updated = await prisma.profile.updateMany({
    where: { id, roleId, isActive: true },
    data: { isActive: false },
  });

  if (updated.count === 0) {
    return {
      success: false as const,
      message: "Profile not found or already inactive.",
    };
  }

  revalidatePath("/dashboard");
  return { success: true as const };
}

export async function reactivateManagedProfile(input: unknown) {
  await requireActiveAdmin();
  const result = reactivateProfileSchema.safeParse(input);

  if (!result.success) {
    return { success: false as const, message: "Invalid profile request." };
  }

  const { id, roleId } = result.data;
  const updated = await prisma.profile.updateMany({
    where: { id, roleId, isActive: false },
    data: { isActive: true },
  });

  if (updated.count === 0) {
    return {
      success: false as const,
      message: "Profile not found or already active.",
    };
  }

  revalidatePath("/dashboard");
  return { success: true as const };
}
