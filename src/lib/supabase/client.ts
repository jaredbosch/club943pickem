"use client";

import { useSession } from "@clerk/nextjs";
import { createClient } from "@supabase/supabase-js";
import { useMemo } from "react";

/**
 * Supabase client for client components. Returns a stable client tied to the
 * current Clerk session; RLS resolves via auth.jwt()->>'sub' = Clerk user ID.
 */
export function useSupabaseClient() {
  const { session } = useSession();

  return useMemo(
    () =>
      createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
          accessToken: async () => (await session?.getToken()) ?? null,
        },
      ),
    [session],
  );
}
