import type { SupabaseClient } from "@supabase/supabase-js";
import { nflSeasonYear, nflWeek } from "@/lib/nfl/week";
import { teamAbbr } from "@/lib/nfl/teams";
import { timeSlotFor } from "@/lib/nfl/time-slot";
import { extractHomeSpread, fetchNflOdds } from "./client";
import type { OddsApiGame } from "./types";

export type SyncStats = {
  fetched: number;
  upserted: number;
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

// Upserts each fetched game into public.games. Uses the service-role client
// so RLS is bypassed. Rows with status='locked' or later keep their
// locked_spread_home; we only refresh spread_home/kickoff_time here.
export async function syncGames(
  supabase: SupabaseClient,
  apiKey: string,
): Promise<SyncStats> {
  const games = await fetchNflOdds(apiKey);
  const stats: SyncStats = { fetched: games.length, upserted: 0, skipped: [] };

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

    const { error } = await supabase
      .from("games")
      .upsert(row, { onConflict: "external_id" });

    if (error) {
      stats.skipped.push({ id: game.id, reason: error.message });
      continue;
    }
    stats.upserted++;
  }

  return stats;
}
