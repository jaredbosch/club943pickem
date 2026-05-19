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
  pointsEarned: number | null; // 1 = win, 0.5 = push, 0 = loss, null = pending
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

function formatSpread(spreadHome: number | null, team: "home" | "away"): string {
  if (spreadHome == null) return "";
  const line = team === "home" ? spreadHome : -spreadHome;
  if (line === 0) return "PK";
  return line > 0 ? `+${line}` : `${line}`;
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "short", month: "numeric", day: "numeric",
      hour: "numeric", minute: "2-digit", timeZone: "America/New_York", hour12: true,
    });
  } catch { return ""; }
}

function teamColor(abbr: string): string {
  return (NFL_COLORS as Record<string, { primary: string }>)[abbr]?.primary ?? "#333";
}

function teamGradient(abbr: string): string {
  const c = teamColor(abbr);
  return `linear-gradient(145deg, ${c}, color-mix(in oklab, ${c} 70%, #000))`;
}

const MAX_PICKS = 5;

export function Pick5Sheet({
  leagueId, leagueName, leagueCode, userId, week, seasonYear,
  availableWeeks, scoringType, activeWeek, games, existingPicks,
  isThursdayLocked, hasGames,
}: Props) {
  const supabase = createClient();
  const showSpread = isAtsFormat(scoringType);
  const isFutureWeek = week > activeWeek;
  const isLocked = isThursdayLocked || isFutureWeek;

  // Build initial state from existing picks
  // Selected games = any game with a pick row (even if pickedTeam is null)
  const initialSelected = new Set(existingPicks.map(p => p.gameId));
  const initialPicks = new Map(
    existingPicks.filter(p => p.pickedTeam).map(p => [p.gameId, p.pickedTeam as string])
  );

  const [selected, setSelected] = useState<Set<string>>(initialSelected);
  const [picks, setPicks] = useState<Map<string, string>>(initialPicks);
  const [phase, setPhase] = useState<"select" | "pick">(
    initialSelected.size === MAX_PICKS ? "pick" : "select"
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const canEdit = !isLocked;

  // ── Selection phase ──────────────────────────────────────────────
  const toggleGame = useCallback(async (gameId: string) => {
    if (!canEdit) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
        // Also remove any pick for this game
        setPicks(p => { const m = new Map(p); m.delete(gameId); return m; });
        // Delete pick row from DB
        supabase.from("picks")
          .delete()
          .eq("user_id", userId)
          .eq("league_id", leagueId)
          .eq("game_id", gameId)
          .then(() => {});
      } else if (next.size < MAX_PICKS) {
        next.add(gameId);
        // Insert a placeholder pick row (no side yet) to persist selection
        supabase.from("picks").upsert({
          user_id: userId, league_id: leagueId, game_id: gameId,
          week, picked_team: null, confidence: null, is_locked: false,
        }, { onConflict: "user_id,league_id,game_id" }).then(() => {});
      }
      return next;
    });
  }, [canEdit, leagueId, userId, week, supabase]);

  // ── Pick phase ───────────────────────────────────────────────────
  const pickTeam = useCallback((gameId: string, team: string) => {
    if (!canEdit) return;
    setPicks(prev => {
      const next = new Map(prev);
      if (next.get(gameId) === team) {
        next.delete(gameId); // deselect
      } else {
        next.set(gameId, team);
      }
      return next;
    });
    setSaved(false);
  }, [canEdit]);

  async function savePicks() {
    setSaving(true);
    setSaveError(null);
    const selectedGames = [...selected];
    const rows = selectedGames.map(gameId => ({
      user_id: userId,
      league_id: leagueId,
      game_id: gameId,
      week,
      picked_team: picks.get(gameId) ?? null,
      confidence: null,
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

  const selectedGames = games.filter(g => selected.has(g.id));
  const picksComplete = selectedGames.length === MAX_PICKS && selectedGames.every(g => picks.has(g.id));

  return (
    <div className="ps-shell pp-gridbg">
      <div className="ps-container" style={{ maxWidth: 760 }}>

        {/* Nav */}
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
                onClick={savePicks}
                disabled={saving || selected.size === 0}
              >
                {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Picks"}
              </button>
            )}
            {saveError && <span className="ps-save-error" title={saveError}>⚠ Save failed</span>}
            <SignOutButton />
            <ThemeToggle />
          </header>

          {/* Phase indicator */}
          <div className="p5-phase-bar">
            <button
              type="button"
              className={`p5-phase-btn${phase === "select" ? " active" : ""}`}
              onClick={() => setPhase("select")}
            >
              <span className="p5-phase-num">{selected.size}/{MAX_PICKS}</span>
              Games Selected
            </button>
            <div className="p5-phase-arrow">→</div>
            <button
              type="button"
              className={`p5-phase-btn${phase === "pick" ? " active" : ""}${selected.size < MAX_PICKS ? " disabled" : ""}`}
              onClick={() => selected.size === MAX_PICKS && setPhase("pick")}
              disabled={selected.size < MAX_PICKS}
            >
              <span className="p5-phase-num">{picks.size}/{MAX_PICKS}</span>
              Sides Picked
            </button>
          </div>
        </div>

        {/* Hero */}
        <div className="ps-hero pp-hero-grad">
          <div>
            <div className="ps-hero-week">
              WEEK {week} · {seasonYear} · {isFutureWeek ? "SCHEDULE" : `PICK ${MAX_PICKS}${showSpread ? " ATS" : ""}`}
            </div>
            <div className="ps-hero-title">
              {isFutureWeek ? "COMING SOON" : phase === "select" ? "CHOOSE YOUR 5" : "LOCK YOUR SIDES"}
            </div>
            <div className="ps-hero-sub">
              {leagueName}
              {isThursdayLocked && <span style={{ color: "var(--bad)", marginLeft: 8 }}>· Locked</span>}
            </div>
          </div>
          <div className="ps-hero-right" style={{ minWidth: 0, overflow: "hidden" }}>
            {/* Week nav */}
            <div className="ps-week-nav" style={{ overflowX: "auto", flexWrap: "nowrap", maxWidth: "100%", paddingBottom: 4, scrollbarWidth: "none" }}>
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

        {isFutureWeek ? (
          <div className="ps-future-banner">
            Schedule for Week {week} — picks open once Week {activeWeek} wraps up.
          </div>
        ) : isThursdayLocked && phase === "select" ? (
          <div className="ps-future-banner">
            Picks are locked — the Thursday night game has kicked off.
          </div>
        ) : null}

        {/* Lock deadline + scoring rule */}
        {!isLocked && !isFutureWeek && (
          <div className="p5-lock-notice">
            ⏰ All picks lock Thursday at kickoff · 1pt win · ½pt push · 0pt loss
          </div>
        )}

        {/* ── PHASE 1: Game selection ── */}
        {phase === "select" && (
          <div className="ps-pick-list">
            <div className="p5-select-hint">
              {isLocked
                ? "Game selection is locked."
                : selected.size < MAX_PICKS
                ? `Pick ${MAX_PICKS - selected.size} more game${MAX_PICKS - selected.size !== 1 ? "s" : ""} to pick sides`
                : "All 5 selected — tap a game to deselect, or continue to pick sides →"
              }
            </div>

            {games.map(g => {
              const isSelected = selected.has(g.id);
              const awayColor = teamColor(g.awayTeam);
              const homeColor = teamColor(g.homeTeam);
              const canSelect = canEdit && (isSelected || selected.size < MAX_PICKS);

              return (
                <button
                  key={g.id}
                  type="button"
                  className={`p5-game-row${isSelected ? " selected" : ""}${!canSelect ? " disabled" : ""}`}
                  onClick={() => toggleGame(g.id)}
                  disabled={!canSelect}
                >
                  <div className="p5-select-check">{isSelected ? "✓" : "+"}</div>
                  <div className="p5-game-teams">
                    <div className="p5-team">
                      <div className="p5-logo" style={{ background: teamGradient(g.awayTeam) }}>{g.awayTeam}</div>
                      <span className="p5-abbr">{g.awayTeam}</span>
                      {showSpread && <span className="p5-spread">{formatSpread(g.spreadHome, "away")}</span>}
                    </div>
                    <span className="p5-at">@</span>
                    <div className="p5-team home">
                      {showSpread && <span className="p5-spread">{formatSpread(g.spreadHome, "home")}</span>}
                      <span className="p5-abbr">{g.homeTeam}</span>
                      <div className="p5-logo" style={{ background: teamGradient(g.homeTeam) }}>{g.homeTeam}</div>
                    </div>
                  </div>
                  <div className="p5-game-time">{formatTime(g.kickoffTime)}</div>
                </button>
              );
            })}

            {selected.size === MAX_PICKS && !isLocked && (
              <div className="p5-continue-wrap">
                <button
                  type="button"
                  className="ps-save-btn"
                  onClick={() => setPhase("pick")}
                >
                  Pick Your Sides →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PHASE 2: Pick sides ── */}
        {phase === "pick" && (
          <div className="ps-pick-list">
            <div className="p5-select-hint">
              {isLocked ? "Picks are locked." : "Tap a team to pick your side for each game."}
            </div>

            {selectedGames.map(g => {
              const pickedTeam = picks.get(g.id) ?? null;
              const existingResult = existingPicks.find(p => p.gameId === g.id);
              const isCorrect = existingResult?.isCorrect ?? null;
              const pointsEarned = existingResult?.pointsEarned ?? null;
              const isPush = isPick5Push(isCorrect, pointsEarned);
              const resultClass = isCorrect === true ? " result-correct" : isCorrect === false ? " result-incorrect" : isPush ? " result-push" : "";

              return (
                <div key={g.id} className={`pp-pick-row has-pick${resultClass}`}>
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
                          className={`pp-pick-side away${pickedTeam === g.awayTeam ? " picked" : ""}${isLocked ? " locked" : ""}`}
                          onClick={() => pickTeam(g.id, g.awayTeam)}
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
                            {showSpread && g.spreadHome != null && (
                              <span className="pp-pick-spread">{formatSpread(g.spreadHome, "away")}</span>
                            )}
                          </div>
                        </button>

                        <div className="pp-pick-at">
                          <div className="pp-pick-at-vs">@</div>
                        </div>

                        {/* Home */}
                        <button
                          type="button"
                          className={`pp-pick-side home${pickedTeam === g.homeTeam ? " picked" : ""}${isLocked ? " locked" : ""}`}
                          onClick={() => pickTeam(g.id, g.homeTeam)}
                          style={{
                            background: pickedTeam === g.homeTeam
                              ? `linear-gradient(270deg, color-mix(in oklab, ${teamColor(g.homeTeam)} 50%, transparent), color-mix(in oklab, ${teamColor(g.homeTeam)} 18%, transparent))`
                              : "transparent"
                          }}
                        >
                          {pickedTeam === g.homeTeam && <div className="pp-pick-side-edge" style={{ background: teamColor(g.homeTeam) }} />}
                          <div className="pp-pick-team-info">
                            <span className="pp-pick-abbr">{g.homeTeam}</span>
                            {showSpread && g.spreadHome != null && (
                              <span className="pp-pick-spread">{formatSpread(g.spreadHome, "home")}</span>
                            )}
                          </div>
                          <div className="pp-pick-logo" style={{ background: teamGradient(g.homeTeam) }}>{g.homeTeam}</div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="p5-continue-wrap" style={{ flexDirection: "row", gap: 12 }}>
              <button type="button" className="pp-btn ghost" onClick={() => setPhase("select")}>
                ← Change Games
              </button>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="ps-bottom-bar">
          <div className="ps-score-display">
            {isLocked
              ? `${picks.size} of ${MAX_PICKS} picks submitted · locked`
              : phase === "select"
              ? `${selected.size} of ${MAX_PICKS} games selected`
              : `${picks.size} of ${MAX_PICKS} sides picked`
            }
          </div>
          <div className="ps-score-spacer" />
          {!isLocked && (
            <button
              type="button"
              className={`ps-save-btn${saved ? " saved" : ""}${saving ? " saving" : ""}`}
              onClick={savePicks}
              disabled={saving || selected.size === 0}
            >
              {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Picks"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
