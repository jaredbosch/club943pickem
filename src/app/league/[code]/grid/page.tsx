import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WeeklyGrid } from "@/components/grid/WeeklyGrid";
import { nflSeasonYear } from "@/lib/nfl/week";
import { sampleGames, samplePlayers } from "@/components/grid/week7-grid-data";

export default async function GridPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { week?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, season_year, invite_code")
    .eq("invite_code", params.code.toUpperCase())
    .maybeSingle();

  if (!league) notFound();

  const { data: membership } = await supabase
    .from("league_members")
    .select("is_paid")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/league");

  const leagueCode = params.code.toUpperCase();
  const now = new Date();
  const seasonYear = league.season_year;

  const { data: weekRows } = await supabase
    .from("games")
    .select("week")
    .eq("season_year", seasonYear)
    .order("week", { ascending: false });

  const availableWeeks = [...new Set((weekRows ?? []).map((r) => r.week))].sort((a, b) => a - b);
  const latestWeek = availableWeeks.at(-1) ?? null;
  const requestedWeek = searchParams.week ? parseInt(searchParams.week) : null;
  const currentWeek = requestedWeek ?? latestWeek ?? 7;

  const { data: games } = await supabase
    .from("games")
    .select("id, home_team, away_team, status, time_slot, kickoff_time, home_score, away_score, home_spread")
    .eq("season_year", seasonYear)
    .eq("week", currentWeek)
    .order("kickoff_time", { ascending: true });

  const gameIds = (games ?? []).map((g) => g.id);

  const { data: allPicks } = gameIds.length
    ? await supabase
        .from("picks")
        .select("user_id, game_id, picked_team, is_correct, points_earned, confidence")
        .eq("league_id", league.id)
        .in("game_id", gameIds)
    : { data: [] };

  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, users(display_name, email)")
    .eq("league_id", league.id);

  const { data: weekStandings } = await supabase
    .from("standings")
    .select("user_id, total_points, correct_picks, rank")
    .eq("league_id", league.id)
    .eq("week", currentWeek);

  const standingsMap = new Map((weekStandings ?? []).map((s) => [s.user_id, s]));

  const playerRows = (members ?? []).map((m) => {
    const u = m.users as unknown as { display_name: string | null; email: string } | null;
    const displayName = u?.display_name ?? u?.email?.split("@")[0] ?? "Player";
    const standing = standingsMap.get(m.user_id);
    const playerPicks = (allPicks ?? []).filter((p) => p.user_id === m.user_id);
    const pickMap: Record<string, { pickedTeam: string; isCorrect: boolean | null; confidence: number | null }> = {};
    for (const p of playerPicks) {
      if (p.picked_team) pickMap[p.game_id] = { pickedTeam: p.picked_team, isCorrect: p.is_correct, confidence: p.confidence };
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

  const consensus: Record<string, { team: string; count: number; total: number }> = {};
  const atsWinnerMap: Record<string, string | null> = {};
  for (const gameId of gameIds) {
    const gamePicks = (allPicks ?? []).filter((p) => p.game_id === gameId && p.picked_team);
    if (!gamePicks.length) continue;
    const counts: Record<string, number> = {};
    for (const p of gamePicks) counts[p.picked_team!] = (counts[p.picked_team!] ?? 0) + 1;
    const [topTeam, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    consensus[gameId] = { team: topTeam, count: topCount, total: gamePicks.length };
    const winningPick = gamePicks.find((p) => p.is_correct === true);
    atsWinnerMap[gameId] = winningPick?.picked_team ?? null;
  }

  const hasGames = (games ?? []).length > 0;

  if (!hasGames) {
    const sampleConsensus: Record<string, { team: string; count: number; total: number }> = {};
    for (const g of sampleGames) {
      const counts: Record<string, number> = {};
      for (const p of samplePlayers) {
        const pick = p.picks[g.id];
        if (pick) counts[pick.pickedTeam] = (counts[pick.pickedTeam] ?? 0) + 1;
      }
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (entries.length) sampleConsensus[g.id] = { team: entries[0][0], count: entries[0][1], total: samplePlayers.length };
    }
    return (
      <WeeklyGrid
        leagueName={league.name}
        leagueCode={leagueCode}
        week={7}
        seasonYear={seasonYear}
        availableWeeks={[7]}
        games={sampleGames}
        players={samplePlayers.map((p, i) => ({ ...p, isCurrentUser: i === 0, userId: i === 0 ? user.id : p.userId }))}
        consensus={sampleConsensus}
        currentUserId={user.id}
        hasGames={true}
        isSampleData={true}
      />
    );
  }

  return (
    <WeeklyGrid
      leagueName={league.name}
      leagueCode={leagueCode}
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
        awayScore: (g as Record<string, unknown>).away_score as number | null ?? null,
        homeScore: (g as Record<string, unknown>).home_score as number | null ?? null,
        atsWinner: atsWinnerMap[g.id] ?? null,
        homeSpread: (g as Record<string, unknown>).home_spread as number | null ?? null,
      }))}
      players={playerRows}
      consensus={consensus}
      currentUserId={user.id}
      hasGames={hasGames}
    />
  );
}
