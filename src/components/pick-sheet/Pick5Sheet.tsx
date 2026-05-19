"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SignOutButton } from "@/components/ui/SignOutButton";
import { NFL_COLORS } from "@/lib/nfl-colors";
import type { ScoringType } from "@/lib/scoring";
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
  isThursdayLocked: boolean;
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
  isThursdayLocked, hasGames,
}: Props) {
  const supabase = createClient();
  const showSpread = isAtsFormat(scoringType);
  const isFutureWeek = week > activeWeek;
  const isLocked = isThursdayLocked || isFutureWeek;

  // picks: gameId → pickedTeam
  const [picks, setPicks] = useState<Map<string, string>>(() => {
    const m = new Map<string, string>();
    for (const p of existingPicks) {
      if (p.pickedTeam) m.set(p.gameId, p.pickedTeam);
    }
    return m;
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const pickCount = picks.size;
  const atLimit = pickCount >= MAX_PICKS;

  const pickTeam = useCallback(async (gameId: string, team: string) => {
    if (isLocked) return;

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

    // Update UI state
    setPicks(prev => {
      const next = new Map(prev);
      if (newPick === null) next.delete(gameId);
      else next.set(gameId, newPick!);
      return next;
    });

    // Persist to DB immediately
    if (newPick) {
      const { error } = await supabase.from("picks").upsert(
        { user_id: userId, league_id: leagueId, game_id: gameId, week, picked_team: newPick, confidence: null, is_locked: false },
        { onConflict: "user_id,league_id,game_id" }
      );
      if (error) setSaveError(error.message);
    } else {
      const { error } = await supabase.from("picks").delete()
        .eq("user_id", userId).eq("league_id", leagueId).eq("game_id", gameId);
      if (error) setSaveError(error.message);
    }
  }, [isLocked, picks, leagueId, userId, week, supabase]);

  async function saveAllPicks() {
    setSaving(true);
    setSaveError(null);
    const rows = [...picks.entries()].map(([gameId, pickedTeam]) => ({
      user_id: userId, league_id: leagueId, game_id: gameId,
      week, picked_team: pickedTeam, confidence: null, is_locked: false,
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

  return (
    <div className="ps-shell pp-gridbg">
      <div className="ps-container" style={{ maxWidth: 760 }}>

        {/* Sticky header */}
        <div className="ps-sticky-header">
          <header className="app-nav">
            <Link href={`/league/${leagueCode}/dashboard`} className="app-nav-logo">
              <div className="app-nav-badge">TPP</div>
              <span className="app-nav-name">thepickempool</span>
            </Link>
            <div style={{ width: 1, height: 24, background: "var(--line)" }} />
            <span className="pp-chip solid">{leagueName}</span>
            <div style={{ flex: 1 }} />
            <Link href="/settings" className="ps-nav-back">Settings</Link>
            <Link href={`/league/${leagueCode}/dashboard`} className="ps-nav-back">← Standings</Link>
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
            {saveError && <span className="ps-save-error" title={saveError}>⚠ Save failed</span>}
            <SignOutButton />
            <ThemeToggle />
          </header>

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
              {isThursdayLocked && <span style={{ color: "var(--bad)", marginLeft: 8 }}>· Locked</span>}
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
            ⏰ All picks lock Thursday at kickoff · 1pt win · ½pt push · 0pt loss
          </div>
        )}
        {isFutureWeek && (
          <div className="ps-future-banner">
            Schedule for Week {week} — picks open once Week {activeWeek} wraps up.
          </div>
        )}
        {isThursdayLocked && !isFutureWeek && (
          <div className="ps-future-banner">
            Picks are locked — the Thursday night game has kicked off.
          </div>
        )}

        {/* All games — pick directly */}
        <div className="ps-pick-list">
          {!isLocked && !isFutureWeek && (
            <div className="p5-select-hint">
              {atLimit
                ? `${MAX_PICKS} picks locked in — tap any pick to change sides or deselect`
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
            const isDisabled = !isLocked && atLimit && !isPicked && !isFutureWeek;

            const resultClass = isCorrect === true ? " result-correct"
              : isCorrect === false ? " result-incorrect"
              : isPush ? " result-push" : "";

            return (
              <div
                key={g.id}
                className={`pp-pick-row${isPicked ? " has-pick" : ""}${isDisabled ? " p5-dimmed" : ""}${resultClass}`}
              >
                <div className="pp-pick-inner schedule-only">
                  <div className="pp-pick-center">
                    <div className="pp-pick-meta">
                      <span className="pp-pick-meta-time">{formatTime(g.kickoffTime)}</span>
                      <div className="pp-pick-meta-spacer" />
                      {isCorrect === true && <span className="pp-pick-meta-won">+1 pt</span>}
                      {isPush && <span className="pp-pick-meta-push">½ push</span>}
                      {isCorrect === false && <span className="pp-pick-meta-lost">0 pts</span>}
                    </div>
                    <div className="pp-pick-teams">
                      {/* Away */}
                      <button
                        type="button"
                        className={`pp-pick-side away${pickedTeam === g.awayTeam ? " picked" : ""}${isLocked || isDisabled || isFutureWeek ? " locked" : ""}`}
                        onClick={() => pickTeam(g.id, g.awayTeam)}
                        disabled={isLocked || isFutureWeek || (isDisabled)}
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
                        className={`pp-pick-side home${pickedTeam === g.homeTeam ? " picked" : ""}${isLocked || isDisabled || isFutureWeek ? " locked" : ""}`}
                        onClick={() => pickTeam(g.id, g.homeTeam)}
                        disabled={isLocked || isFutureWeek || (isDisabled)}
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
