import type { Slot, Game, SlotStatus } from "@/components/pick-sheet/types";

export type DbGame = {
  id: string;
  home_team: string;
  away_team: string;
  spread_home: number | null;
  locked_spread_home: number | null;
  status: "scheduled" | "locked" | "in_progress" | "final";
  time_slot: string;
  kickoff_time: string;
  home_score?: number | null;
  away_score?: number | null;
  period?: number | null;
  display_clock?: string | null;
};

// "Q2 4:32" / "HALF" / "OT" — compact clock line for live games.
export function formatClock(period: number | null | undefined, clock: string | null | undefined): string | undefined {
  if (period == null) return undefined;
  if (period === 2 && (clock === "0:00" || !clock)) return "HALF";
  const q = period <= 4 ? `Q${period}` : period === 5 ? "OT" : `${period - 4}OT`;
  return clock ? `${q} ${clock}` : q;
}

export type DbPick = {
  game_id: string;
  picked_team: string | null;
  confidence: number | null;
  is_locked: boolean;
  is_correct: boolean | null;
  points_earned: number | null;
};

function formatSpread(value: number): string {
  if (value === 0) return "PK";
  return value > 0 ? `+${value.toFixed(1)}` : `${value.toFixed(1)}`;
}

function formatGameTime(iso: string): string {
  try {
    const d = new Date(iso);
    const day = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" }).toUpperCase();
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York", hour12: true });
    return `${day} ${time.replace(" AM", "A").replace(" PM", "P")}`;
  } catch {
    return "";
  }
}

const SLOT_NETWORK: Record<string, string> = {
  thursday: "TNF",
  intl: "NFL+",
  sunday_early: "CBS",
  sunday_late: "FOX",
  sunday_night: "NBC",
  monday: "ESPN",
};

const SLOT_PRIMETIME = new Set(["thursday", "sunday_night", "monday"]);

const SLOT_LABELS: Record<string, string> = {
  thursday: "thursday night",
  intl: "international",
  sunday_early: "sunday 1:00 PM ET",
  sunday_late: "sunday 4:05 PM ET",
  sunday_night: "sunday night",
  monday: "monday night",
};

const SLOT_ORDER = ["thursday", "intl", "sunday_early", "sunday_late", "sunday_night", "monday"];

// The ET weekday each slot normally holds. When a slot's actual games fall on
// a different day (preseason weeks, Black Friday, Saturday doubleheaders),
// the header derives from the real schedule instead of the canonical label.
const SLOT_EXPECTED_DAY: Record<string, string> = {
  thursday: "Thu",
  intl: "Sun",
  sunday_early: "Sun",
  sunday_late: "Sun",
  sunday_night: "Sun",
  monday: "Mon",
};

const DAY_LABELS: Record<string, string> = {
  Mon: "monday", Tue: "tuesday", Wed: "wednesday", Thu: "thursday",
  Fri: "friday", Sat: "saturday", Sun: "sunday",
};

const DAY_ORDER = ["Wed", "Thu", "Fri", "Sat", "Sun", "Mon", "Tue"];

function etWeekday(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" });
  } catch {
    return "";
  }
}

function slotLabelFor(slotId: string, games: DbGame[]): string {
  const canonical = SLOT_LABELS[slotId] ?? slotId;
  const days = [...new Set(games.map((g) => etWeekday(g.kickoff_time)).filter(Boolean))]
    .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));
  if (days.length === 0) return canonical;
  if (days.length === 1) {
    return days[0] === SLOT_EXPECTED_DAY[slotId] ? canonical : (DAY_LABELS[days[0]] ?? canonical);
  }
  const allExpected = days.every((d) => d === SLOT_EXPECTED_DAY[slotId]);
  if (allExpected) return canonical;
  return `${DAY_LABELS[days[0]]}–${DAY_LABELS[days[days.length - 1]]}`;
}

function slotStatus(games: DbGame[]): SlotStatus {
  if (games.some((g) => g.status === "in_progress")) return "live";
  if (games.some((g) => g.status !== "scheduled")) return "locked";
  return "open";
}

function slotStatusText(status: SlotStatus, games: DbGame[]): string {
  if (status === "live") return "live";
  if (status === "locked") {
    if (games.every((g) => g.status === "final")) return "final";
    return "locked";
  }
  return "open";
}

export function transformGamesAndPicks(games: DbGame[], picks: DbPick[]): Slot[] {
  const pickMap = new Map(picks.map((p) => [p.game_id, p]));

  const slotMap = new Map<string, DbGame[]>();
  for (const game of games) {
    if (!slotMap.has(game.time_slot)) slotMap.set(game.time_slot, []);
    slotMap.get(game.time_slot)!.push(game);
  }

  const slots: Slot[] = [];

  for (const [slotId, slotGames] of slotMap) {
    const status = slotStatus(slotGames);
    const statusText = slotStatusText(status, slotGames);

    const mappedGames: Game[] = slotGames.map((g) => {
      const p = pickMap.get(g.id);
      const spread = g.locked_spread_home ?? g.spread_home ?? 0;

      const hasScore = g.home_score != null && g.away_score != null;

      return {
        id: g.id,
        away: { abbr: g.away_team, record: "", spread: formatSpread(-spread) },
        home: { abbr: g.home_team, record: "", spread: formatSpread(spread) },
        confidence: p?.confidence ?? null,
        pickedTeam: p?.picked_team ?? undefined,
        result:
          p?.is_correct === true ? "correct"
          : p?.is_correct === false ? "incorrect"
          : undefined,
        pointsEarned: p?.points_earned ?? undefined,
        gameTime: g.kickoff_time ? formatGameTime(g.kickoff_time) : undefined,
        kickoffIso: g.kickoff_time || undefined,
        status: g.status,
        liveScore: hasScore && g.status !== "scheduled" && g.status !== "locked"
          ? `${g.away_score}–${g.home_score}`
          : undefined,
        clock: g.status === "in_progress" ? formatClock(g.period, g.display_clock) : undefined,
        network: SLOT_NETWORK[g.time_slot],
        isPrimetime: SLOT_PRIMETIME.has(g.time_slot),
      };
    });

    slots.push({
      id: slotId,
      label: slotLabelFor(slotId, slotGames),
      status,
      statusText,
      games: mappedGames,
    });
  }

  return slots.sort(
    (a, b) => SLOT_ORDER.indexOf(a.id) - SLOT_ORDER.indexOf(b.id),
  );
}
