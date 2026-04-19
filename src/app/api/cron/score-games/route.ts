import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchScores } from "@/lib/odds-api";
import { gradeAts } from "@/lib/scoring";
import type { GameRow, PickRow } from "@/lib/db-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Pulls fresh scores from the Odds API, grades any picks for newly-final
 * games, and recomputes standings for affected leagues.
 */
export async function GET(req: Request) {
  const unauth = authorizeCron(req);
  if (unauth) return unauth;

  const supabase = createAdminClient();
  const scores = await fetchScores(3);

  const externalIds = scores.map((s) => s.id);
  const { data: games } = await supabase
    .from("games")
    .select(
      "id, external_id, week, season_year, home_team, away_team, kickoff_time, time_slot, spread_home, locked_spread_home, home_score, away_score, status, created_at, updated_at",
    )
    .in("external_id", externalIds);

  const byExt = new Map(((games ?? []) as GameRow[]).map((g) => [g.external_id!, g]));
  const newlyFinalGameIds: string[] = [];
  const affectedLeagueWeeks = new Set<string>(); // `${league_id}|${week}`

  for (const s of scores) {
    const game = byExt.get(s.id);
    if (!game) continue;

    const scoresMap = new Map(
      (s.scores ?? []).map((x) => [x.name, parseInt(x.score, 10)]),
    );
    const homeScore = scoresMap.get(s.home_team);
    const awayScore = scoresMap.get(s.away_team);

    const updates: Partial<GameRow> = {};
    if (homeScore !== undefined) updates.home_score = homeScore;
    if (awayScore !== undefined) updates.away_score = awayScore;

    if (s.completed && homeScore !== undefined && awayScore !== undefined) {
      if (game.status !== "final") {
        updates.status = "final";
        newlyFinalGameIds.push(game.id);
      }
    } else if (homeScore !== undefined && game.status === "locked") {
      updates.status = "in_progress";
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from("games").update(updates).eq("id", game.id);
    }

    if (newlyFinalGameIds.includes(game.id) && game.locked_spread_home !== null) {
      const grade = gradeAts({
        homeScore: homeScore!,
        awayScore: awayScore!,
        lockedSpreadHome: Number(game.locked_spread_home),
      });

      // Grade every league's picks for this game.
      const { data: picks } = await supabase
        .from("picks")
        .select("id, user_id, league_id, game_id, picked_team, confidence, week")
        .eq("game_id", game.id);

      for (const p of (picks ?? []) as Pick<
        PickRow,
        "id" | "user_id" | "league_id" | "picked_team" | "confidence" | "week"
      >[]) {
        const isCorrect =
          grade === "push"
            ? null
            : (grade === "home_covers" && p.picked_team === game.home_team) ||
              (grade === "away_covers" && p.picked_team === game.away_team);
        const points = isCorrect === true ? p.confidence : 0;
        await supabase
          .from("picks")
          .update({ is_correct: isCorrect, points_earned: points })
          .eq("id", p.id);
        affectedLeagueWeeks.add(`${p.league_id}|${p.week}`);
      }

      // Record the actual MNF total for tiebreakers.
      if (game.time_slot === "monday") {
        const total = homeScore! + awayScore!;
        const { data: tbs } = await supabase
          .from("mnf_tiebreakers")
          .select("id, predicted_total")
          .eq("week", game.week);
        for (const t of tbs ?? []) {
          await supabase
            .from("mnf_tiebreakers")
            .update({
              actual_total: total,
              difference: Math.abs(total - (t.predicted_total as number)),
            })
            .eq("id", t.id);
        }
      }
    }
  }

  // Recompute standings for affected league/weeks.
  for (const key of affectedLeagueWeeks) {
    const [leagueId, weekStr] = key.split("|");
    await recomputeStandings(leagueId, parseInt(weekStr, 10));
  }

  return NextResponse.json({
    scored_games: newlyFinalGameIds.length,
    recomputed: affectedLeagueWeeks.size,
  });

  async function recomputeStandings(leagueId: string, week: number) {
    // Weekly: sum points_earned per user for this (league, week).
    const { data: rows } = await supabase
      .from("picks")
      .select("user_id, points_earned, is_correct")
      .eq("league_id", leagueId)
      .eq("week", week);

    const perUser = new Map<string, { points: number; correct: number }>();
    for (const r of (rows ?? []) as Array<{
      user_id: string;
      points_earned: number;
      is_correct: boolean | null;
    }>) {
      const cur = perUser.get(r.user_id) ?? { points: 0, correct: 0 };
      cur.points += r.points_earned;
      if (r.is_correct === true) cur.correct += 1;
      perUser.set(r.user_id, cur);
    }

    const weeklyRanked = [...perUser.entries()]
      .map(([user_id, v]) => ({ user_id, ...v }))
      .sort((a, b) => b.points - a.points);

    for (let i = 0; i < weeklyRanked.length; i++) {
      const r = weeklyRanked[i];
      await supabase.from("standings").upsert(
        {
          user_id: r.user_id,
          league_id: leagueId,
          week,
          total_points: r.points,
          correct_picks: r.correct,
          rank: i + 1,
        },
        { onConflict: "user_id,league_id,week" },
      );
    }

    // Season (week = 0): aggregate across all weeks.
    const { data: all } = await supabase
      .from("picks")
      .select("user_id, points_earned, is_correct")
      .eq("league_id", leagueId);

    const season = new Map<string, { points: number; correct: number }>();
    for (const r of (all ?? []) as Array<{
      user_id: string;
      points_earned: number;
      is_correct: boolean | null;
    }>) {
      const cur = season.get(r.user_id) ?? { points: 0, correct: 0 };
      cur.points += r.points_earned;
      if (r.is_correct === true) cur.correct += 1;
      season.set(r.user_id, cur);
    }

    const seasonRanked = [...season.entries()]
      .map(([user_id, v]) => ({ user_id, ...v }))
      .sort((a, b) => b.points - a.points);

    for (let i = 0; i < seasonRanked.length; i++) {
      const r = seasonRanked[i];
      await supabase.from("standings").upsert(
        {
          user_id: r.user_id,
          league_id: leagueId,
          week: 0,
          total_points: r.points,
          correct_picks: r.correct,
          rank: i + 1,
        },
        { onConflict: "user_id,league_id,week" },
      );
    }
  }
}
