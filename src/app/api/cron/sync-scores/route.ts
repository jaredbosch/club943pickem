import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncScores } from "@/lib/espn/sync-scores";
import { nflSeasonYear } from "@/lib/nfl/week";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = createAdminClient();

    // 0. Lock anything at/past its posted kickoff (spec §2.3: 5 min before).
    //    Piggybacks on this route because the external pinger hits it every
    //    couple of minutes — Vercel crons alone are too coarse.
    const { data: lockStats, error: lockError } = await supabase.rpc("lock_slots");
    if (lockError) console.error("lock_slots failed:", lockError.message);

    // 0.5 Idle guard — the pinger hits this route every ~2 min around the
    // clock, but ESPN only needs polling when something can actually change:
    // a live game, a kickoff within 30 min (or one ESPN hasn't flipped yet),
    // or a recent final that might still get corrected. Otherwise skip the
    // fetch entirely (~95% of calls). Locking above always runs — pure DB.
    const now = new Date();
    const seasonYear = nflSeasonYear(now);
    const in30m = new Date(now.getTime() + 30 * 60_000).toISOString();
    const sixHoursAgo = new Date(now.getTime() - 6 * 3600_000).toISOString();
    const oneHourAgo = new Date(now.getTime() - 3600_000).toISOString();
    const { data: activeGames } = await supabase
      .from("games")
      .select("id")
      .eq("season_year", seasonYear)
      .or(
        `status.eq.in_progress,` +
        `and(status.in.(scheduled,locked),kickoff_time.gte.${sixHoursAgo},kickoff_time.lte.${in30m}),` +
        `and(status.eq.final,updated_at.gte.${oneHourAgo})`
      )
      .limit(1);

    if (!activeGames?.length) {
      return NextResponse.json({
        ok: true,
        locks: lockError ? { error: lockError.message } : lockStats,
        skipped: "idle — no live, imminent, or recently-final games",
      });
    }

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

    return NextResponse.json({
      ok: true,
      locks: lockError ? { error: lockError.message } : lockStats,
      scores: scoreStats,
      grading: gradingResults,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
