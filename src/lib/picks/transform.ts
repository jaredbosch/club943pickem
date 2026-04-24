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
};

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
        network: SLOT_NETWORK[g.time_slot],
        isPrimetime: SLOT_PRIMETIME.has(g.time_slot),
      };
    });

    slots.push({
      id: slotId,
      label: SLOT_LABELS[slotId] ?? slotId,
      status,
      statusText,
      games: mappedGames,
    });
  }

  return slots.sort(
    (a, b) => SLOT_ORDER.indexOf(a.id) - SLOT_ORDER.indexOf(b.id),
  );
}
