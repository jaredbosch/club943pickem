import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerProfile } from "@/components/profile/PlayerProfile";

export default async function PlayerProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Get viewer's league
  const { data: membership } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, name, season_year)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/league");

  const leagueId = membership.league_id;
  const league = membership.leagues as unknown as { id: string; name: string; season_year: number };

  // Handle dummy placeholder users shown when no real standings exist yet
  const dummyNames: Record<string, string> = {
    "dummy-1": "Matty Ice",
    "dummy-2": "Big Ray",
    "dummy-3": "Kayla B",
    "dummy-4": "T-Bone",
    "dummy-5": "Sully",
  };
  if (params.userId.startsWith("dummy-")) {
    return (
      <PlayerProfile
        displayName={dummyNames[params.userId] ?? "Player"}
        leagueName={league.name}
        seasonYear={league.season_year}
        seasonPoints={0}
        correctPicks={0}
        totalGraded={0}
        rank={null}
        totalPlayers={0}
        leaderPoints={0}
        weekStats={[]}
        recentPicks={[]}
        mostTrusted={[]}
        blindSpots={[]}
        isCurrentUser={false}
      />
    );
  }

  // Subject user profile
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, email")
    .eq("id", params.userId)
    .maybeSingle();

  if (!profile) redirect("/dashboard");

  const displayName = profile.display_name ?? profile.email?.split("@")[0] ?? "Player";

  // Season totals (week = 0)
  const { data: seasonRow } = await supabase
    .from("standings")
    .select("total_points, correct_picks, rank")
    .eq("user_id", params.userId)
    .eq("league_id", leagueId)
    .eq("week", 0)
    .maybeSingle();

  // Weekly standings for the bar chart
  const { data: weeklyRows } = await supabase
    .from("standings")
    .select("week, total_points, correct_picks, rank")
    .eq("user_id", params.userId)
    .eq("league_id", leagueId)
    .gt("week", 0)
    .order("week", { ascending: true });

  // League leader's points (for gap-to-1st)
  const { data: leaderRow } = await supabase
    .from("standings")
    .select("total_points")
    .eq("league_id", leagueId)
    .eq("week", 0)
    .order("rank", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Total players in league
  const { count: totalPlayers } = await supabase
    .from("league_members")
    .select("*", { count: "exact", head: true })
    .eq("league_id", leagueId);

  // All games for the season (to enrich pick history)
  const { data: allGames } = await supabase
    .from("games")
    .select("id, home_team, away_team, week, kickoff_time")
    .eq("season_year", league.season_year)
    .order("kickoff_time", { ascending: false });

  const gameMap = new Map((allGames ?? []).map((g) => [g.id, g]));

  // All picks for this player in this league
  const { data: allPicks } = await supabase
    .from("picks")
    .select("game_id, picked_team, confidence, is_correct, points_earned")
    .eq("user_id", params.userId)
    .eq("league_id", leagueId);

  // Build pick history (most recent first, max 30)
  const recentPicks = (allPicks ?? [])
    .map((p) => {
      const game = gameMap.get(p.game_id);
      if (!game || !p.picked_team) return null;
      const opponent = p.picked_team === game.home_team ? game.away_team : game.home_team;
      return {
        week: game.week,
        kickoffTime: game.kickoff_time as string,
        pickedTeam: p.picked_team as string,
        opponent: opponent as string,
        confidence: p.confidence as number | null,
        result: (p.is_correct === null ? "pending" : p.is_correct ? "won" : "lost") as "won" | "lost" | "pending",
        pointsEarned: p.points_earned as number | null,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => new Date(b.kickoffTime).getTime() - new Date(a.kickoffTime).getTime())
    .slice(0, 30);

  // Team tendencies (only graded picks)
  const teamStats = new Map<string, { wins: number; total: number }>();
  for (const p of allPicks ?? []) {
    if (!p.picked_team || p.is_correct === null) continue;
    const s = teamStats.get(p.picked_team) ?? { wins: 0, total: 0 };
    s.total++;
    if (p.is_correct) s.wins++;
    teamStats.set(p.picked_team, s);
  }

  const teamList = [...teamStats.entries()].map(([abbr, s]) => ({
    abbr,
    wins: s.wins,
    total: s.total,
    pct: s.total > 0 ? s.wins / s.total : 0,
  }));

  const mostTrusted = teamList
    .filter((t) => t.wins > 0)
    .sort((a, b) => b.pct - a.pct || b.total - a.total)
    .slice(0, 6);

  const blindSpots = teamList
    .filter((t) => t.total >= 2 && t.pct < 0.5)
    .sort((a, b) => a.pct - b.pct || b.total - a.total)
    .slice(0, 6);

  const gradedPicks = (allPicks ?? []).filter((p) => p.is_correct !== null);
  const correctCount = gradedPicks.filter((p) => p.is_correct).length;

  return (
    <PlayerProfile
      displayName={displayName}
      leagueName={league.name}
      seasonYear={league.season_year}
      seasonPoints={seasonRow?.total_points ?? 0}
      correctPicks={correctCount}
      totalGraded={gradedPicks.length}
      rank={seasonRow?.rank ?? null}
      totalPlayers={totalPlayers ?? 0}
      leaderPoints={leaderRow?.total_points ?? 0}
      weekStats={(weeklyRows ?? []).map((r) => ({
        week: r.week,
        correct: r.correct_picks,
        rank: r.rank,
        points: r.total_points,
      }))}
      recentPicks={recentPicks}
      mostTrusted={mostTrusted}
      blindSpots={blindSpots}
      isCurrentUser={params.userId === user.id}
    />
  );
}
