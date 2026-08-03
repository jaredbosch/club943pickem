import type { SupabaseClient } from "@supabase/supabase-js";
import { nflSeasonYear, nflWeek } from "@/lib/nfl/week";
import { teamAbbr } from "@/lib/nfl/teams";
import { timeSlotFor } from "@/lib/nfl/time-slot";
import { extractHomeSpread, fetchNflOdds } from "./client";
import type { OddsApiGame } from "./types";

export type SyncStats = {
  fetched: number;
  upserted: number;
  snapshots: number;
  skipped: { id: string; reason: string }[];
};

type GameRow = {
  external_id: string;
  week: number;
  season_year: number;
  home_team: string;
  away_team: string;
  kickoff_time: string;
  time_slot: ReturnType<typeof timeSlotFor>;
  spread_home: number | null;
};

export function transformGame(game: OddsApiGame): GameRow {
  const kickoff = new Date(game.commence_time);
  const season = nflSeasonYear(kickoff);
  return {
    external_id: game.id,
    week: nflWeek(kickoff, season),
    season_year: season,
    home_team: teamAbbr(game.home_team),
    away_team: teamAbbr(game.away_team),
    kickoff_time: kickoff.toISOString(),
    time_slot: timeSlotFor(kickoff),
    spread_home: extractHomeSpread(game),
  };
}

export async function syncGames(
  supabase: SupabaseClient,
  apiKey: string,
): Promise<SyncStats> {
  const games = await fetchNflOdds(apiKey);
  const stats: SyncStats = { fetched: games.length, upserted: 0, snapshots: 0, skipped: [] };

  for (const game of games) {
    let row: GameRow;
    try {
      row = transformGame(game);
    } catch (err) {
      stats.skipped.push({
        id: game.id,
        reason: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    // Find the existing row: by external_id first, then by matchup — schedule
    // rows seeded by scripts/import-schedule.mjs have no external_id, and an
    // external_id-only upsert would duplicate them instead of adopting them.
    const { data: byExt, error: extErr } = await supabase
      .from("games")
      .select("id")
      .eq("external_id", row.external_id)
      .limit(1)
      .maybeSingle();
    if (extErr) {
      stats.skipped.push({ id: game.id, reason: extErr.message });
      continue;
    }

    let gameId = byExt?.id ?? null;
    if (!gameId) {
      const { data: byMatchup, error: matchErr } = await supabase
        .from("games")
        .select("id")
        .eq("season_year", row.season_year)
        .eq("week", row.week)
        .eq("home_team", row.home_team)
        .eq("away_team", row.away_team)
        .limit(1)
        .maybeSingle();
      if (matchErr) {
        stats.skipped.push({ id: game.id, reason: matchErr.message });
        continue;
      }
      gameId = byMatchup?.id ?? null;
    }

    const { data: upserted, error } = gameId
      ? await supabase
          .from("games")
          .update(row)
          .eq("id", gameId)
          .select("id, spread_home")
          .maybeSingle()
      : await supabase
          .from("games")
          .insert(row)
          .select("id, spread_home")
          .maybeSingle();

    if (error) {
      stats.skipped.push({ id: game.id, reason: error.message });
      continue;
    }
    stats.upserted++;

    // Record a spread snapshot if we have a spread and a game ID
    if (upserted?.id && row.spread_home !== null) {
      // Only insert if the spread differs from the most recent snapshot
      const { data: lastSnap } = await supabase
        .from("spread_history")
        .select("spread_home")
        .eq("game_id", upserted.id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastSpread = lastSnap?.spread_home ?? null;
      if (lastSpread === null || Math.abs(Number(lastSpread) - row.spread_home) >= 0.5) {
        const { error: snapErr } = await supabase
          .from("spread_history")
          .insert({ game_id: upserted.id, spread_home: row.spread_home });
        if (!snapErr) stats.snapshots++;
      }
    }
  }

  return stats;
}
