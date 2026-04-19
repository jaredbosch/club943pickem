import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Handles the redirect from Supabase-sent confirmation / magic-link emails
 * (and OAuth providers, once enabled). Exchanges the `code` for a session
 * cookie and forwards to `next` (defaults to /picks).
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/picks";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/picks";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, url));
    }
    return NextResponse.redirect(
      new URL(`/sign-in?error=${encodeURIComponent(error.message)}`, url),
    );
  }

  return NextResponse.redirect(
    new URL(`/sign-in?error=${encodeURIComponent("Missing confirmation code")}`, url),
  );
}
