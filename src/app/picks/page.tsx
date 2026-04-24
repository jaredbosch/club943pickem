import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PickSheet } from "@/components/pick-sheet/PickSheet";
import { transformGamesAndPicks } from "@/lib/picks/transform";
import { nflSeasonYear, nflWeek } from "@/lib/nfl/week";
import { week7Slots } from "@/components/pick-sheet/week7-data";

export default async function PicksPage({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: membership } = await supabase
    .from("league_members")
    .select("league_id, leagues(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/league");

  const leagueId = membership.league_id;
  const leagueName =
    (membership.leagues as unknown as { name: string } | null)?.name ??
    "My League";

  const now = new Date();
  const seasonYear = nflSeasonYear(now);

  // Find which weeks have games in the DB
  const { data: weekRows } = await supabase
    .from("games")
    .select("week")
    .eq("season_year", seasonYear)
    .order("week", { ascending: false });

  const availableWeeks = [...new Set((weekRows ?? []).map((r) => r.week))].sort(
    (a, b) => a - b,
  );

  const latestWeek = availableWeeks.at(-1) ?? null;
  const requestedWeek = searchParams.week ? parseInt(searchParams.week) : null;
  const currentWeek = requestedWeek ?? latestWeek ?? nflWeek(now);

  // Fetch games for this week
  const { data: games } = await supabase
    .from("games")
    .select(
      "id, home_team, away_team, spread_home, locked_spread_home, status, time_slot, kickoff_time",
    )
    .eq("season_year", seasonYear)
    .eq("week", currentWeek)
    .order("kickoff_time", { ascending: true });

  const gameIds = (games ?? []).map((g) => g.id);

  const { data: picks } = gameIds.length
    ? await supabase
        .from("picks")
        .select(
          "game_id, picked_team, confidence, is_locked, is_correct, points_earned",
        )
        .eq("user_id", user.id)
        .eq("league_id", leagueId)
        .in("game_id", gameIds)
    : { data: [] };

  const hasGames = (games ?? []).length > 0;
  // Fall back to sample week 7 data so the pick flow is testable off-season
  const slots = hasGames
    ? transformGamesAndPicks(games ?? [], picks ?? [])
    : week7Slots;

  return (
    <PickSheet
      slots={slots}
      week={hasGames ? currentWeek : 7}
      seasonYear={seasonYear}
      availableWeeks={hasGames ? availableWeeks : [7]}
      leagueId={leagueId}
      leagueName={leagueName}
      userId={user.id}
      hasGames={true}
      isSampleData={!hasGames}
    />
  );
}
