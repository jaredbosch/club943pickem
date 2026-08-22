import { NextResponse, type NextRequest } from "next/server";
import { getMarkdownForPath, NOT_FOUND_MARKDOWN } from "@/lib/agent-markdown";

export const dynamic = "force-dynamic";

const MARKDOWN_HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  Vary: "Accept",
  "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET(request: NextRequest) {
  // Middleware rewrites pass the original path via header (rewrite query params
  // are not reliably visible here); direct calls can use ?path=.
  const pathname =
    request.headers.get("x-markdown-path") ??
    request.nextUrl.searchParams.get("path") ??
    new URL(request.url).searchParams.get("path") ??
    "/";
  const markdown = getMarkdownForPath(pathname);

  if (!markdown) {
    return new NextResponse(NOT_FOUND_MARKDOWN, { status: 404, headers: MARKDOWN_HEADERS });
  }
  return new NextResponse(markdown, { status: 200, headers: MARKDOWN_HEADERS });
}
