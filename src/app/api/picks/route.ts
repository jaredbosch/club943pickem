import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { GameRow, PickRow } from "@/lib/db-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PickInput = {
  game_id: string;
  picked_team: string;
  confidence: number;
};

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const leagueId = url.searchParams.get("league");
  const weekParam = url.searchParams.get("week");
  if (!leagueId) {
    return NextResponse.json({ error: "league required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  let query = supabase
    .from("picks")
    .select("id, game_id, picked_team, confidence, is_locked, is_correct, points_earned, week")
    .eq("user_id", userId)
    .eq("league_id", leagueId);
  if (weekParam) query = query.eq("week", parseInt(weekParam, 10));
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ picks: data });
}

/**
 * Upsert the user's picks for a league+week. Body: { league_id, week, picks: PickInput[] }.
 * Rules:
 *   - Caller must be a member of the league.
 *   - Games whose slot is already locked are ignored (DB-level: is_locked picks aren't overwritten).
 *   - Confidence values must be unique per user/league/week (enforced by unique index).
 *   - N must be the number of games that week; full validation lives client-side + server-side.
 */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    league_id?: string;
    week?: number;
    picks?: PickInput[];
  };
  const { league_id, week, picks } = body;

  if (!league_id || typeof week !== "number" || !Array.isArray(picks)) {
    return NextResponse.json({ error: "league_id, week, picks required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Membership check.
  const { data: member } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", league_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!member) {
    return NextResponse.json({ error: "not a league member" }, { status: 403 });
  }

  // Validate games belong to this week.
  const gameIds = picks.map((p) => p.game_id);
  const { data: games } = await supabase
    .from("games")
    .select("id, week, season_year, home_team, away_team, status")
    .in("id", gameIds);

  const gamesById = new Map(((games ?? []) as Pick<GameRow, "id" | "week" | "home_team" | "away_team" | "status">[]).map((g) => [g.id, g]));

  for (const p of picks) {
    const g = gamesById.get(p.game_id);
    if (!g || g.week !== week) {
      return NextResponse.json(
        { error: `game ${p.game_id} not in week ${week}` },
        { status: 400 },
      );
    }
    if (p.picked_team !== g.home_team && p.picked_team !== g.away_team) {
      return NextResponse.json(
        { error: `invalid team for game ${p.game_id}` },
        { status: 400 },
      );
    }
  }

  // Load existing picks to skip locked ones.
  const { data: existing } = await supabase
    .from("picks")
    .select("game_id, is_locked")
    .eq("user_id", userId)
    .eq("league_id", league_id)
    .eq("week", week);

  const lockedGameIds = new Set(
    ((existing ?? []) as Pick<PickRow, "game_id" | "is_locked">[])
      .filter((p) => p.is_locked)
      .map((p) => p.game_id),
  );

  const mutable = picks.filter((p) => !lockedGameIds.has(p.game_id));

  // Duplicate confidence in incoming batch?
  const seen = new Set<number>();
  for (const p of mutable) {
    if (seen.has(p.confidence)) {
      return NextResponse.json(
        { error: `confidence ${p.confidence} used more than once` },
        { status: 400 },
      );
    }
    seen.add(p.confidence);
  }

  // Two-phase upsert: bump mutable rows to temporary negative confidence first
  // to avoid tripping the unique index on in-place swaps.
  for (let i = 0; i < mutable.length; i++) {
    await supabase
      .from("picks")
      .update({ confidence: -1 - i })
      .eq("user_id", userId)
      .eq("league_id", league_id)
      .eq("game_id", mutable[i].game_id);
  }

  // Upsert the new values.
  const rows = mutable.map((p) => ({
    user_id: userId,
    league_id,
    game_id: p.game_id,
    week,
    picked_team: p.picked_team,
    confidence: p.confidence,
    is_locked: false,
  }));

  const { error } = await supabase
    .from("picks")
    .upsert(rows, { onConflict: "user_id,league_id,game_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ saved: rows.length, skipped_locked: picks.length - mutable.length });
}
