import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailLinkSecret, verifyUnsubscribeToken } from "@/lib/email/league-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// League-email unsubscribe.
//
// POST ?m=<league_members.id>&t=<token>
//   - RFC 8058 one-click from mail clients (body "List-Unsubscribe=One-Click")
//   - the /unsubscribe page's form (fields from=page, a=unsubscribe|resubscribe)
// GET forwards to the /unsubscribe page, which asks before changing anything
// (so link scanners that prefetch URLs can't unsubscribe people).

function pageUrl(request: NextRequest, m: string, t: string, done?: "out" | "in" | "error") {
  const url = new URL("/unsubscribe", request.nextUrl.origin);
  url.searchParams.set("m", m);
  url.searchParams.set("t", t);
  if (done) url.searchParams.set("done", done);
  return url;
}

export async function GET(request: NextRequest) {
  const m = request.nextUrl.searchParams.get("m") ?? "";
  const t = request.nextUrl.searchParams.get("t") ?? "";
  return NextResponse.redirect(pageUrl(request, m, t), 303);
}

export async function POST(request: NextRequest) {
  const m = request.nextUrl.searchParams.get("m") ?? "";
  const t = request.nextUrl.searchParams.get("t") ?? "";

  let fromPage = false;
  let action: "unsubscribe" | "resubscribe" = "unsubscribe";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("form")) {
    const form = await request.formData().catch(() => null);
    fromPage = form?.get("from") === "page";
    if (form?.get("a") === "resubscribe") action = "resubscribe";
  }

  const secret = emailLinkSecret();
  if (!secret || !verifyUnsubscribeToken(m, t, secret)) {
    return fromPage
      ? NextResponse.redirect(pageUrl(request, m, t, "error"), 303)
      : NextResponse.json({ error: "Invalid unsubscribe link" }, { status: 400 });
  }

  const { error } = await createAdminClient()
    .from("league_members")
    .update({ email_opt_out: action === "unsubscribe" })
    .eq("id", m);

  if (fromPage) {
    return NextResponse.redirect(pageUrl(request, m, t, error ? "error" : action === "unsubscribe" ? "out" : "in"), 303);
  }
  if (error) return NextResponse.json({ error: "Could not update preference" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
