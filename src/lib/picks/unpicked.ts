// Which games a player still owes picks on. Pure — shared by the nav badge
// (one player) and the commissioner "haven't picked" email audience (a whole
// league), so both agree on who is behind.

/** Picks RLS refuses writes within 5 minutes of kickoff (PickSheet LOCK_LEAD_MS). */
export const LOCK_LEAD_MS = 5 * 60_000;
const PICK5_MAX = 5;
const SUNDAY_SLOTS = new Set(["sunday_early", "sunday_late", "sunday_night"]);

export type WeekGame = {
  id: string;
  status: string;
  kickoff_time: string;
  time_slot: string | null;
};

export type Pick5LockMode = "thursday" | "sunday";

/** Still 'scheduled' and more than 5 minutes before kickoff — the same test PickSheet uses. */
export function isGameOpen(g: Pick<WeekGame, "status" | "kickoff_time">, nowMs: number): boolean {
  const kickoff = Date.parse(g.kickoff_time);
  return g.status === "scheduled" && (isNaN(kickoff) || kickoff - LOCK_LEAD_MS > nowMs);
}

/**
 * Number of picks a player still owes this week.
 *
 * Standard formats: open games without a pick. Pick 5: the weekly deadline
 * (mirrors public.pick_window_open()) locks the whole sheet; before it, the
 * picks still owed, capped by the games you could still take.
 */
export function countOpenUnpicked(args: {
  games: WeekGame[];
  pickedGameIds: Set<string>;
  pick5: boolean;
  lockMode: Pick5LockMode;
  nowMs: number;
}): number {
  const { games, pickedGameIds, pick5, lockMode, nowMs } = args;
  if (games.length === 0) return 0;

  const openUnpicked = games.filter((g) => isGameOpen(g, nowMs) && !pickedGameIds.has(g.id)).length;
  if (!pick5) return openUnpicked;

  const deadlines = games
    .filter((g) => (lockMode === "sunday" ? SUNDAY_SLOTS.has(g.time_slot ?? "") : g.time_slot === "thursday"))
    .map((g) => Date.parse(g.kickoff_time))
    .filter((t) => !isNaN(t));
  const deadlineMs = deadlines.length ? Math.min(...deadlines) : null;
  if (deadlineMs !== null && nowMs >= deadlineMs) return 0;

  const pickedThisWeek = games.filter((g) => pickedGameIds.has(g.id)).length;
  return Math.max(0, Math.min(PICK5_MAX - pickedThisWeek, openUnpicked));
}
