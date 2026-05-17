import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PickSheet } from "@/components/pick-sheet/PickSheet";
import { Pick5Sheet } from "@/components/pick-sheet/Pick5Sheet";
import { transformGamesAndPicks } from "@/lib/picks/transform";
import { nflSeasonYear, nflWeek } from "@/lib/nfl/week";
import { week7Slots } from "@/components/pick-sheet/week7-data";
import { type ScoringType, isPick5Format } from "@/lib/scoring";

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
    .select("id, name, season_year, invite_code, scoring_type")
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
  const seasonYear = league.season_year;
  // Active week: the current NFL week (clamped to ≥1 so off-season = week 1)
  const activeWeek = Math.max(1, Math.min(18, nflWeek(now, seasonYear)));

  const { data: weekRows } = await supabase
    .from("games")
    .select("week")
    .eq("season_year", seasonYear)
    .order("week", { ascending: false });

  const availableWeeks = [...new Set((weekRows ?? []).map((r) => r.week))].sort((a, b) => a - b);
  const requestedWeek = searchParams.week ? parseInt(searchParams.week) : null;
  const currentWeek = requestedWeek ?? activeWeek;

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

  const scoringType = (league.scoring_type ?? "ats_confidence") as ScoringType;
  const leagueCode = params.code.toUpperCase();
  const sharedProps = {
    leagueId: league.id,
    leagueName: league.name,
    leagueCode,
    userId: user.id,
    week: hasGames ? currentWeek : 7,
    seasonYear,
    availableWeeks: hasGames ? availableWeeks : [7],
    scoringType,
    activeWeek,
  };

  // Pick 5 formats get a dedicated pick sheet
  if (isPick5Format(scoringType)) {
    const thursdayGame = (games ?? []).find(g => g.time_slot === "thursday") ?? null;
    const isThursdayLocked = thursdayGame ? new Date(thursdayGame.kickoff_time) <= now : false;

    return (
      <Pick5Sheet
        key={currentWeek}
        {...sharedProps}
        games={(games ?? []).map(g => ({
          id: g.id,
          homeTeam: g.home_team,
          awayTeam: g.away_team,
          spreadHome: g.spread_home,
          timeSlot: g.time_slot,
          kickoffTime: g.kickoff_time,
          status: g.status,
        }))}
        existingPicks={(picks ?? []).map(p => ({
          gameId: p.game_id,
          pickedTeam: p.picked_team,
          isCorrect: p.is_correct,
          pointsEarned: p.points_earned,
        }))}
        isThursdayLocked={isThursdayLocked}
        hasGames={hasGames}
      />
    );
  }

  // Standard formats
  return (
    <PickSheet
      key={currentWeek}
      {...sharedProps}
      slots={slots}
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
