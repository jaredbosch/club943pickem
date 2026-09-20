"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatClock } from "@/lib/picks/transform";
import type { LiveGamePayload } from "@/app/api/games/live/route";

export type LiveScoreGame = {
  id: string;
  status: string;
  kickoffTime: string;
  updatedAt?: string | null;
  home: string;
  away: string;
  awayScore?: number | null;
  homeScore?: number | null;
  clock?: string;
  atsWinner?: string | null;
  homeSpread?: number | null;
};

const POLL_MS = 60_000;
const KICKOFF_LOOKAHEAD_MS = 30 * 60_000;

// A week needs polling while any game could still change: live, kicked off
// but not yet flipped by ESPN, or kicking off within the next half hour.
function shouldPoll(games: LiveScoreGame[], now: number): boolean {
  return games.some((g) => {
    if (g.status === "in_progress" || g.status === "locked") return true;
    if (g.status === "scheduled") {
      const kickoff = new Date(g.kickoffTime).getTime();
      return kickoff <= now + KICKOFF_LOOKAHEAD_MS;
    }
    return false;
  });
}

function atsWinner(g: LiveScoreGame, isAts: boolean): string | null {
  if (g.homeScore == null || g.awayScore == null) return null;
  const margin = g.homeScore - g.awayScore + (isAts ? Number(g.homeSpread ?? 0) : 0);
  return margin > 0 ? g.home : margin < 0 ? g.away : null;
}

/**
 * Overlays live scores from the CDN-cached /api/games/live feed onto the
 * server-rendered games. Polls once a minute only while something can change,
 * pauses in background tabs, and triggers a single full server refresh when a
 * game goes final so graded picks and standings catch up.
 */
export function useLiveScores<T extends LiveScoreGame>(
  serverGames: T[],
  seasonYear: number,
  week: number,
  isAts: boolean,
): { games: T[]; isPolling: boolean } {
  const router = useRouter();
  const [live, setLive] = useState<Record<string, LiveGamePayload>>({});
  const isPolling = shouldPoll(serverGames, Date.now());

  // Fresh server props supersede any overlay we accumulated.
  useEffect(() => {
    setLive({});
  }, [serverGames]);

  // Statuses we have already shown, so a final flip triggers exactly one refresh.
  const seenStatus = useRef<Record<string, string>>({});
  useEffect(() => {
    const next: Record<string, string> = {};
    for (const g of serverGames) next[g.id] = g.status;
    seenStatus.current = next;
  }, [serverGames]);

  useEffect(() => {
    if (!isPolling) return;
    let cancelled = false;

    async function poll() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/games/live?season=${seasonYear}&week=${week}`);
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as { games: LiveGamePayload[] };
        const byId: Record<string, LiveGamePayload> = {};
        let wentFinal = false;
        for (const g of body.games) {
          byId[g.id] = g;
          const prev = seenStatus.current[g.id];
          if (prev && prev !== "final" && g.status === "final") wentFinal = true;
          seenStatus.current[g.id] = g.status;
        }
        if (cancelled) return;
        setLive(byId);
        // Picks get graded and standings rebuilt server-side when a game goes
        // final — that data only lives in the full render, so pull it once.
        if (wentFinal) router.refresh();
      } catch {
        // transient — next tick retries
      }
    }

    const id = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isPolling, seasonYear, week, router]);

  const games = useMemo(() => {
    return serverGames.map((g) => {
      const l = live[g.id];
      if (!l) return g;
      // A CDN-cached payload can be older than the server render; never regress.
      if (g.updatedAt && l.updatedAt <= g.updatedAt) return g;
      const merged: T = {
        ...g,
        status: l.status,
        awayScore: l.awayScore,
        homeScore: l.homeScore,
        clock: l.status === "in_progress" ? formatClock(l.period, l.displayClock) : undefined,
      };
      if (l.status === "final") merged.atsWinner = atsWinner(merged, isAts);
      return merged;
    });
  }, [serverGames, live, isAts]);

  return { games, isPolling };
}
