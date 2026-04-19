import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { LOCK_LEAD_MS } from "@/lib/slots";
import type { GameRow, LeagueMemberRow, PickRow } from "@/lib/db-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Runs every ~5 minutes. For each (season, week, slot) whose earliest
 * kickoff is within LOCK_LEAD_MS:
 *   1. Capture current spread_home -> locked_spread_home.
 *   2. Fill missing picks with the lowest remaining confidence for each league member.
 *   3. Flip game.status -> 'locked', pick.is_locked -> true, tiebreaker.is_locked -> true for MNF slot.
 */
export async function GET(req: Request) {
  const unauth = authorizeCron(req);
  if (unauth) return unauth;

  const supabase = createAdminClient();
  const now = Date.now();
  const cutoff = new Date(now + LOCK_LEAD_MS).toISOString();

  const { data: dueGames, error } = await supabase
    .from("games")
    .select(
      "id, external_id, week, season_year, home_team, away_team, kickoff_time, time_slot, spread_home, locked_spread_home, home_score, away_score, status, created_at, updated_at",
    )
    .eq("status", "scheduled")
    .lte("kickoff_time", cutoff);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!dueGames || dueGames.length === 0) {
    return NextResponse.json({ locked_slots: 0 });
  }

  // Group by (season_year, week, time_slot).
  type Bucket = { season_year: number; week: number; slot: string; games: GameRow[] };
  const buckets = new Map<string, Bucket>();
  for (const g of dueGames as GameRow[]) {
    const key = `${g.season_year}|${g.week}|${g.time_slot}`;
    let b = buckets.get(key);
    if (!b) {
      b = { season_year: g.season_year, week: g.week, slot: g.time_slot, games: [] };
      buckets.set(key, b);
    }
    b.games.push(g);
  }

  let slotsProcessed = 0;

  for (const bucket of buckets.values()) {
    // Capture spreads + flip status.
    for (const g of bucket.games) {
      await supabase
        .from("games")
        .update({
          locked_spread_home: g.spread_home,
          status: "locked",
        })
        .eq("id", g.id);
    }

    // For each league, auto-assign missing picks then flip is_locked.
    const { data: leagues } = await supabase
      .from("leagues")
      .select("id")
      .in("status", ["open", "active"]);

    for (const league of leagues ?? []) {
      const { data: members } = await supabase
        .from("league_members")
        .select("user_id")
        .eq("league_id", league.id);

      for (const m of (members ?? []) as Pick<LeagueMemberRow, "user_id">[]) {
        await autoFillMissingPicks({
          userId: m.user_id,
          leagueId: league.id,
          week: bucket.week,
          slotGames: bucket.games,
        });
      }

      // Flip is_locked on every pick for these games in this league.
      const gameIds = bucket.games.map((g) => g.id);
      await supabase
        .from("picks")
        .update({ is_locked: true })
        .eq("league_id", league.id)
        .in("game_id", gameIds);

      // Lock MNF tiebreakers when the monday slot locks.
      if (bucket.slot === "monday") {
        await supabase
          .from("mnf_tiebreakers")
          .update({ is_locked: true })
          .eq("league_id", league.id)
          .eq("week", bucket.week);
      }
    }

    slotsProcessed++;
  }

  return NextResponse.json({ locked_slots: slotsProcessed });

  async function autoFillMissingPicks(args: {
    userId: string;
    leagueId: string;
    week: number;
    slotGames: GameRow[];
  }) {
    const { userId, leagueId, week, slotGames } = args;

    // Games this user already picked for this league/week.
    const { data: picks } = await supabase
      .from("picks")
      .select("game_id, confidence")
      .eq("user_id", userId)
      .eq("league_id", leagueId)
      .eq("week", week);

    const pickedGameIds = new Set((picks ?? []).map((p) => p.game_id as string));
    const usedConfidence = new Set(
      (picks ?? []).map((p) => p.confidence as number),
    );

    // Games for this league/week that remain unpicked in *this slot*.
    const missing = slotGames.filter((g) => !pickedGameIds.has(g.id));
    if (missing.length === 0) return;

    // Total games this week to size confidence range.
    const { count } = await supabase
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("week", week)
      .eq("season_year", slotGames[0].season_year);
    const N = count ?? slotGames.length;

    // Available confidence values = 1..N minus usedConfidence.
    const available: number[] = [];
    for (let v = 1; v <= N; v++) if (!usedConfidence.has(v)) available.push(v);
    available.sort((a, b) => a - b); // ascending -> lowest first (penalty).

    const inserts: Partial<PickRow>[] = [];
    for (const g of missing) {
      const conf = available.shift();
      if (conf === undefined) break;
      // Default pick: the away team (arbitrary). The locked spread still applies.
      inserts.push({
        user_id: userId,
        league_id: leagueId,
        game_id: g.id,
        week,
        picked_team: g.away_team,
        confidence: conf,
        is_locked: true,
      });
    }
    if (inserts.length > 0) {
      await supabase.from("picks").insert(inserts);
    }
  }
}
