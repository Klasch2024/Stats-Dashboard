import { createClient } from "@supabase/supabase-js";

// Server-side client using the service role key.
// This module must only be imported from server components or route handlers.
// The service role key is never sent to the browser.
export function createServerSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase environment variables. " +
        "Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      // Disable auto-refresh and session persistence — not needed for server-side usage.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
