import { createClient } from "@/lib/supabase/server";

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

export async function createUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}) {
  const supabase = await createClient();
  const email = input.email.trim().toLowerCase();

  const existingProfile = await prisma.profile.findUnique({
    where: { email },
  });

  if (existingProfile) {
    throw new Error("An account with this email already exists.");
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

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Unable to create user");

  const customerRole = await prisma.role.findUnique({
    where: { name: "User" },
  });

  if (!customerRole) {
    throw new Error("CUSTOMER role is not configured");
  }
  // insert the new user into the database
  const profile = await prisma.profile.create({
    data: {
      authUserId: data.user.id,
      roleId: customerRole.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone ?? null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return { userId: data.user.id, profileId: profile.id };
}
