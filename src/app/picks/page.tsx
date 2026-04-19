import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PickSheet } from "@/components/pick-sheet/PickSheet";
import { SLOT_LABELS, SLOT_ORDER, LOCK_LEAD_MS } from "@/lib/slots";
import { formatCountdown, formatSpread } from "@/lib/format";
import { nflWeekFor } from "@/lib/nfl-week";
import type { Slot, Game as UiGame, SlotStatus } from "@/components/pick-sheet/types";
import type { GameRow, PickRow, LeagueRow, MnfTiebreakerRow } from "@/lib/db-types";

export const dynamic = "force-dynamic";

type SearchParams = { league?: string; week?: string };

export default async function PicksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const userId = await requireUserId("/picks");
  const supabase = createAdminClient();

  let leagueId = searchParams.league;
  if (!leagueId) {
    // Route to first membership, or /leagues if none.
    const { data: first } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!first) redirect("/leagues");
    leagueId = first.league_id as string;
  }

  // Confirm league + membership.
  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, season_year, status")
    .eq("id", leagueId)
    .maybeSingle<Pick<LeagueRow, "id" | "name" | "season_year" | "status">>();
  if (!league) redirect("/leagues");

  const { data: membership } = await supabase
    .from("league_members")
    .select("is_paid, is_commissioner")
    .eq("league_id", league.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!membership) redirect("/leagues");

  const { week: autoWeek } = nflWeekFor(new Date());
  const week = searchParams.week ? parseInt(searchParams.week, 10) : autoWeek;

  // Games for this week.
  const { data: games } = await supabase
    .from("games")
    .select(
      "id, external_id, week, season_year, home_team, away_team, kickoff_time, time_slot, spread_home, locked_spread_home, home_score, away_score, status, created_at, updated_at",
    )
    .eq("season_year", league.season_year)
    .eq("week", week)
    .order("kickoff_time", { ascending: true });

  const gameRows = (games ?? []) as GameRow[];

  // This user's picks for the week (this league).
  const { data: picks } = await supabase
    .from("picks")
    .select(
      "id, user_id, league_id, game_id, week, picked_team, confidence, is_locked, is_correct, points_earned, created_at, updated_at",
    )
    .eq("user_id", userId)
    .eq("league_id", league.id)
    .eq("week", week);
  const pickByGame = new Map(
    ((picks ?? []) as PickRow[]).map((p) => [p.game_id, p]),
  );

  // MNF tiebreaker.
  const { data: tb } = await supabase
    .from("mnf_tiebreakers")
    .select("id, user_id, league_id, week, predicted_total, actual_total, difference, is_locked, created_at, updated_at")
    .eq("user_id", userId)
    .eq("league_id", league.id)
    .eq("week", week)
    .maybeSingle<MnfTiebreakerRow>();

  // Weekly total so far.
  const { data: weeklyStanding } = await supabase
    .from("standings")
    .select("total_points, rank")
    .eq("user_id", userId)
    .eq("league_id", league.id)
    .eq("week", week)
    .maybeSingle();
  const { data: seasonStanding } = await supabase
    .from("standings")
    .select("rank")
    .eq("user_id", userId)
    .eq("league_id", league.id)
    .eq("week", 0)
    .maybeSingle();

  const slots = buildSlots({ games: gameRows, pickByGame, now: Date.now() });
  const totalGames = gameRows.length;
  const maxPossible = totalGames > 0 ? (totalGames * (totalGames + 1)) / 2 : 0;
  const pointsSoFar = weeklyStanding?.total_points ?? 0;

  const mnfGame = gameRows.find((g) => g.time_slot === "monday");
  const mnfLocked = tb?.is_locked ?? mnfGame?.status !== "scheduled";

  return (
    <PickSheetShell
      leagueId={league.id}
      leagueName={league.name}
      week={week}
      isPaid={membership.is_paid}
      isCommissioner={membership.is_commissioner}
      initialSlots={slots}
      initialTiebreaker={tb?.predicted_total ?? 0}
      tiebreakerLocked={mnfLocked}
      pointsSoFar={pointsSoFar}
      maxPossible={maxPossible}
      seasonRank={seasonStanding?.rank ?? null}
      totalGames={totalGames}
    />
  );
}

function buildSlots({
  games,
  pickByGame,
  now,
}: {
  games: GameRow[];
  pickByGame: Map<string, PickRow>;
  now: number;
}): Slot[] {
  const bySlot = new Map<string, GameRow[]>();
  for (const g of games) {
    const arr = bySlot.get(g.time_slot) ?? [];
    arr.push(g);
    bySlot.set(g.time_slot, arr);
  }

  const slots: Slot[] = [];
  for (const slot of SLOT_ORDER) {
    const slotGames = bySlot.get(slot);
    if (!slotGames || slotGames.length === 0) continue;
    slotGames.sort((a, b) => a.kickoff_time.localeCompare(b.kickoff_time));
    const earliest = Date.parse(slotGames[0].kickoff_time);

    let status: SlotStatus;
    let statusText: string;
    let countdown: string | undefined;
    const anyInProgress = slotGames.some((g) => g.status === "in_progress");
    const allFinal = slotGames.every((g) => g.status === "final");
    const locked = slotGames[0].status === "locked" || anyInProgress || allFinal;

    if (allFinal) {
      status = "locked";
      statusText = "locked";
    } else if (anyInProgress) {
      status = "live";
      statusText = "live";
    } else if (locked) {
      status = "locked";
      statusText = "locked";
    } else {
      status = "open";
      statusText = "open";
      countdown = formatCountdown(earliest, now);
    }

    const uiGames: UiGame[] = slotGames.map((g) => {
      const pick = pickByGame.get(g.id);
      const confidence = pick?.confidence ?? 0;
      const result =
        pick?.is_correct === true
          ? "correct"
          : pick?.is_correct === false
            ? "incorrect"
            : undefined;
      const displaySpread = g.locked_spread_home ?? g.spread_home;
      return {
        id: g.id,
        away: {
          abbr: g.away_team,
          record: "",
          spread: formatSpread(displaySpread, "away"),
        },
        home: {
          abbr: g.home_team,
          record: "",
          spread: formatSpread(displaySpread, "home"),
        },
        confidence,
        pickedTeam: pick?.picked_team,
        result,
        pointsEarned: pick?.points_earned,
        liveScore:
          g.home_score !== null && g.away_score !== null
            ? `${g.away_score}-${g.home_score}`
            : undefined,
      };
    });

    slots.push({
      id: slot,
      label: SLOT_LABELS[slot],
      status,
      statusText,
      countdown,
      games: uiGames,
    });
  }
  return slots;
}

function PickSheetShell(props: React.ComponentProps<typeof PickSheet>) {
  return (
    <div>
      <PickSheet {...props} />
      <div className="ps-foot-links">
        <Link href="/leagues">← leagues</Link>
        {props.isCommissioner && (
          <Link href={`/admin/${props.leagueId}`}>commissioner panel →</Link>
        )}
      </div>
    </div>
  );
}
