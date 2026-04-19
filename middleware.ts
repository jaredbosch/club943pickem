import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const PROTECTED_PREFIXES = ["/picks", "/admin", "/leagues"];
const PROTECTED_API_PREFIXES = [
  "/api/picks",
  "/api/leagues",
  "/api/admin",
  "/api/tiebreaker",
];

function isProtected(pathname: string): boolean {
  return (
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    PROTECTED_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))
  );
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies: { name: string; value: string; options: CookieOptions }[]) => {
          cookies.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh session cookies on every request.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtected(req.nextUrl.pathname)) {
    const signIn = req.nextUrl.clone();
    signIn.pathname = "/sign-in";
    signIn.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(signIn);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
