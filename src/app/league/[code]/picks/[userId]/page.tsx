import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerProfile } from "@/components/profile/PlayerProfile";

export default async function PlayerProfilePage({
  params,
}: {
  params: { code: string; userId: string };
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

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, email")
    .eq("id", params.userId)
    .maybeSingle();

  if (!profile) notFound();

  const displayName = profile.display_name ?? profile.email?.split("@")[0] ?? "Player";

  const { data: seasonRow } = await supabase
    .from("standings")
    .select("total_points, correct_picks, rank")
    .eq("user_id", params.userId)
    .eq("league_id", league.id)
    .eq("week", 0)
    .maybeSingle();

  const { data: weeklyRows } = await supabase
    .from("standings")
    .select("week, total_points, correct_picks, rank")
    .eq("user_id", params.userId)
    .eq("league_id", league.id)
    .gt("week", 0)
    .order("week", { ascending: true });

  const { data: leaderRow } = await supabase
    .from("standings")
    .select("total_points")
    .eq("league_id", league.id)
    .eq("week", 0)
    .order("rank", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { count: totalPlayers } = await supabase
    .from("league_members")
    .select("*", { count: "exact", head: true })
    .eq("league_id", league.id);

  const { data: allGames } = await supabase
    .from("games")
    .select("id, home_team, away_team, week, kickoff_time, status")
    .eq("season_year", league.season_year)
    .order("kickoff_time", { ascending: false });

  const gameMap = new Map((allGames ?? []).map((g) => [g.id, g]));

  const { data: allPicks } = await supabase
    .from("picks")
    .select("game_id, picked_team, confidence, is_correct, points_earned")
    .eq("user_id", params.userId)
    .eq("league_id", league.id);

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

  const teamStats = new Map<string, { wins: number; total: number }>();
  for (const p of allPicks ?? []) {
    if (!p.picked_team || p.is_correct === null) continue;
    const s = teamStats.get(p.picked_team) ?? { wins: 0, total: 0 };
    s.total++;
    if (p.is_correct) s.wins++;
    teamStats.set(p.picked_team, s);
  }

  const teamList = [...teamStats.entries()].map(([abbr, s]) => ({
    abbr, wins: s.wins, total: s.total, pct: s.total > 0 ? s.wins / s.total : 0,
  }));

  const mostTrusted = teamList.filter((t) => t.wins > 0).sort((a, b) => b.pct - a.pct || b.total - a.total).slice(0, 6);
  const blindSpots = teamList.filter((t) => t.total >= 2 && t.pct < 0.5).sort((a, b) => a.pct - b.pct || b.total - a.total).slice(0, 6);

  const gradedPicks = (allPicks ?? []).filter((p) => p.is_correct !== null);
  const correctCount = gradedPicks.filter((p) => p.is_correct).length;

  // Missed = final games where the user had no graded pick
  const finalGameCount = (allGames ?? []).filter((g) => (g as { status: string }).status === "final").length;
  const missedGames = Math.max(0, finalGameCount - gradedPicks.length);

  return (
    <PlayerProfile
      displayName={displayName}
      leagueName={league.name}
      leagueCode={leagueCode}
      seasonYear={league.season_year}
      seasonPoints={seasonRow?.total_points ?? 0}
      correctPicks={correctCount}
      totalGraded={gradedPicks.length}
      rank={seasonRow?.rank ?? null}
      totalPlayers={totalPlayers ?? 0}
      leaderPoints={leaderRow?.total_points ?? 0}
      weekStats={(weeklyRows ?? []).map((r) => ({
        week: r.week, correct: r.correct_picks, rank: r.rank, points: r.total_points,
      }))}
      recentPicks={recentPicks}
      mostTrusted={mostTrusted}
      blindSpots={blindSpots}
      missedGames={missedGames}
      isCurrentUser={params.userId === user.id}
    />
  );
}
