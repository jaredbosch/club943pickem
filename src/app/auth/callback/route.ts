import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/picks";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/picks";

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: { name: string; value: string; options: CookieOptions }[],
          ) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // Fails when the link is opened in a different browser than the one that
    // requested it (no code_verifier cookie), or when the code was already used.
    // Don't drop a password-reset user on a form that can only error out.
    if (error && next === "/reset-password") {
      return NextResponse.redirect(new URL("/forgot-password?error=link_invalid", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
