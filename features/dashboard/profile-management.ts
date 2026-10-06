import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/supabase/prisma";
import {
  PROFILES_PER_PAGE,
  type ManagedProfile,
  type ManagedProfilePage,
  type ManagedProfileRoleId,
} from "./profile-management-types";

export async function getManagedProfilePage(
  roleId: ManagedProfileRoleId,
  page: number,
): Promise<ManagedProfilePage> {
  const where = { roleId };

  const [profiles, totalProfiles] = await Promise.all([
    prisma.profile.findMany({
      where,
      select: {
        id: true,
        authUserId: true,
        roleId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
      },
      orderBy: { id: "asc" },
      skip: (page - 1) * PROFILES_PER_PAGE,
      take: PROFILES_PER_PAGE,
    }),

    prisma.profile.count({ where }),
  ]);

  const supabaseAdmin = createAdminClient();

  const profilesWithAuthDates = await Promise.all(
    profiles.map(async (profile) => {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(
        profile.authUserId,
      );

      if (error) {
        if (error.message === "User not found") {
          return {
            id: profile.id,
            roleId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phone: profile.phone,
            isActive: profile.isActive,
            createdAt: null,
            lastSignInAt: null,
          };
        }

        throw new Error(
          `Unable to load authentication dates for profile ${profile.id}: ${error.message}`,
        );
      }

      if (!data.user) {
        return {
          id: profile.id,
          roleId,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phone: profile.phone,
          isActive: profile.isActive,
          createdAt: null,
          lastSignInAt: null,
        };
      }

      return {
        id: profile.id,
        roleId,
        authUserId: profile.authUserId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        isActive: profile.isActive,
        createdAt: data.user.created_at,
        lastSignInAt: data.user.last_sign_in_at ?? null,
      };
    }),
  );

  return {
    profiles: profilesWithAuthDates,
    page,
    totalPages: Math.max(1, Math.ceil(totalProfiles / PROFILES_PER_PAGE)),
    totalProfiles,
  };
}
