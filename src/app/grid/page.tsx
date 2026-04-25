import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WeeklyGrid } from "@/components/grid/WeeklyGrid";
import { nflSeasonYear, nflWeek } from "@/lib/nfl/week";

export default async function GridPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: membership } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name, season_year)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/league");

  const leagueId = membership.league_id;
  const league = membership.leagues as unknown as { id: string; name: string; season_year: number };

  const now = new Date();
  const seasonYear = nflSeasonYear(now);

  // Available weeks
  const { data: weekRows } = await supabase
    .from("games")
    .select("week")
    .eq("season_year", seasonYear)
    .order("week", { ascending: false });

  const availableWeeks = [...new Set((weekRows ?? []).map((r) => r.week))].sort((a, b) => a - b);
  const latestWeek = availableWeeks.at(-1) ?? null;
  const requestedWeek = searchParams.week ? parseInt(searchParams.week) : null;
  // Fall back to latest week with data, then 7 (sample week), not nflWeek(now) which overshoots in off-season
  const currentWeek = requestedWeek ?? latestWeek ?? 7;

  // Games for this week
  const { data: games } = await supabase
    .from("games")
    .select("id, home_team, away_team, status, time_slot, kickoff_time")
    .eq("season_year", seasonYear)
    .eq("week", currentWeek)
    .order("kickoff_time", { ascending: true });

  const gameIds = (games ?? []).map((g) => g.id);

  // All picks from all league members for these games
  const { data: allPicks } = gameIds.length
    ? await supabase
        .from("picks")
        .select("user_id, game_id, picked_team, is_correct, points_earned, confidence")
        .eq("league_id", leagueId)
        .in("game_id", gameIds)
    : { data: [] };

  // League members with display names
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, users(display_name, email)")
    .eq("league_id", leagueId);

  // Weekly standings for points / rank
  const { data: weekStandings } = await supabase
    .from("standings")
    .select("user_id, total_points, correct_picks, rank")
    .eq("league_id", leagueId)
    .eq("week", currentWeek);

  const standingsMap = new Map(
    (weekStandings ?? []).map((s) => [s.user_id, s]),
  );

  // Build player rows
  const playerRows = (members ?? []).map((m) => {
    const u = m.users as unknown as { display_name: string | null; email: string } | null;
    const displayName = u?.display_name ?? u?.email?.split("@")[0] ?? "Player";
    const standing = standingsMap.get(m.user_id);
    const playerPicks = (allPicks ?? []).filter((p) => p.user_id === m.user_id);
    const pickMap: Record<string, { pickedTeam: string; isCorrect: boolean | null; confidence: number | null }> = {};
    for (const p of playerPicks) {
      if (p.picked_team) {
        pickMap[p.game_id] = {
          pickedTeam: p.picked_team,
          isCorrect: p.is_correct,
          confidence: p.confidence,
        };
      }
    }
    return {
      userId: m.user_id,
      displayName,
      weekPoints: standing?.total_points ?? 0,
      weekCorrect: standing?.correct_picks ?? 0,
      rank: standing?.rank ?? null,
      isCurrentUser: m.user_id === user.id,
      picks: pickMap,
    };
  }).sort((a, b) => {
    if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
    if (a.rank !== null) return -1;
    if (b.rank !== null) return 1;
    return b.weekPoints - a.weekPoints;
  });

  // Consensus: most-picked team per game
  const consensus: Record<string, { team: string; count: number; total: number }> = {};
  for (const gameId of gameIds) {
    const gamePicks = (allPicks ?? []).filter((p) => p.game_id === gameId && p.picked_team);
    if (!gamePicks.length) continue;
    const counts: Record<string, number> = {};
    for (const p of gamePicks) counts[p.picked_team!] = (counts[p.picked_team!] ?? 0) + 1;
    const [topTeam, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    consensus[gameId] = { team: topTeam, count: topCount, total: gamePicks.length };
  }

  const hasGames = (games ?? []).length > 0;

  return (
    <WeeklyGrid
      leagueName={league.name}
      week={currentWeek}
      seasonYear={seasonYear}
      availableWeeks={availableWeeks}
      games={(games ?? []).map((g) => ({
        id: g.id,
        away: g.away_team,
        home: g.home_team,
        status: g.status ?? "pending",
        timeSlot: g.time_slot,
        kickoffTime: g.kickoff_time,
      }))}
      players={playerRows}
      consensus={consensus}
      currentUserId={user.id}
      hasGames={hasGames}
    />
  );
}
