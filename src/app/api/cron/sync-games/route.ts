import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncGames } from "@/lib/odds/sync-games";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vercel Cron hits this route with `Authorization: Bearer <CRON_SECRET>`.
// Also callable manually for local dev with the same header.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ODDS_API_KEY not configured" },
      { status: 500 },
    );
  }

  try {
    const supabase = createAdminClient();
    const stats = await syncGames(supabase, apiKey);
    return NextResponse.json({ ok: true, ...stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
