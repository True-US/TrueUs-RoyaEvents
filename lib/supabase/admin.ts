import "server-only";

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const missingVariables = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
  ].filter(Boolean);

  if (missingVariables.length > 0) {
    throw new Error(
      `Supabase admin access is missing required environment variable${missingVariables.length === 1 ? "" : "s"}: ${missingVariables.join(", ")}. Set them on the server and restart the app.`,
    );
  }

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin environment configuration is invalid.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
