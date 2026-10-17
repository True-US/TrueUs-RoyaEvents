import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { prisma as supabasePrisma } from "@/lib/supabase/prisma";
import { msg } from "@/lib/validation/messages";

/**
 * An error whose message is safe to show to the user. Any other error thrown
 * while signing up is logged and replaced by a generic message.
 */
export class SignupError extends Error {}

/**
 * Creates the Supabase Auth user and the matching profile. The input must
 * already be checked by signupSchema (trimmed, lowercased email, digits-only phone).
 * @param input The checked signup values.
 * @returns The new auth user id and profile id.
 * @throws SignupError for problems the user can fix (email already used).
 */
export async function createUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}) {
  const supabase = await createClient();
  const email = input.email;

  const existingProfile = await supabasePrisma.profile.findUnique({
    where: { email },
  });

  if (existingProfile) {
    throw new SignupError("An account with this email already exists.");
  }

  // Check the role first, so a missing role doesn't leave an auth user behind.
  const customerRole = await supabasePrisma.role.findUnique({
    where: { name: "User" },
  });

  if (!customerRole) {
    console.error('Signup: the "User" role is not configured.');
    throw new SignupError(msg.unableTo("create the account"));
  }

  //create the user in Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone ?? null,
      },
    },
  });

  if (error) {
    console.error("Signup: Supabase Auth error:", error);
    if (/already (registered|exists)/i.test(error.message)) {
      throw new SignupError("An account with this email already exists.");
    }
    throw new SignupError(msg.unableTo("create the account"));
  }
  if (!data.user) {
    throw new SignupError(msg.unableTo("create the account"));
  }

  // insert the new user into the database
  try {
    const profile = await supabasePrisma.profile.create({
      data: {
        authUserId: data.user.id,
        roleId: customerRole.id,
        firstName: input.firstName,
        lastName: input.lastName,
        email,
        phone: input.phone ?? null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return { userId: data.user.id, profileId: profile.id };
  } catch (profileError) {
    // Without a profile the user could never log in, so remove the auth user.
    console.error("Signup: profile insert failed:", profileError);
    const { error: deleteError } = await createAdminClient().auth.admin.deleteUser(data.user.id);
    if (deleteError) {
      console.error("Signup: could not remove the auth user:", deleteError);
    }
    throw new SignupError(msg.unableTo("create the account"));
  }
}
