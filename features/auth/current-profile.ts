import "server-only";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/supabase/prisma";

const ADMIN_ROLE_NAMES = new Set(["Admin"]);

export function isAdminRole(roleName: string) {
  return ADMIN_ROLE_NAMES.has(roleName.trim());
}

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return prisma.profile.findUnique({
    where: { authUserId: user.id },
    include: { role: true },
  });
}
