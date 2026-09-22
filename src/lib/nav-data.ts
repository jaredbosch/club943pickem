import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { nflWeek } from "@/lib/nfl/week";
import { isPick5Format, type ScoringType } from "@/lib/scoring";

/** Cookie the middleware sets on every /league/[code]/... request. */
export const LAST_LEAGUE_COOKIE = "tpp_last_league";

export type NavLeague = {
  code: string;
  name: string;
  season_year: number;
  is_commissioner: boolean;
};

export type NavData = {
  userId: string;
  displayName: string;
  /** Every league the user belongs to, most recently joined first. */
  leagues: NavLeague[];
  /** The league the tabs point at, or null when the user has no league. */
  current: NavLeague | null;
  /** Default mono eyebrow under the league chip, e.g. "WEEK 3 · CONFIDENCE". */
  contextLabel: string | null;
  /** Games in the current NFL week still open for picking without a pick. */
  unpickedCount: number;
};

type MembershipRow = {
  is_commissioner: boolean;
  joined_at: string;
  leagues: {
    id: string;
    name: string;
    invite_code: string;
    season_year: number;
    scoring_type: string | null;
    pick5_lock_mode: string | null;
  } | null;
};

// Picks RLS refuses writes within 5 minutes of kickoff (PickSheet LOCK_LEAD_MS).
const LOCK_LEAD_MS = 5 * 60_000;
const PICK5_MAX = 5;
const SUNDAY_SLOTS = new Set(["sunday_early", "sunday_late", "sunday_night"]);

function formatLabel(t: ScoringType): string {
  switch (t) {
    case "ats_confidence": return "CONFIDENCE";
    case "ats":            return "ATS";
    case "straight_up":    return "STRAIGHT UP";
    case "su_confidence":  return "SU CONFIDENCE";
    case "pick5_su":       return "PICK 5";
    case "pick5_ats":      return "PICK 5 ATS";
  }
}

const loadMemberships = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: memberships }, { data: profile }] = await Promise.all([
    supabase
      .from("league_members")
      .select("is_commissioner, joined_at, leagues(id, name, invite_code, season_year, scoring_type, pick5_lock_mode)")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false })
      .order("league_id", { ascending: true }),
    supabase.from("users").select("display_name").eq("id", user.id).maybeSingle(),
  ]);

  const rows = ((memberships ?? []) as unknown as MembershipRow[]).filter((m) => m.leagues);
  return {
    supabase,
    user,
    displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "Player",
    rows,
  };
});

function chooseCurrent(rows: MembershipRow[], leagueCode: string | null): MembershipRow | null {
  if (leagueCode) {
    const code = leagueCode.toUpperCase();
    const hit = rows.find((r) => r.leagues!.invite_code.toUpperCase() === code);
    if (hit) return hit;
  }
  const cookieCode = cookies().get(LAST_LEAGUE_COOKIE)?.value?.toUpperCase();
  if (cookieCode) {
    const hit = rows.find((r) => r.leagues!.invite_code.toUpperCase() === cookieCode);
    if (hit) return hit;
  }
  return rows[0] ?? null;
}

/**
 * The league a user was last active in: the `tpp_last_league` cookie when they
 * still belong to it, else their most recently joined league. Used by the
 * legacy /grid, /picks, /dashboard, /commissioner redirect stubs.
 */
export async function getLastLeague(): Promise<{ code: string; isCommissioner: boolean } | null | "signed-out"> {
  const base = await loadMemberships();
  if (!base) return "signed-out";
  const row = chooseCurrent(base.rows, null);
  if (!row) return null;
  return { code: row.leagues!.invite_code, isCommissioner: row.is_commissioner };
}

/**
 * Everything the nav needs, resolved on the server. `leagueCode` is the league
 * in the URL; pass null for pages outside /league/[code] (/home, /settings) to
 * use the user's last-active league. Deduplicated per request via React cache,
 * so a layout and its page can both call it.
 */
export const getNavData = cache(async (leagueCode: string | null): Promise<NavData | null> => {
  const base = await loadMemberships();
  if (!base) return null;
  const { supabase, user, displayName, rows } = base;

  const leagues: NavLeague[] = rows.map((r) => ({
    code: r.leagues!.invite_code,
    name: r.leagues!.name,
    season_year: r.leagues!.season_year,
    is_commissioner: r.is_commissioner,
  }));

  const currentRow = chooseCurrent(rows, leagueCode);
  if (!currentRow) {
    return { userId: user.id, displayName, leagues, current: null, contextLabel: null, unpickedCount: 0 };
  }

  const lg = currentRow.leagues!;
  const current = leagues.find((l) => l.code === lg.invite_code)!;
  const scoringType = (lg.scoring_type ?? "ats_confidence") as ScoringType;

  // Same active-week rule as the picks page.
  const now = new Date();
  const activeWeek = Math.max(1, Math.min(18, nflWeek(now, lg.season_year)));

  const unpickedCount = await countUnpicked({
    supabase,
    userId: user.id,
    leagueId: lg.id,
    seasonYear: lg.season_year,
    week: activeWeek,
    scoringType,
    lockMode: lg.pick5_lock_mode === "sunday" ? "sunday" : "thursday",
    nowMs: now.getTime(),
  });

  return {
    userId: user.id,
    displayName,
    leagues,
    current,
    contextLabel: `WEEK ${activeWeek} · ${formatLabel(scoringType)}`,
    unpickedCount,
  };
});

async function countUnpicked(args: {
  supabase: ReturnType<typeof createClient>;
  userId: string;
  leagueId: string;
  seasonYear: number;
  week: number;
  scoringType: ScoringType;
  lockMode: "thursday" | "sunday";
  nowMs: number;
}): Promise<number> {
  const { supabase, userId, leagueId, seasonYear, week, scoringType, lockMode, nowMs } = args;

  const { data: games } = await supabase
    .from("games")
    .select("id, status, kickoff_time, time_slot")
    .eq("season_year", seasonYear)
    .eq("week", week);
  if (!games || games.length === 0) return 0;

  const { data: picks } = await supabase
    .from("picks")
    .select("game_id, picked_team")
    .eq("user_id", userId)
    .eq("league_id", leagueId)
    .in("game_id", games.map((g) => g.id));
  const picked = new Set((picks ?? []).filter((p) => p.picked_team).map((p) => p.game_id));

  // Open = still 'scheduled' and more than 5 minutes before kickoff — the
  // same test PickSheet uses before it sends a write.
  const isOpen = (g: { status: string; kickoff_time: string }) => {
    const kickoff = Date.parse(g.kickoff_time);
    return g.status === "scheduled" && (isNaN(kickoff) || kickoff - LOCK_LEAD_MS > nowMs);
  };
  const openUnpicked = games.filter((g) => isOpen(g) && !picked.has(g.id)).length;

  if (!isPick5Format(scoringType)) return openUnpicked;

  // Pick 5: the weekly deadline (mirrors public.pick_window_open()) locks the
  // whole sheet; before it, the badge is the picks still owed, capped by the
  // games you could still take.
  const deadlines = games
    .filter((g) => (lockMode === "sunday" ? SUNDAY_SLOTS.has(g.time_slot) : g.time_slot === "thursday"))
    .map((g) => Date.parse(g.kickoff_time))
    .filter((t) => !isNaN(t));
  const deadlineMs = deadlines.length ? Math.min(...deadlines) : null;
  if (deadlineMs !== null && nowMs >= deadlineMs) return 0;
  return Math.max(0, Math.min(PICK5_MAX - picked.size, openUnpicked));
}
