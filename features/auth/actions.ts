"use server";

import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "./schemas";

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
