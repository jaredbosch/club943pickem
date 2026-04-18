import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server code only (cron, webhooks, admin routes).
 * Never import into client components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
