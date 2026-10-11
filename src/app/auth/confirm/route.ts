import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Email links (password reset) land here with a token_hash instead of a PKCE
// code. verifyOtp needs no code_verifier cookie, so the link works in whatever
// browser opens it — Gmail's in-app browser, a different device, etc. The
// Supabase "Reset password" email template must point at:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next") ?? "/picks";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/picks";

  if (tokenHash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  const failUrl =
    type === "recovery" ? "/forgot-password?error=link_invalid" : "/sign-in?error=link_invalid";
  return NextResponse.redirect(new URL(failUrl, request.url));
}
