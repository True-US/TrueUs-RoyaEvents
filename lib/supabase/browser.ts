import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

// Authentication and database access for the browser.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
