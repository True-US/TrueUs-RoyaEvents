"use server";

import { getCurrentProfile } from "@/features/auth/current-profile";

export async function checkActiveProfileForLogin() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return {
      isActive: false,
      message:
        "No profile is associated with this account. Contact an administrator.",
    };
  }

  if (!profile.isActive) {
    return {
      isActive: false,
      message:
        "This account is inactive. Contact an administrator to reactivate it.",
    };
  }

  return { isActive: true, message: "" };
}
