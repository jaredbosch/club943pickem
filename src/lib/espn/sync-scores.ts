import type { SupabaseClient } from "@supabase/supabase-js";
import { nflSeasonYear, nflWeek } from "@/lib/nfl/week";
import { fetchEspnScoreboard, normalizeEspnAbbr } from "./client";
import type { EspnStatusName } from "./types";

export type ScoreSyncStats = {
  weeks: number[];
  updated: number;
  finalGames: number;
  errors: string[];
};

function espnStatusToDb(name: EspnStatusName, state: string): "scheduled" | "locked" | "in_progress" | "final" | null {
  if (state === "post" || name.includes("FINAL")) return "final";
  if (state === "in" || name === "STATUS_HALFTIME" || name === "STATUS_END_PERIOD") return "in_progress";
  return null; // scheduled/pre — don't overwrite existing locked status
}

export async function syncScores(supabase: SupabaseClient): Promise<ScoreSyncStats> {
  const now = new Date();
  const seasonYear = nflSeasonYear(now);
  const currentWeek = nflWeek(now, seasonYear);

  // Fetch current week and previous week (to catch late updates)
  const weeks = currentWeek > 1 ? [currentWeek - 1, currentWeek] : [currentWeek];
  const stats: ScoreSyncStats = { weeks, updated: 0, finalGames: 0, errors: [] };

  for (const week of weeks) {
    let scoreboard;
    try {
      scoreboard = await fetchEspnScoreboard(week, seasonYear);
    } catch (err) {
      stats.errors.push(`week ${week}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    for (const event of scoreboard.events ?? []) {
      const comp = event.competitions?.[0];
      if (!comp) continue;

      const homeComp = comp.competitors.find((c) => c.homeAway === "home");
      const awayComp = comp.competitors.find((c) => c.homeAway === "away");
      if (!homeComp || !awayComp) continue;

      const homeTeam = normalizeEspnAbbr(homeComp.team.abbreviation);
      const awayTeam = normalizeEspnAbbr(awayComp.team.abbreviation);
      const { name, state } = comp.status.type;
      const newStatus = espnStatusToDb(name, state);

      const homeScore = homeComp.score != null ? parseInt(homeComp.score, 10) : null;
      const awayScore = awayComp.score != null ? parseInt(awayComp.score, 10) : null;

      // Find matching game by teams + week + season
      const { data: game } = await supabase
        .from("games")
        .select("id, status")
        .eq("home_team", homeTeam)
        .eq("away_team", awayTeam)
        .eq("week", week)
        .eq("season_year", seasonYear)
        .maybeSingle();

      if (!game) continue;

      // Build update — only upgrade status, never downgrade (locked → scheduled)
      const statusOrder = ["scheduled", "locked", "in_progress", "final"];
      const currentIdx = statusOrder.indexOf(game.status);
      const newIdx = newStatus ? statusOrder.indexOf(newStatus) : -1;

      const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (homeScore !== null) update.home_score = homeScore;
      if (awayScore !== null) update.away_score = awayScore;
      if (newIdx > currentIdx) update.status = newStatus;

      const { error } = await supabase.from("games").update(update).eq("id", game.id);
      if (error) {
        stats.errors.push(`game ${game.id}: ${error.message}`);
        continue;
      }

      stats.updated++;
      if (newStatus === "final") stats.finalGames++;
    }
  }

  return stats;
}
