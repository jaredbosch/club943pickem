"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SlotGroup } from "./SlotGroup";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SignOutButton } from "@/components/ui/SignOutButton";
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

type Props = {
  slots: Slot[];
  week: number;
  seasonYear: number;
  availableWeeks: number[];
  leagueId: string;
  leagueName: string;
  leagueCode: string;
  userId: string;
  hasGames: boolean;
  isSampleData?: boolean;
  mnfGame?: MnfGame | null;
  initialTiebreakerGuess?: number | null;
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
  userId,
  hasGames,
  isSampleData = false,
  mnfGame = null,
  initialTiebreakerGuess = null,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [picks, setPicks] = useState<Map<string, PickState>>(() => buildPickState(slots));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openPickerId, setOpenPickerId] = useState<string | null>(null);
  const [tbGuess, setTbGuess] = useState<string>(initialTiebreakerGuess != null ? String(initialTiebreakerGuess) : "");
  const [tbSaving, setTbSaving] = useState(false);
  const [tbSaved, setTbSaved] = useState(false);
  const isDirtyRef = useRef(false);

  // Mark dirty on any pick change so autosave knows there's something to do
  const markDirty = () => { isDirtyRef.current = true; };

  // Autosave every 10s if there are unsaved changes
  useEffect(() => {
    if (isSampleData) return;
    const id = setInterval(async () => {
      if (!isDirtyRef.current) return;
      isDirtyRef.current = false;
      await saveAllPicks();
    }, 10_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSampleData]);

  const allGames = slots.flatMap((s) => s.games);
  const totalGames = allGames.length;

  // Map of confidence value → picked team abbr (for showing who has each value in the picker)
  const usedConfidenceMap = new Map<number, string>();
  for (const [, p] of picks) {
    if (p.confidence !== null) usedConfidenceMap.set(p.confidence, p.pickedTeam ?? "—");
  }

  async function upsertPick(gameId: string, state: PickState) {
    if (isSampleData) return;
    setSaving(true);
    await supabase.from("picks").upsert(
      {
        user_id: userId,
        league_id: leagueId,
        game_id: gameId,
        picked_team: state.pickedTeam,
        confidence: state.confidence,
        is_locked: false,
      },
      { onConflict: "user_id,league_id,game_id" },
    );
    setSaving(false);
  }

  async function saveAllPicks() {
    if (isSampleData) return;
    setSaving(true);
    const rows = [...picks.entries()].map(([gameId, state]) => ({
      user_id: userId,
      league_id: leagueId,
      game_id: gameId,
      picked_team: state.pickedTeam,
      confidence: state.confidence,
      is_locked: false,
    }));
    await supabase.from("picks").upsert(rows, { onConflict: "user_id,league_id,game_id" });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  async function saveTiebreaker() {
    if (!mnfGame || isSampleData || mnfGame.isLocked) return;
    const val = parseInt(tbGuess, 10);
    if (isNaN(val) || val < 0 || val > 120) return;
    setTbSaving(true);
    await supabase.from("tiebreaker_guesses").upsert(
      { user_id: userId, league_id: leagueId, game_id: mnfGame.id, week, guess: val },
      { onConflict: "user_id,league_id,week" },
    );
    setTbSaving(false);
    setTbSaved(true);
    setTimeout(() => setTbSaved(false), 2500);
  }

  const pickTeam = useCallback(
    (gameId: string, team: string) => {
      setPicks((prev) => {
        const current = prev.get(gameId) ?? { pickedTeam: null, confidence: null };
        if (current.pickedTeam === team) return prev;
        const updated = { ...current, pickedTeam: team };
        if (!updated.confidence) {
          const used = new Set([...prev.values()].map((p) => p.confidence).filter((n) => n !== null) as number[]);
          const avail = Array.from({ length: allGames.length }, (_, i) => i + 1).filter((n) => !used.has(n));
          // Assign highest available — first game you pick gets the top confidence
          if (avail.length > 0) updated.confidence = avail[avail.length - 1];
        }
        const newMap = new Map(prev);
        newMap.set(gameId, updated);
        upsertPick(gameId, updated);
        markDirty();
        return newMap;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allGames],
  );

  const setConfidence = useCallback(
    (gameId: string, value: number) => {
      setPicks((prev) => {
        const newMap = new Map(prev);
        // Clear (don't swap) any other game that already holds this value
        for (const [gid, p] of newMap) {
          if (gid !== gameId && p.confidence === value) {
            const cleared = { ...p, confidence: null };
            newMap.set(gid, cleared);
            upsertPick(gid, cleared);
            break;
          }
        }
        const current = newMap.get(gameId) ?? { pickedTeam: null, confidence: null };
        const updated = { ...current, confidence: value };
        newMap.set(gameId, updated);
        upsertPick(gameId, updated);
        markDirty();
        return newMap;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const mergedSlots = mergeSlots(slots, picks);
  const picksIn = [...picks.values()].filter((p) => p.pickedTeam).length;
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
          <button
            type="button"
            className={`ps-save-btn${saved ? " saved" : ""}${saving ? " saving" : ""}`}
            onClick={saveAllPicks}
            disabled={saving || isSampleData}
          >
            {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Picks"}
          </button>
          <SignOutButton />
          <ThemeToggle />
        </header>

        {/* Confidence budget bar */}
        {hasGames && (
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

        {/* Hero */}
        <div className="ps-hero pp-hero-grad">
          <div>
            <div className="ps-hero-week">WEEK {week} · {seasonYear} · CONFIDENCE PICKS</div>
            <div className="ps-hero-title">LOCK IT IN</div>
            <div className="ps-hero-sub">
              {leagueName}
              {saving && <span className="ps-saving"> · saving…</span>}
            </div>
          </div>
          <div className="ps-hero-right">
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

        {isSampleData && (
          <div className="ps-sample-banner">
            Sample data — picks here won&apos;t be saved. Games load automatically once the season schedule is released.
          </div>
        )}

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
            <div className="ps-pick-list">
              {mergedSlots.map((slot) => (
                <SlotGroup
                  key={slot.id}
                  slot={slot}
                  onPickTeam={pickTeam}
                  onConfidenceChange={setConfidence}
                  totalGames={totalGames}
                  usedConfidenceMap={usedConfidenceMap}
                  openPickerId={openPickerId}
                  onOpenPicker={setOpenPickerId}
                />
              ))}
            </div>
          </>
        )}

        {/* MNF Tiebreaker */}
        {mnfGame && (
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
                disabled={mnfGame.isLocked || isSampleData}
              />
              <button
                type="button"
                className={`ps-tb-btn${tbSaved ? " saved" : ""}`}
                onClick={saveTiebreaker}
                disabled={mnfGame.isLocked || tbSaving || isSampleData || tbGuess === ""}
              >
                {tbSaved ? "✓ Saved" : tbSaving ? "…" : "Submit"}
              </button>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="ps-bottom-bar">
          <div className="ps-score-display">
            <strong>{picksIn}</strong> of {totalGames} picks submitted
          </div>
          <div className="ps-score-spacer" />
          <button
            type="button"
            className={`ps-save-btn${saved ? " saved" : ""}${saving ? " saving" : ""}`}
            onClick={saveAllPicks}
            disabled={saving || isSampleData}
          >
            {saved ? "✓ Saved!" : saving ? "Saving…" : "Save Picks"}
          </button>
        </div>

      </div>
    </div>
  );
}
