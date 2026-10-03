"use server";

import { getCurrentProfile } from "@/features/auth/current-profile";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "./schemas";

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

export async function signUp(input: unknown) {
  const result = signupSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { firstName, lastName, email, phone, password } = result.data;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,

    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      },
    },
  });

  if (error) {
    return {
      success: false,
      message: error.message,
    };
  }

  return {
    success: true,
    userId: data.user?.id,
  };
}
