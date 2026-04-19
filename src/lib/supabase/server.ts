import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for RSCs and route handlers.
 * Forwards the Clerk session JWT via the third-party auth integration —
 * RLS policies read auth.jwt()->>'sub' as the Clerk user ID.
 */
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      accessToken: async () => {
        const { getToken } = await auth();
        return (await getToken()) ?? null;
      },
    },
  );
}
