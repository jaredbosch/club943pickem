"use client";
import { AppHeader } from "@/components/nav/AppHeader";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SlotGroup } from "./SlotGroup";
import { GameRow } from "./GameRow";
import type { Slot, Game } from "./types";

type PickState = {
  pickedTeam: string | null;
  confidence: number | null;
};

type MnfGame = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  isLocked: boolean;
};

import type { ScoringType } from "@/lib/scoring";
import { isConfidenceFormat, isAtsFormat, scoringTypeHeroLabel } from "@/lib/scoring";

export type GlobalPickPcts = Map<string, { awayPct: number; homePct: number; total: number }>;
export type SpreadHistoryMap = Map<string, { spread: number; date: string }[]>;

type Props = {
  slots: Slot[];
  week: number;
  seasonYear: number;
  availableWeeks: number[];
  leagueId: string;
  leagueName: string;
  leagueCode: string;
  activeWeek: number;
  scoringType: ScoringType;
  userId: string;
  hasGames: boolean;
  mnfGame?: MnfGame | null;
  initialTiebreakerGuess?: number | null;
  globalPickPcts?: GlobalPickPcts;
  spreadHistoryMap?: SpreadHistoryMap;
};

function buildPickState(slots: Slot[]): Map<string, PickState> {
  const map = new Map<string, PickState>();
  for (const slot of slots) {
    for (const game of slot.games) {
      map.set(game.id, {
        pickedTeam: game.pickedTeam ?? null,
        confidence: game.confidence ?? null,
      });
    }
  }
  return map;
}

function mergeSlots(slots: Slot[], picks: Map<string, PickState>): Slot[] {
  return slots.map((slot) => ({
    ...slot,
    games: slot.games.map((g) => {
      const p = picks.get(g.id);
      return { ...g, pickedTeam: p?.pickedTeam ?? undefined, confidence: p?.confidence ?? null };
    }),
  }));
}

export function PickSheet({
  slots,
  week,
  seasonYear,
  availableWeeks,
  leagueId,
  leagueName,
  leagueCode,
  activeWeek,
  scoringType,
  userId,
  hasGames,
  mnfGame = null,
  initialTiebreakerGuess = null,
  globalPickPcts,
  spreadHistoryMap,
}: Props) {
  const isFutureWeek = week > activeWeek;
  const showConfidence = isConfidenceFormat(scoringType) && !isFutureWeek;
  const showSpread = isAtsFormat(scoringType) && !isFutureWeek;
  const router = useRouter();
  const supabase = createClient();

  const [picks, setPicks] = useState<Map<string, PickState>>(() => buildPickState(slots));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);
  const [tbGuess, setTbGuess] = useState<string>(initialTiebreakerGuess != null ? String(initialTiebreakerGuess) : "");
  const [tbSaving, setTbSaving] = useState(false);
  const [tbSaved, setTbSaved] = useState(false);
  const [sortByConfidence, setSortByConfidence] = useState(false);

  // Always-fresh ref to picks — lets callbacks save without stale closures
  const picksRef = useRef(picks);
  useEffect(() => { picksRef.current = picks; }, [picks]);

  const isDirtyRef = useRef(false);

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
      const next = buildPickState(slots);
      for (const id of touchedRef.current) {
        const p = prev.get(id);
        if (p) next.set(id, p);
      }
      return next;
    });
  }, [slots]);

  // Autosave every 3s (belt-and-suspenders behind per-tap saves)
  useEffect(() => {
    const id = setInterval(async () => {
      if (!isDirtyRef.current) return;
      isDirtyRef.current = false;
      await saveAllPicks();
    }, 3_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Warn before tab close if there are unsaved picks
  useEffect(() => {
    if (!showConfidence) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [showConfidence]);

  const allGames = slots.flatMap((s) => s.games);
  const totalGames = allGames.length;

  // Map of confidence value → picked team abbr (for showing who has each value in the picker)
  const usedConfidenceMap = new Map<number, string>();
  for (const [, p] of picks) {
    if (p.confidence !== null) usedConfidenceMap.set(p.confidence, p.pickedTeam ?? "—");
  }

  async function upsertPick(gameId: string, state: PickState) {
    if (state.pickedTeam === null && state.confidence === null) return;
    const { error } = await supabase.from("picks").upsert(
      {
        user_id: userId,
        league_id: leagueId,
        game_id: gameId,
        week,
        picked_team: state.pickedTeam ?? null,
        confidence: state.confidence ?? null,
        is_locked: false,
      },
      { onConflict: "user_id,league_id,game_id" },
    );
    if (error) setSaveError(error.message);
  }

  async function saveAllPicks() {
    setSaving(true);
    setSaveError(null);
    const rows = [...picks.entries()]
      .filter(([, state]) => state.pickedTeam !== null || state.confidence !== null)
      .map(([gameId, state]) => ({
        user_id: userId,
        league_id: leagueId,
        game_id: gameId,
        week,
        picked_team: state.pickedTeam ?? null,
        confidence: state.confidence ?? null,
        is_locked: false,
      }));
    if (rows.length > 0) {
      const { error } = await supabase.from("picks").upsert(rows, { onConflict: "user_id,league_id,game_id" });
      if (error) {
        setSaveError(error.message);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function saveTiebreaker() {
    if (!mnfGame || mnfGame.isLocked) return;
    const val = parseInt(tbGuess, 10);
    if (isNaN(val) || val < 0 || val > 120) return;
    setTbSaving(true);
    await supabase.from("tiebreaker_guesses").upsert(
      { user_id: userId, league_id: leagueId, game_id: mnfGame.id, week, guess: val },
      { onConflict: "user_id,league_id,season_year,week" },
    );
    setTbSaving(false);
    setTbSaved(true);
    setTimeout(() => setTbSaved(false), 2500);
  }

  const pickTeam = useCallback(
    async (gameId: string, team: string) => {
      // Compute new state directly from the always-fresh ref
      const current = picksRef.current.get(gameId) ?? { pickedTeam: null, confidence: null };
      if (current.pickedTeam === team) return; // no change
      const updated = { ...current, pickedTeam: team };

      // Update UI
      setPicks((prev) => {
        const next = new Map(prev);
        next.set(gameId, updated);
        return next;
      });
      touchedRef.current.add(gameId);
      isDirtyRef.current = true;

      // Save immediately — no setTimeout, no double-setState
      await upsertPick(gameId, updated);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const setConfidence = useCallback(
    async (gameId: string, value: number) => {
      const currentMap = picksRef.current;

      // Find if this confidence is already used by another game
      let clearedId: string | null = null;
      let clearedState: PickState | null = null;
      for (const [gid, p] of currentMap) {
        if (gid !== gameId && p.confidence === value) {
          clearedId = gid;
          clearedState = { ...p, confidence: null };
          break;
        }
      }

      const current = currentMap.get(gameId) ?? { pickedTeam: null, confidence: null };
      const updated = { ...current, confidence: value };

      // Update UI
      setPicks((prev) => {
        const next = new Map(prev);
        if (clearedId && clearedState) next.set(clearedId, clearedState);
        next.set(gameId, updated);
        return next;
      });
      touchedRef.current.add(gameId);
      if (clearedId) touchedRef.current.add(clearedId);
      isDirtyRef.current = true;

      // Save both affected picks immediately
      if (clearedId && clearedState) await upsertPick(clearedId, clearedState);
      await upsertPick(gameId, updated);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const mergedSlots = mergeSlots(slots, picks);
  const picksIn = [...picks.values()].filter((p) => p.pickedTeam).length;

  // Optional confidence-ordered view (confidence leagues only, kickoff is the
  // default): flat list, highest rank first, unranked games last in kickoff order
  const confidenceOrdered = showConfidence && sortByConfidence
    ? mergedSlots
        .flatMap((s) => s.games.map((g) => ({ game: g, slotStatus: s.status })))
        .sort((a, b) => (b.game.confidence ?? -1) - (a.game.confidence ?? -1))
    : null;
  const weeksToShow = availableWeeks.length > 0 ? availableWeeks : [week];

  const totalPointsEarned = mergedSlots.flatMap((s) => s.games).reduce((sum, g) => {
    if (g.result === "correct") return sum + (g.pointsEarned ?? g.confidence ?? 0);
    return sum;
  }, 0);
  const gamesScored = mergedSlots.flatMap((s) => s.games).filter((g) => g.result).length;

  function goToWeek(w: number) {
    router.push(`/league/${leagueCode}/picks?week=${w}`);
  }

  return (
    <div className="ps-shell pp-gridbg">
      <div className="ps-container">

        {/* Sticky header wrapper — nav + budget bar stick together as one unit */}
        <div className="ps-sticky-header">
        <AppHeader
          leagueCode={leagueCode}
          leagueName={leagueName}
          contextLabel={`WEEK ${week} · ${seasonYear}`}
          extra={
            <>
              {isFutureWeek && <span className="ps-future-badge">SCHEDULE ONLY</span>}
              {saveError && <span className="ps-save-error" title={saveError}>⚠ Save failed</span>}
            </>
          }
        />

        {/* Confidence budget bar — only for confidence leagues on active week */}
        {hasGames && showConfidence && (
          <div className="ps-budget-bar">
            <span className="ps-budget-bar-label">CONF</span>
            {Array.from({ length: totalGames }, (_, i) => totalGames - i).map((n) => (
              <div key={n} className={`ps-budget-bar-chip${usedConfidenceMap.has(n) ? " used" : ""}`}>
                {n}
              </div>
            ))}
            <span className="ps-budget-bar-count">{usedConfidenceMap.size}/{totalGames} used</span>
          </div>
        )}
        </div>{/* end ps-sticky-header */}

        {/* Desktop-only week-at-a-glance rail (hidden under 1280px) */}
        {hasGames && !isFutureWeek && (
          <aside className="ps-rail">
            <div className="ps-rail-title">Week {week} at a glance</div>
            <div className="ps-rail-stats">
              <div>
                <div className="ps-rail-stat-val">{picksIn}<span style={{ fontSize: 18 }}>/{totalGames}</span></div>
                <div className="ps-rail-stat-label">picks in</div>
              </div>
              {gamesScored > 0 && (
                <div>
                  <div className="ps-rail-stat-val plain">{totalPointsEarned}</div>
                  <div className="ps-rail-stat-label">pts this week</div>
                </div>
              )}
            </div>
            {showConfidence && (
              usedConfidenceMap.size < totalGames ? (
                <>
                  <div className="ps-rail-title" style={{ marginBottom: 8 }}>Confidence left to spend</div>
                  <div className="ps-rail-chips">
                    {Array.from({ length: totalGames }, (_, i) => totalGames - i)
                      .filter((n) => !usedConfidenceMap.has(n))
                      .map((n) => (
                        <div key={n} className="ps-budget-bar-chip">{n}</div>
                      ))}
                  </div>
                </>
              ) : (
                <div className="ps-rail-done">✓ All confidence points spent</div>
              )
            )}
          </aside>
        )}

        {/* Hero */}
        <div className="ps-hero pp-hero-grad">
          <div>
            <div className="ps-hero-week">WEEK {week} · {seasonYear} · {isFutureWeek ? "SCHEDULE" : scoringTypeHeroLabel(scoringType)}</div>
            <div className="ps-hero-title">{isFutureWeek ? "COMING SOON" : "LOCK IT IN"}</div>
            <div className="ps-hero-sub">
              {leagueName}
              {saving && <span className="ps-saving"> · saving…</span>}
            </div>
          </div>
          <div className="ps-hero-right" style={{ minWidth: 0 }}>
            {gamesScored > 0 && (
              <div className="ps-hero-kpis">
                <div className="ps-hero-kpi">
                  <div className="ps-hero-kpi-val">{totalPointsEarned}</div>
                  <div className="ps-hero-kpi-label">PTS THIS WEEK</div>
                </div>
                <div className="ps-hero-kpi">
                  <div className="ps-hero-kpi-val">{gamesScored}</div>
                  <div className="ps-hero-kpi-label">GRADED</div>
                </div>
              </div>
            )}
            <div className="ps-week-nav">
              {weeksToShow.map((w) => (
                <button
                  key={w}
                  type="button"
                  className={`ps-week-btn${w === week ? " active" : ""}`}
                  onClick={() => goToWeek(w)}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!hasGames ? (
          <div className="ps-pick-list">
            <div className="ps-empty">
              <div className="ps-empty-title">No games this week yet</div>
              <div className="ps-empty-sub">Games sync automatically once the schedule is released.</div>
            </div>
          </div>
        ) : (
          <>
            {/* Pick rows */}
            {isFutureWeek && (
              <div className="ps-future-banner">
                Schedule for Week {week} — game lines go live the Monday before the games, and picks open with them.
              </div>
            )}
            {showConfidence && (
              <div className="ps-sort-row">
                <span className="ps-sort-label">SORT</span>
                <button
                  type="button"
                  className={`ps-week-btn${!sortByConfidence ? " active" : ""}`}
                  onClick={() => setSortByConfidence(false)}
                >
                  Kickoff
                </button>
                <button
                  type="button"
                  className={`ps-week-btn${sortByConfidence ? " active" : ""}`}
                  onClick={() => setSortByConfidence(true)}
                >
                  Confidence
                </button>
              </div>
            )}
            <div className="ps-pick-list">
              {confidenceOrdered ? (
                <div className="ps-slot-group">
                  <div className="ps-slot-header">
                    <span className="ps-slot-label">Ranked by confidence</span>
                    <span className="ps-slot-spacer" />
                    <span className="ps-slot-status open">high → low</span>
                  </div>
                  {confidenceOrdered.map(({ game, slotStatus }) => (
                    <GameRow
                      key={game.id}
                      game={game}
                      slotStatus={slotStatus}
                      onPickTeam={pickTeam}
                      onConfidenceChange={setConfidence}
                      totalGames={totalGames}
                      usedConfidenceMap={usedConfidenceMap}
                      isPickerOpen={openPickerId === game.id}
                      onOpenPicker={setOpenPickerId}
                      showConfidence
                      showSpread={showSpread}
                      globalPct={globalPickPcts?.get(game.id)}
                      spreadHistory={spreadHistoryMap?.get(game.id)}
                    />
                  ))}
                </div>
              ) : (
              mergedSlots.map((slot) => (
                <SlotGroup
                  key={slot.id}
                  slot={slot}
                  onPickTeam={pickTeam}
                  onConfidenceChange={showConfidence ? setConfidence : undefined}
                  totalGames={totalGames}
                  usedConfidenceMap={usedConfidenceMap}
                  openPickerId={openPickerId}
                  onOpenPicker={setOpenPickerId}
                  scheduleOnly={isFutureWeek}
                  showConfidence={showConfidence}
                  showSpread={showSpread}
                  globalPickPcts={globalPickPcts}
                  spreadHistoryMap={spreadHistoryMap}
                />
              ))
              )}
            </div>
            {showSpread && !isFutureWeek && (
              <div
                style={{
                  fontFamily: "var(--font-code)",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--ink3)",
                  textAlign: "center",
                  padding: "10px 14px 2px",
                }}
              >
                Lines refresh every 4 hours · your spread locks with the game
              </div>
            )}
          </>
        )}

        {/* MNF Tiebreaker — not shown for future weeks */}
        {mnfGame && !isFutureWeek && (
          <div className={`ps-tiebreaker${mnfGame.isLocked ? " locked" : ""}`}>
            <div className="ps-tb-label">
              <span className="ps-tb-tag">MNF TIEBREAKER</span>
              <span className="ps-tb-matchup">{mnfGame.awayTeam} @ {mnfGame.homeTeam}</span>
              <span className="ps-tb-hint">
                {mnfGame.isLocked ? "Locked — game has started" : "Predict total combined score · used only if picks tie"}
              </span>
            </div>
            <div className="ps-tb-input-row">
              <input
                type="number"
                className="ps-tb-input"
                placeholder="e.g. 47"
                min={0}
                max={120}
                value={tbGuess}
                onChange={(e) => setTbGuess(e.target.value)}
                disabled={mnfGame.isLocked}
              />
              <button
                type="button"
                className={`ps-tb-btn${tbSaved ? " saved" : ""}`}
                onClick={saveTiebreaker}
                disabled={mnfGame.isLocked || tbSaving || tbGuess === ""}
              >
                {tbSaved ? "✓ Saved" : tbSaving ? "…" : "Submit"}
              </button>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        {isFutureWeek ? (
          <div className="ps-bottom-bar">
            <div className="ps-score-display">
              Week {week} opens Monday before the games — lines post then
            </div>
          </div>
        ) : (
          <div className="ps-bottom-bar">
            <div className="ps-score-display">
              <strong>{picksIn}</strong> of {totalGames} picks submitted
            </div>
            <div className="ps-score-spacer" />
            <button
              type="button"
              className={`ps-save-btn${saved ? " saved" : ""}${saving ? " saving" : ""}`}
              onClick={saveAllPicks}
              disabled={saving}
            >
              {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Picks"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
