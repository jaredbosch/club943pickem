"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SlotGroup } from "./SlotGroup";
import type { Slot, Game } from "./types";

type PickState = {
  pickedTeam: string | null;
  confidence: number | null;
};

type Props = {
  slots: Slot[];
  week: number;
  seasonYear: number;
  availableWeeks: number[];
  leagueId: string;
  leagueName: string;
  userId: string;
  hasGames: boolean;
  isSampleData?: boolean;
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
      return {
        ...g,
        pickedTeam: p?.pickedTeam ?? undefined,
        confidence: p?.confidence ?? null,
      };
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
  userId,
  hasGames,
  isSampleData = false,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [picks, setPicks] = useState<Map<string, PickState>>(
    () => buildPickState(slots),
  );
  const [saving, setSaving] = useState(false);

  const allGames = slots.flatMap((s) => s.games);
  const totalGames = allGames.length;

  // Confidence values assigned so far
  const usedConfidence = new Set(
    [...picks.values()].map((p) => p.confidence).filter(Boolean) as number[],
  );
  const availableConfidence = Array.from(
    { length: totalGames },
    (_, i) => totalGames - i,
  ).filter((n) => !usedConfidence.has(n));

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

  const pickTeam = useCallback(
    (gameId: string, team: string) => {
      setPicks((prev) => {
        const current = prev.get(gameId) ?? { pickedTeam: null, confidence: null };
        if (current.pickedTeam === team) return prev; // no-op if already picked
        const updated = { ...current, pickedTeam: team };
        // Auto-assign lowest available confidence if none set
        if (!updated.confidence) {
          const used = new Set(
            [...prev.values()].map((p) => p.confidence).filter(Boolean) as number[],
          );
          const avail = Array.from(
            { length: allGames.length },
            (_, i) => i + 1,
          ).filter((n) => !used.has(n));
          if (avail.length > 0) updated.confidence = avail[0];
        }
        const newMap = new Map(prev);
        newMap.set(gameId, updated);
        upsertPick(gameId, updated);
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
        // Find game currently holding this confidence value and swap
        for (const [gid, p] of newMap) {
          if (gid !== gameId && p.confidence === value) {
            const displaced = newMap.get(gameId)?.confidence ?? null;
            newMap.set(gid, { ...p, confidence: displaced });
            upsertPick(gid, { ...p, confidence: displaced });
            break;
          }
        }
        const current = newMap.get(gameId) ?? { pickedTeam: null, confidence: null };
        const updated = { ...current, confidence: value };
        newMap.set(gameId, updated);
        upsertPick(gameId, updated);
        return newMap;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const mergedSlots = mergeSlots(slots, picks);

  const picksIn = [...picks.values()].filter((p) => p.pickedTeam).length;
  const totalPoints = [...picks.values()].reduce(
    (sum, p) => sum + (p.confidence ?? 0),
    0,
  );

  function goToWeek(w: number) {
    router.push(`/picks?week=${w}`);
  }

  const weeksToShow =
    availableWeeks.length > 0
      ? availableWeeks
      : [week];

  return (
    <div className="ps-shell">
      <div className="ps-container">
        <div className="ps-header">
          <div>
            <div className="ps-title">week {week} pick sheet</div>
            <div className="ps-subtitle">
              {leagueName}{" "}
              {saving && <span className="ps-saving">saving…</span>}
            </div>
          </div>
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

        {isSampleData && (
          <div className="ps-sample-banner">
            Sample data — picks here won&apos;t be saved. Games load automatically once the season schedule is released.
          </div>
        )}

        {!hasGames ? (
          <div className="ps-empty">
            <div className="ps-empty-title">No games this week yet</div>
            <div className="ps-empty-sub">
              Games sync automatically once the schedule is released.
            </div>
          </div>
        ) : (
          <>
            {/* Confidence pool */}
            <div className="ps-section-label">confidence points available</div>
            <div className="ps-confidence-pool">
              {Array.from({ length: totalGames }, (_, i) => totalGames - i).map((n) => (
                <div
                  key={n}
                  className={`ps-conf-chip${usedConfidence.has(n) ? " used" : ""}`}
                >
                  {n}
                </div>
              ))}
            </div>

            {mergedSlots.map((slot) => (
              <SlotGroup
                key={slot.id}
                slot={slot}
                onPickTeam={pickTeam}
                onConfidenceChange={setConfidence}
                totalGames={totalGames}
                usedConfidence={usedConfidence}
              />
            ))}

            <div className="ps-bottom-bar">
              <div className="ps-score-display">
                week {week}: <strong>{picksIn}</strong> of {totalGames} picks in
                <br />
                <span className="ps-score-sub">
                  {totalPoints} confidence pts assigned
                </span>
              </div>
              <a href="/dashboard" className="ps-submit-btn">
                ← Standings
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
