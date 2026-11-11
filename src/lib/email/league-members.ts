import type { SupabaseClient } from "@supabase/supabase-js";
import { nflWeek } from "@/lib/nfl/week";
import { isPick5Format, type ScoringType } from "@/lib/scoring";
import { countOpenUnpicked, type WeekGame } from "@/lib/picks/unpicked";

export type EmailLeague = {
  id: string;
  season_year: number;
  scoring_type: string | null;
  pick5_lock_mode: string | null;
};

/** Same active-week rule as the picks page and the nav badge. */
export function activePickWeek(seasonYear: number, now: Date = new Date()): number {
  return Math.max(1, Math.min(18, nflWeek(now, seasonYear)));
}

// PostgREST caps every response at max_rows (1000) — page through so a big
// league's picks aren't silently truncated.
const PAGE = 1000;

/**
 * Of `userIds`, those who still owe a pick on a game that hasn't locked this
 * week. Uses the admin client: it reads every member's picks, including ones
 * leaguemates can't see yet.
 */
export async function usersWithUnpickedGames(
  admin: SupabaseClient,
  league: EmailLeague,
  userIds: string[],
  now: Date = new Date(),
): Promise<Set<string>> {
  const result = new Set<string>();
  if (userIds.length === 0) return result;

  const { data: games, error: gamesError } = await admin
    .from("games")
    .select("id, status, kickoff_time, time_slot")
    .eq("season_year", league.season_year)
    .eq("week", activePickWeek(league.season_year, now));
  if (gamesError) throw gamesError;
  const weekGames = (games ?? []) as WeekGame[];
  if (weekGames.length === 0) return result;

  const pickedByUser = new Map<string, Set<string>>();
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("picks")
      .select("id, user_id, game_id")
      .eq("league_id", league.id)
      .in("game_id", weekGames.map((g) => g.id))
      .not("picked_team", "is", null)
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const p of data ?? []) {
      let set = pickedByUser.get(p.user_id);
      if (!set) pickedByUser.set(p.user_id, (set = new Set()));
      set.add(p.game_id);
    }
    if (!data || data.length < PAGE) break;
  }

  const pick5 = isPick5Format((league.scoring_type ?? "ats_confidence") as ScoringType);
  const lockMode = league.pick5_lock_mode === "sunday" ? "sunday" : "thursday";
  const nowMs = now.getTime();
  for (const userId of userIds) {
    const owed = countOpenUnpicked({
      games: weekGames,
      pickedGameIds: pickedByUser.get(userId) ?? new Set(),
      pick5,
      lockMode,
      nowMs,
    });
    if (owed > 0) result.add(userId);
  }
  return result;
}
