import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public pages with a markdown variant served via Accept negotiation or a .md suffix.
// Keep in sync with PAGE_FILES in src/lib/agent-markdown.ts (middleware runs on the
// edge runtime and cannot import that fs-backed module).
const MARKDOWN_PAGES = new Set(["/", "/formats", "/support", "/privacy", "/about", "/docs", "/blog"]);

function hasMarkdownVariant(pathname: string): boolean {
  return MARKDOWN_PAGES.has(pathname) || /^\/blog\/[a-z0-9-]+$/i.test(pathname);
}

// True when the Accept header explicitly ranks text/markdown above text/html.
function prefersMarkdown(accept: string | null): boolean {
  if (!accept || !accept.includes("text/markdown")) return false;
  let markdownQ = 0;
  let htmlQ = 0;
  for (const part of accept.split(",")) {
    const [type, ...params] = part.trim().split(";");
    let q = 1;
    for (const p of params) {
      const m = p.trim().match(/^q=([0-9.]+)$/);
      if (m) q = parseFloat(m[1]) || 0;
    }
    const t = type.trim().toLowerCase();
    if (t === "text/markdown") markdownQ = Math.max(markdownQ, q);
    if (t === "text/html" || t === "application/xhtml+xml") htmlQ = Math.max(htmlQ, q);
  }
  return markdownQ > 0 && markdownQ > htmlQ;
}

function markdownRewrite(request: NextRequest, pathname: string): NextResponse {
  const url = new URL(`/api/markdown?path=${encodeURIComponent(pathname)}`, request.url);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-markdown-path", pathname);
  const response = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  response.headers.set("Vary", "Accept");
  return response;
}

const protectedRoutes = [
  "/picks",
  "/dashboard",
  "/admin",
  "/league",
  "/leagues",
  "/api/picks",
  "/api/leagues",
  "/api/admin",
];

export async function middleware(request: NextRequest) {
  // Cron routes authenticate via Bearer token inside the handler — skip middleware entirely
  if (request.nextUrl.pathname.startsWith("/api/cron")) {
    return NextResponse.next();
  }

  // Markdown for agents: Accept negotiation and .md suffix on public pages
  const { pathname } = request.nextUrl;
  if ((request.method === "GET" || request.method === "HEAD") && !pathname.startsWith("/api/")) {
    // /formats.md, /index.md, /blog/some-post.md → markdown variant (404s in markdown if unknown)
    if (pathname.endsWith(".md")) {
      const stripped = pathname.slice(0, -3);
      const target = stripped === "/index" || stripped === "" ? "/" : stripped;
      return markdownRewrite(request, target);
    }
    if (prefersMarkdown(request.headers.get("accept")) && hasMarkdownVariant(pathname)) {
      return markdownRewrite(request, pathname);
    }
  }

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  // Public pages skip the auth check entirely — no Supabase round-trip. The
  // protected pages also enforce auth in their own server components; this is
  // the outer gate.
  if (!isProtected) {
    const response = NextResponse.next({ request });
    // HTML variant of a content-negotiated page: caches must vary on Accept
    if (hasMarkdownVariant(pathname)) {
      response.headers.append("Vary", "Accept");
    }
    return response;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
