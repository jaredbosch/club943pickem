import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PickSheet } from "@/components/pick-sheet/PickSheet";
import { transformGamesAndPicks } from "@/lib/picks/transform";
import { nflSeasonYear, nflWeek } from "@/lib/nfl/week";
import { week7Slots } from "@/components/pick-sheet/week7-data";

export default async function PicksPage({
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
    .select("id, name, invite_code")
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

  const now = new Date();
  const seasonYear = nflSeasonYear(now);

  const { data: weekRows } = await supabase
    .from("games")
    .select("week")
    .eq("season_year", seasonYear)
    .order("week", { ascending: false });

  const availableWeeks = [...new Set((weekRows ?? []).map((r) => r.week))].sort((a, b) => a - b);
  const latestWeek = availableWeeks.at(-1) ?? null;
  const requestedWeek = searchParams.week ? parseInt(searchParams.week) : null;
  const currentWeek = requestedWeek ?? latestWeek ?? nflWeek(now);

  const { data: games } = await supabase
    .from("games")
    .select("id, home_team, away_team, spread_home, locked_spread_home, status, time_slot, kickoff_time")
    .eq("season_year", seasonYear)
    .eq("week", currentWeek)
    .order("kickoff_time", { ascending: true });

  const gameIds = (games ?? []).map((g) => g.id);

  const { data: picks } = gameIds.length
    ? await supabase
        .from("picks")
        .select("game_id, picked_team, confidence, is_locked, is_correct, points_earned")
        .eq("user_id", user.id)
        .eq("league_id", league.id)
        .in("game_id", gameIds)
    : { data: [] };

  const hasGames = (games ?? []).length > 0;
  const slots = hasGames
    ? transformGamesAndPicks(games ?? [], picks ?? [])
    : week7Slots;

  const mnfGame = (games ?? []).find((g) => g.time_slot === "monday") ?? null;
  const { data: tiebreakerRow } = mnfGame
    ? await supabase
        .from("tiebreaker_guesses")
        .select("guess")
        .eq("user_id", user.id)
        .eq("league_id", league.id)
        .eq("week", currentWeek)
        .maybeSingle()
    : { data: null };

  return (
    <PickSheet
      slots={slots}
      week={hasGames ? currentWeek : 7}
      seasonYear={seasonYear}
      availableWeeks={hasGames ? availableWeeks : [7]}
      leagueId={league.id}
      leagueName={league.name}
      leagueCode={params.code.toUpperCase()}
      userId={user.id}
      hasGames={true}
      isSampleData={!hasGames}
      mnfGame={mnfGame ? {
        id: mnfGame.id,
        homeTeam: mnfGame.home_team,
        awayTeam: mnfGame.away_team,
        isLocked: mnfGame.status !== "scheduled",
      } : null}
      initialTiebreakerGuess={tiebreakerRow?.guess ?? null}
    />
  );
}
