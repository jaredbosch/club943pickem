import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the authenticated Supabase user id (uuid) or null.
 */
export async function getUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Route-level helper. Redirects to /sign-in when unauthenticated.
 */
export async function requireUserId(nextPath?: string): Promise<string> {
  const id = await getUserId();
  if (!id) {
    redirect(
      `/sign-in${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`,
    );
  }
  return id;
}
