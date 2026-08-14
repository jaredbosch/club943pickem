import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted server code only (cron, webhooks, admin routes).
 * Never import into client components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      // Next.js caches fetch() responses on Vercel (Data Cache) even in
      // force-dynamic route handlers. Without no-store, supabase-js reads —
      // including the lock_slots RPC — get served from cache and never reach
      // the database (verified via Supabase edge logs 2026-08-14: zero
      // lock_slots requests arriving while the route reported "success").
      global: {
        fetch: (url, options = {}) => fetch(url, { ...options, cache: "no-store" }),
      },
    },
  );
}
