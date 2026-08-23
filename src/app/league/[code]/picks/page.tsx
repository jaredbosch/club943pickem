import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PickSheet } from "@/components/pick-sheet/PickSheet";
import { Pick5Sheet } from "@/components/pick-sheet/Pick5Sheet";
import { transformGamesAndPicks } from "@/lib/picks/transform";
import { nflSeasonYear, nflWeek } from "@/lib/nfl/week";
import { type ScoringType, type Pick5LockMode, isPick5Format } from "@/lib/scoring";

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
    .select("id, name, season_year, invite_code, scoring_type, pick5_lock_mode, pick5_confidence")
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
  const parsedWeek = searchParams.week ? parseInt(searchParams.week, 10) : null;
  const requestedWeek = parsedWeek !== null && !isNaN(parsedWeek) ? parsedWeek : null;
  const currentWeek = requestedWeek ?? activeWeek;

  const { data: games } = await supabase
    .from("games")
    .select("id, home_team, away_team, spread_home, locked_spread_home, status, time_slot, kickoff_time, home_score, away_score, period, display_clock")
    .eq("season_year", seasonYear)
    .eq("week", currentWeek)
    .order("kickoff_time", { ascending: true });

  const gameIds = (games ?? []).map((g) => g.id);

  // Platform-wide pick percentages — every league, every user.
  //
  // Computed by public.get_game_consensus rather than counted here, so the web
  // Board and the iOS Board render the same number instead of two independent
  // implementations that can drift. The RPC is security definer, which is what
  // lets it aggregate past the picks RLS policy without needing a service-role
  // client on a user-facing page.
  const globalPickPcts = new Map<string, { awayPct: number; homePct: number; total: number }>();
  if (gameIds.length > 0) {
    const { data: consensus } = await supabase.rpc("get_game_consensus", {
      p_season_year: seasonYear,
      p_week: currentWeek,
    });
    for (const c of consensus ?? []) {
      globalPickPcts.set(c.game_id, {
        awayPct: c.away_pct,
        homePct: c.home_pct,
        total: c.total,
      });
    }
  }

  const { data: picks } = gameIds.length
    ? await supabase
        .from("picks")
        .select("game_id, picked_team, confidence, is_locked, is_correct, points_earned")
        .eq("user_id", user.id)
        .eq("league_id", league.id)
        .in("game_id", gameIds)
    : { data: [] };

  // Spread history for line movement display
  const { data: spreadHistory } = gameIds.length
    ? await supabase
        .from("spread_history")
        .select("game_id, spread_home, recorded_at")
        .in("game_id", gameIds)
        .order("recorded_at", { ascending: true })
    : { data: [] };

  // Build per-game history map: gameId → [{spread, date}]
  const spreadHistoryMap = new Map<string, { spread: number; date: string }[]>();
  for (const snap of spreadHistory ?? []) {
    if (!spreadHistoryMap.has(snap.game_id)) spreadHistoryMap.set(snap.game_id, []);
    spreadHistoryMap.get(snap.game_id)!.push({
      spread: Number(snap.spread_home),
      date: snap.recorded_at,
    });
  }

  const hasGames = (games ?? []).length > 0;
  const slots = transformGamesAndPicks(games ?? [], picks ?? []);

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
    week: currentWeek,
    seasonYear,
    availableWeeks,
    scoringType,
    activeWeek,
    globalPickPcts,
    spreadHistoryMap,
  };

  // Pick 5 formats get a dedicated pick sheet
  if (isPick5Format(scoringType)) {
    const lockMode = (league.pick5_lock_mode ?? "thursday") as Pick5LockMode;
    const confidenceEnabled = league.pick5_confidence ?? false;

    // Weekly deadline per lock mode; mirrors public.pick_window_open(). A week
    // without the deadline slot has no weekly deadline (per-game kickoff only).
    const sundaySlots = new Set(["sunday_early", "sunday_late", "sunday_night"]);
    const deadlineKickoffs = (games ?? [])
      .filter(g => lockMode === "sunday" ? sundaySlots.has(g.time_slot) : g.time_slot === "thursday")
      .map(g => new Date(g.kickoff_time).getTime());
    const deadlineMs = deadlineKickoffs.length ? Math.min(...deadlineKickoffs) : null;
    const isDeadlinePassed = deadlineMs !== null && now.getTime() >= deadlineMs;

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
          confidence: p.confidence,
          isCorrect: p.is_correct,
          pointsEarned: p.points_earned,
        }))}
        lockMode={lockMode}
        confidenceEnabled={confidenceEnabled}
        isDeadlinePassed={isDeadlinePassed}
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
      hasGames={hasGames}
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
