import "server-only";
import { createClient } from "@supabase/supabase-js";

/** True when the service role key is configured (needed to create accounts and read emails). */
export function hasServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/**
 * Supabase client with the service role key: bypasses RLS and can manage Auth users.
 * Server-only; returns null when SUPABASE_SERVICE_ROLE_KEY is missing so callers can explain it.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
