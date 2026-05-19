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

    // Upsert the game
    const { data: upserted, error } = await supabase
      .from("games")
      .upsert(row, { onConflict: "external_id" })
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
