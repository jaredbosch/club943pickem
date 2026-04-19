"use client";

import { useMemo, useState } from "react";
import { ConfidencePool } from "./ConfidencePool";
import { SlotGroup } from "./SlotGroup";
import type { ConfidenceUsage, Slot } from "./types";

type Props = {
  leagueId: string;
  leagueName: string;
  week: number;
  isPaid: boolean;
  isCommissioner: boolean;
  initialSlots: Slot[];
  initialTiebreaker: number;
  tiebreakerLocked: boolean;
  pointsSoFar: number;
  maxPossible: number;
  seasonRank: number | null;
  totalGames: number;
};

export function PickSheet(props: Props) {
  const {
    leagueId,
    leagueName,
    week,
    isPaid,
    initialSlots,
    initialTiebreaker,
    tiebreakerLocked,
    pointsSoFar,
    maxPossible,
    seasonRank,
    totalGames,
  } = props;

  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [tiebreaker, setTiebreaker] = useState(initialTiebreaker);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const confidenceValues = useMemo(
    () =>
      Array.from({ length: totalGames }, (_, i) => totalGames - i), // N..1 desc
    [totalGames],
  );

  const usage = useMemo(() => {
    const m = new Map<number, ConfidenceUsage>();
    for (const s of slots) {
      for (const g of s.games) {
        if (g.confidence > 0) {
          m.set(g.confidence, {
            gameId: g.id,
            gameLabel: `${g.away.abbr}@${g.home.abbr}`,
            locked: s.status !== "open",
          });
        }
      }
    }
    return m;
  }, [slots]);

  const togglePick = (gameId: string) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.status !== "open"
          ? slot
          : {
              ...slot,
              games: slot.games.map((g) => {
                if (g.id !== gameId) return g;
                const next =
                  g.pickedTeam === g.away.abbr ? g.home.abbr : g.away.abbr;
                return { ...g, pickedTeam: next };
              }),
            },
      ),
    );
  };

  const setConfidence = (gameId: string, value: number) => {
    setSlots((prev) =>
      prev.map((slot) =>
        slot.status !== "open"
          ? slot
          : {
              ...slot,
              games: slot.games.map((g) =>
                g.id === gameId ? { ...g, confidence: value } : g,
              ),
            },
      ),
    );
  };

  async function savePicks() {
    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    const outgoing: Array<{
      game_id: string;
      picked_team: string;
      confidence: number;
    }> = [];
    for (const s of slots) {
      if (s.status !== "open") continue;
      for (const g of s.games) {
        if (!g.pickedTeam || g.confidence <= 0) continue;
        outgoing.push({
          game_id: g.id,
          picked_team: g.pickedTeam,
          confidence: g.confidence,
        });
      }
    }

    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ league_id: leagueId, week, picks: outgoing }),
    });

    // Save tiebreaker in parallel (not awaited above to keep call count low).
    if (!tiebreakerLocked && tiebreaker > 0) {
      await fetch("/api/tiebreaker", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          league_id: leagueId,
          week,
          predicted_total: tiebreaker,
        }),
      });
    }

    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setSaveError(body.error ?? "failed to save picks");
      return;
    }
    setSaveMessage("saved");
  }

  const mondaySlot = slots.find((s) => s.id === "monday");

  return (
    <div className="ps-shell">
      <div className="ps-container">
        <div className="ps-header">
          <div>
            <div className="ps-title">week {week} pick sheet</div>
            <div className="ps-subtitle">
              {leagueName}
              {isPaid && <span className="ps-paid-badge">$ paid</span>}
            </div>
          </div>
        </div>

        <div className="ps-section-label">confidence points available</div>
        <ConfidencePool values={confidenceValues} usage={usage} />

        {slots.map((slot) => (
          <SlotGroup
            key={slot.id}
            slot={slot}
            onTogglePick={togglePick}
            onConfidenceChange={setConfidence}
            confidenceValues={confidenceValues}
            usage={usage}
          />
        ))}

        {mondaySlot && (
          <div className="ps-tiebreaker">
            <div>
              <div className="ps-tb-label">monday night tiebreaker</div>
              <div className="ps-tb-sub">
                predict total combined points
                {tiebreakerLocked && " (locked)"}
              </div>
            </div>
            <input
              type="number"
              className="ps-tb-input"
              value={tiebreaker}
              min={0}
              max={150}
              disabled={tiebreakerLocked}
              onChange={(e) => setTiebreaker(Number(e.target.value))}
            />
          </div>
        )}

        <div className="ps-bottom-bar">
          <div className="ps-score-display">
            week {week} points: <strong>{pointsSoFar}</strong> / {maxPossible} possible
            <br />
            <span className="ps-score-sub">
              {seasonRank ? `season rank: ${ordinal(seasonRank)}` : "season rank: —"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            {saveError && <div className="ps-auth-error">{saveError}</div>}
            {saveMessage && <div className="ps-auth-message">{saveMessage}</div>}
            <button
              type="button"
              className="ps-submit-btn"
              onClick={savePicks}
              disabled={saving}
            >
              {saving ? "saving…" : "save picks"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
