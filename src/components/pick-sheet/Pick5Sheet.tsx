"use client";
import { AppHeader } from "@/components/nav/AppHeader";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NFL_COLORS } from "@/lib/nfl-colors";
import type { ScoringType, Pick5LockMode } from "@/lib/scoring";
import { isAtsFormat, isPick5Push } from "@/lib/scoring";

type Game = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  spreadHome: number | null;
  timeSlot: string;
  kickoffTime: string;
  status: string;
};

type ExistingPick = {
  gameId: string;
  pickedTeam: string | null;
  confidence: number | null;
  isCorrect: boolean | null;
  pointsEarned: number | null;
};

type Props = {
  leagueId: string;
  leagueName: string;
  leagueCode: string;
  userId: string;
  week: number;
  seasonYear: number;
  availableWeeks: number[];
  scoringType: ScoringType;
  activeWeek: number;
  games: Game[];
  existingPicks: ExistingPick[];
  lockMode: Pick5LockMode;
  confidenceEnabled: boolean;
  isDeadlinePassed: boolean;
  hasGames: boolean;
};

const MAX_PICKS = 5;

function formatSpread(spreadHome: number | null, team: "home" | "away"): string {
  if (spreadHome == null) return "";
  const line = team === "home" ? spreadHome : -spreadHome;
  if (line === 0) return "PK";
  return line > 0 ? `+${line}` : `${line}`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const day = d.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/New_York" }).toUpperCase();
    const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York", hour12: true });
    return `${day} ${time.replace(" AM", "A").replace(" PM", "P")}`;
  } catch { return ""; }
}

function formatPts(n: number): string {
  return n === 0.5 ? "½" : `${n}`;
}

function teamColor(abbr: string): string {
  return (NFL_COLORS as Record<string, { primary: string }>)[abbr]?.primary ?? "#333";
}

function teamGradient(abbr: string): string {
  const c = teamColor(abbr);
  return `linear-gradient(145deg, ${c}, color-mix(in oklab, ${c} 70%, #000))`;
}

export function Pick5Sheet({
  leagueId, leagueName, leagueCode, userId, week, seasonYear,
  availableWeeks, scoringType, activeWeek, games, existingPicks,
  lockMode, confidenceEnabled, isDeadlinePassed, hasGames,
}: Props) {
  const supabase = createClient();
  const router = useRouter();
  const showSpread = isAtsFormat(scoringType);
  const isFutureWeek = week > activeWeek;
  const isLocked = isDeadlinePassed || isFutureWeek;

  // Sunday mode: games kicking off before the weekly deadline lock at their
  // own kickoff. Ticks so a game locks on schedule without a reload.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const gameLocked = useCallback((g: Game) => {
    if (lockMode !== "sunday") return false;
    const kickoff = new Date(g.kickoffTime).getTime();
    return !isNaN(kickoff) && nowMs >= kickoff;
  }, [lockMode, nowMs]);

  // picks: gameId → pickedTeam
  const [picks, setPicks] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>();
    for (const p of existingPicks) {
      if (p.pickedTeam) m.set(p.gameId, p.pickedTeam);
    }
    return m;
  });

  // ranks: gameId → confidence 1–5 (only used when confidenceEnabled)
  const [ranks, setRanks] = useState<Map<string, number>>(() => {
    const m = new Map<string, number>();
    for (const p of existingPicks) {
      if (p.pickedTeam && p.confidence != null) m.set(p.gameId, p.confidence);
    }
    return m;
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Game ids the user has edited in this session — these win over server data
  // when a router refresh delivers fresh props mid-edit.
  const touchedRef = useRef<Set<string>>(new Set());

  // The Next 14 client router cache can replay a stale RSC payload when the
  // user navigates back to this page, making saved picks look like they were
  // lost. Refetch server data on mount and whenever the tab becomes visible.
  useEffect(() => {
    router.refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fold refreshed server picks into local state, keeping this session's edits
  useEffect(() => {
    setPicks((prev) => {
      const next = new Map<string, string>();
      for (const p of existingPicks) {
        if (p.pickedTeam) next.set(p.gameId, p.pickedTeam);
      }
      for (const id of touchedRef.current) {
        const t = prev.get(id);
        if (t) next.set(id, t);
        else next.delete(id);
      }
      return next;
    });
    setRanks((prev) => {
      const next = new Map<string, number>();
      for (const p of existingPicks) {
        if (p.pickedTeam && p.confidence != null) next.set(p.gameId, p.confidence);
      }
      for (const id of touchedRef.current) {
        const r = prev.get(id);
        if (r != null) next.set(id, r);
        else next.delete(id);
      }
      return next;
    });
  }, [existingPicks]);

  const pickCount = picks.size;
  const atLimit = pickCount >= MAX_PICKS;
  const unrankedCount = confidenceEnabled
    ? [...picks.keys()].filter(id => !ranks.has(id)).length
    : 0;

  const nextFreeRank = useCallback((current: Map<string, number>): number | null => {
    const used = new Set(current.values());
    for (let n = 1; n <= MAX_PICKS; n++) if (!used.has(n)) return n;
    return null;
  }, []);

  const pickTeam = useCallback(async (gameId: string, team: string) => {
    if (isLocked) return;
    const game = games.find(g => g.id === gameId);
    if (game && gameLocked(game)) return;

    // Compute the new picked team before touching state
    const current = picks.get(gameId) ?? null;
    let newPick: string | null;

    if (current === team) {
      newPick = null; // deselect
    } else if (picks.has(gameId) || picks.size < MAX_PICKS) {
      newPick = team; // pick this side (change or new)
    } else {
      return; // at limit, game not yet selected — do nothing
    }

    // Auto-assign the lowest free rank on a brand-new pick; a deselect frees it
    const isNewPick = newPick !== null && !picks.has(gameId);
    let confidence: number | null = confidenceEnabled ? (ranks.get(gameId) ?? null) : null;
    if (confidenceEnabled && isNewPick) confidence = nextFreeRank(ranks);

    // Update UI state
    touchedRef.current.add(gameId);
    setPicks(prev => {
      const next = new Map(prev);
      if (newPick === null) next.delete(gameId);
      else next.set(gameId, newPick!);
      return next;
    });
    if (confidenceEnabled) {
      setRanks(prev => {
        const next = new Map(prev);
        if (newPick === null) next.delete(gameId);
        else if (confidence != null) next.set(gameId, confidence);
        return next;
      });
    }

    // Persist to DB immediately
    if (newPick) {
      const { error } = await supabase.from("picks").upsert(
        { user_id: userId, league_id: leagueId, game_id: gameId, week, picked_team: newPick, confidence, is_locked: false },
        { onConflict: "user_id,league_id,game_id" }
      );
      if (error) setSaveError(error.message);
    } else {
      const { error } = await supabase.from("picks").delete()
        .eq("user_id", userId).eq("league_id", leagueId).eq("game_id", gameId);
      if (error) setSaveError(error.message);
    }
  }, [isLocked, picks, ranks, games, gameLocked, confidenceEnabled, nextFreeRank, leagueId, userId, week, supabase]);

  // Assign a 1–5 rank to a picked game. The set_pick_confidence RPC releases
  // the rank from whichever pick held it, so the local map mirrors that: the
  // old holder goes unranked and needs a new number. Tapping the current rank
  // clears it.
  const assignRank = useCallback(async (gameId: string, n: number) => {
    if (isLocked || !confidenceEnabled || !picks.has(gameId)) return;
    const game = games.find(g => g.id === gameId);
    if (game && gameLocked(game)) return;

    const clearing = ranks.get(gameId) === n;
    const value = clearing ? null : n;

    touchedRef.current.add(gameId);
    if (value !== null) {
      // The previous holder of this rank goes unranked — remember that edit too
      for (const [gid, r] of ranks) if (r === value && gid !== gameId) touchedRef.current.add(gid);
    }
    setRanks(prev => {
      const next = new Map(prev);
      if (value === null) {
        next.delete(gameId);
      } else {
        for (const [gid, r] of next) if (r === value && gid !== gameId) next.delete(gid);
        next.set(gameId, value);
      }
      return next;
    });

    const { error } = await supabase.rpc("set_pick_confidence", {
      p_league_id: leagueId, p_game_id: gameId, p_value: value,
    });
    if (error) setSaveError(error.message);
  }, [isLocked, confidenceEnabled, picks, ranks, games, gameLocked, leagueId, supabase]);

  async function saveAllPicks() {
    setSaving(true);
    setSaveError(null);
    const rows = [...picks.entries()].map(([gameId, pickedTeam]) => ({
      user_id: userId, league_id: leagueId, game_id: gameId,
      week, picked_team: pickedTeam,
      confidence: confidenceEnabled ? (ranks.get(gameId) ?? null) : null,
      is_locked: false,
    }));
    if (rows.length > 0) {
      const { error } = await supabase.from("picks")
        .upsert(rows, { onConflict: "user_id,league_id,game_id" });
      if (error) { setSaveError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const scoringNote = confidenceEnabled
    ? "win = your rank · push = half your rank"
    : "1pt win · ½pt push · 0pt loss";

  return (
    <div className="ps-shell pp-gridbg">
      <div className="ps-container" style={{ maxWidth: 760 }}>

        {/* Sticky header */}
        <div className="ps-sticky-header">
          <AppHeader
            leagueCode={leagueCode}
            leagueName={leagueName}
            contextLabel={`WEEK ${week}`}
            extra={saveError && <span className="ps-save-error" title={saveError}>⚠ Save failed</span>}
          />

          {/* Pick counter bar */}
          <div className="p5-count-bar">
            <div className="p5-count-pips">
              {Array.from({ length: MAX_PICKS }, (_, i) => (
                <div key={i} className={`p5-pip${i < pickCount ? " filled" : ""}`} />
              ))}
            </div>
            <span className="p5-count-label">
              {pickCount}/{MAX_PICKS} picks
              {atLimit && !isLocked && <span className="p5-count-full"> · tap a team to change</span>}
            </span>
          </div>
        </div>

        {/* Hero */}
        <div className="ps-hero pp-hero-grad">
          <div>
            <div className="ps-hero-week">
              WEEK {week} · {seasonYear} · {isFutureWeek ? "SCHEDULE" : `PICK ${MAX_PICKS}${showSpread ? " ATS" : ""}`}
            </div>
            <div className="ps-hero-title">
              {isFutureWeek ? "COMING SOON" : "LOCK IT IN"}
            </div>
            <div className="ps-hero-sub">
              {leagueName}
              {isDeadlinePassed && <span style={{ color: "var(--bad)", marginLeft: 8 }}>· Locked</span>}
            </div>
          </div>
          <div className="ps-hero-right" style={{ minWidth: 0 }}>
            <div className="ps-week-nav">
              {availableWeeks.map(w => (
                <Link
                  key={w}
                  href={`/league/${leagueCode}/picks?week=${w}`}
                  className={`ps-week-btn${w === week ? " active" : ""}`}
                >
                  {w}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Lock notice */}
        {!isLocked && !isFutureWeek && (
          <div className="p5-lock-notice">
            {lockMode === "sunday"
              ? `⏰ Picks lock at Sunday's first kickoff · earlier games lock at their own kickoff · ${scoringNote}`
              : `⏰ All picks lock Thursday at kickoff · ${scoringNote}`}
          </div>
        )}
        {isFutureWeek && (
          <div className="ps-future-banner">
            Schedule for Week {week} — game lines go live the Monday before the games, and picks open with them.
          </div>
        )}
        {isDeadlinePassed && !isFutureWeek && (
          <div className="ps-future-banner">
            {lockMode === "sunday"
              ? "Picks are locked — the first Sunday game has kicked off."
              : "Picks are locked — the Thursday night game has kicked off."}
          </div>
        )}

        {/* All games — pick directly */}
        <div className="ps-pick-list">
          {!isLocked && !isFutureWeek && (
            <div className="p5-select-hint">
              {atLimit
                ? confidenceEnabled && unrankedCount > 0
                  ? `Rank your picks 1–${MAX_PICKS} — ${unrankedCount} unranked`
                  : `${MAX_PICKS} picks locked in — tap any pick to change sides or deselect`
                : `Pick any ${MAX_PICKS - pickCount} more game${MAX_PICKS - pickCount !== 1 ? "s" : ""}`
              }
            </div>
          )}

          {games.map(g => {
            const pickedTeam = picks.get(g.id) ?? null;
            const existingResult = existingPicks.find(p => p.gameId === g.id);
            const isCorrect = existingResult?.isCorrect ?? null;
            const pointsEarned = existingResult?.pointsEarned ?? null;
            const isPush = isPick5Push(isCorrect, pointsEarned);

            const isPicked = !!pickedTeam;
            const isGameLocked = gameLocked(g);
            const sideDisabled = isLocked || isFutureWeek || isGameLocked;
            const isDisabled = !sideDisabled && atLimit && !isPicked;
            const rank = ranks.get(g.id) ?? null;

            const resultClass = isCorrect === true ? " result-correct"
              : isCorrect === false ? " result-incorrect"
              : isPush ? " result-push" : "";

            return (
              <div
                key={g.id}
                className={`pp-pick-row${isPicked ? " has-pick" : ""}${isDisabled || (isGameLocked && !isPicked) ? " p5-dimmed" : ""}${resultClass}`}
              >
                <div className="pp-pick-inner schedule-only">
                  <div className="pp-pick-center">
                    <div className="pp-pick-meta">
                      <span className="pp-pick-meta-time">{formatTime(g.kickoffTime)}</span>
                      {isGameLocked && !isLocked && <span className="pp-pick-meta-lockedtag">LOCKED</span>}
                      <div className="pp-pick-meta-spacer" />
                      {isCorrect === true && <span className="pp-pick-meta-won">+{formatPts(pointsEarned ?? 1)} pt{(pointsEarned ?? 1) !== 1 ? "s" : ""}</span>}
                      {isPush && <span className="pp-pick-meta-push">{formatPts(pointsEarned ?? 0.5)} push</span>}
                      {isCorrect === false && <span className="pp-pick-meta-lost">0 pts</span>}
                    </div>
                    <div className="pp-pick-teams">
                      {/* Away */}
                      <button
                        type="button"
                        className={`pp-pick-side away${pickedTeam === g.awayTeam ? " picked" : ""}${sideDisabled || isDisabled ? " locked" : ""}`}
                        onClick={() => pickTeam(g.id, g.awayTeam)}
                        disabled={sideDisabled || isDisabled}
                        style={{
                          background: pickedTeam === g.awayTeam
                            ? `linear-gradient(90deg, color-mix(in oklab, ${teamColor(g.awayTeam)} 50%, transparent), color-mix(in oklab, ${teamColor(g.awayTeam)} 18%, transparent))`
                            : "transparent"
                        }}
                      >
                        {pickedTeam === g.awayTeam && <div className="pp-pick-side-edge" style={{ background: teamColor(g.awayTeam) }} />}
                        <div className="pp-pick-logo" style={{ background: teamGradient(g.awayTeam) }}>{g.awayTeam}</div>
                        <div className="pp-pick-team-info">
                          <span className="pp-pick-abbr">{g.awayTeam}</span>
                          {showSpread && <span className="pp-pick-spread">{formatSpread(g.spreadHome, "away")}</span>}
                        </div>
                      </button>

                      <div className="pp-pick-at">
                        <div className="pp-pick-at-vs">@</div>
                      </div>

                      {/* Home */}
                      <button
                        type="button"
                        className={`pp-pick-side home${pickedTeam === g.homeTeam ? " picked" : ""}${sideDisabled || isDisabled ? " locked" : ""}`}
                        onClick={() => pickTeam(g.id, g.homeTeam)}
                        disabled={sideDisabled || isDisabled}
                        style={{
                          background: pickedTeam === g.homeTeam
                            ? `linear-gradient(270deg, color-mix(in oklab, ${teamColor(g.homeTeam)} 50%, transparent), color-mix(in oklab, ${teamColor(g.homeTeam)} 18%, transparent))`
                            : "transparent"
                        }}
                      >
                        {pickedTeam === g.homeTeam && <div className="pp-pick-side-edge" style={{ background: teamColor(g.homeTeam) }} />}
                        <div className="pp-pick-team-info">
                          <span className="pp-pick-abbr">{g.homeTeam}</span>
                          {showSpread && <span className="pp-pick-spread">{formatSpread(g.spreadHome, "home")}</span>}
                        </div>
                        <div className="pp-pick-logo" style={{ background: teamGradient(g.homeTeam) }}>{g.homeTeam}</div>
                      </button>
                    </div>

                    {/* Confidence rank 1–5 */}
                    {confidenceEnabled && isPicked && (
                      <div className="p5-rank-row">
                        <span className="p5-rank-label">CONF</span>
                        {Array.from({ length: MAX_PICKS }, (_, i) => i + 1).map(n => (
                          <button
                            key={n}
                            type="button"
                            className={`p5-rank-chip${rank === n ? " selected" : ""}`}
                            onClick={() => assignRank(g.id, n)}
                            disabled={sideDisabled}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div className="ps-bottom-bar">
          <div className="ps-score-display">
            {isLocked
              ? `${picks.size} of ${MAX_PICKS} picks submitted · locked`
              : confidenceEnabled && atLimit && unrankedCount > 0
                ? `${unrankedCount} pick${unrankedCount !== 1 ? "s" : ""} unranked`
                : `${picks.size} of ${MAX_PICKS} picks`
            }
          </div>
          <div className="ps-score-spacer" />
          {!isLocked && (
            <button
              type="button"
              className={`ps-save-btn${saved ? " saved" : ""}${saving ? " saving" : ""}`}
              onClick={saveAllPicks}
              disabled={saving || picks.size === 0}
            >
              {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Picks"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
