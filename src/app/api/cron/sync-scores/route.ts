import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncScores } from "@/lib/espn/sync-scores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = createAdminClient();

    // 1. Pull scores from ESPN
    const scoreStats = await syncScores(supabase);

    // 2. If any games went final, grade picks + rebuild standings for every league
    let gradingResults: Record<string, unknown>[] = [];
    if (scoreStats.finalGames > 0) {
      const now = new Date();
      const p_season_year = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
      const { data: leagues } = await supabase.from("leagues").select("id");
      for (const league of leagues ?? []) {
        const { data, error } = await supabase.rpc("grade_and_sync_standings", {
          p_league_id: league.id,
          p_season_year,
        });
        gradingResults.push({ league: league.id, result: data, error: error?.message });
      }
    }

    return NextResponse.json({ ok: true, scores: scoreStats, grading: gradingResults });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
