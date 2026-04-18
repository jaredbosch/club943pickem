"use client";

import { useState } from "react";
import { ConfidencePool } from "./ConfidencePool";
import { SlotGroup } from "./SlotGroup";
import { week7Slots } from "./week7-data";
import type { Slot } from "./types";

const WEEK = 7;
const WEEKS_NAV = [6, 7, 8];

export function PickSheet() {
  const [slots, setSlots] = useState<Slot[]>(week7Slots);
  const [tiebreaker, setTiebreaker] = useState(44);

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

  return (
    <div className="ps-shell">
      <div className="ps-container">
        <div className="ps-header">
          <div>
            <div className="ps-title">week {WEEK} pick sheet</div>
            <div className="ps-subtitle">
              Jared&apos;s ATS League{" "}
              <span className="ps-paid-badge">$ paid</span> — 47/50 picks in
            </div>
          </div>
          <div className="ps-week-nav">
            {WEEKS_NAV.map((w) => (
              <button
                key={w}
                type="button"
                className={`ps-week-btn${w === WEEK ? " active" : ""}`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <ConfidencePool />

        {slots.map((slot) => (
          <SlotGroup key={slot.id} slot={slot} onTogglePick={togglePick} />
        ))}

        <div className="ps-tiebreaker">
          <div>
            <div className="ps-tb-label">monday night tiebreaker</div>
            <div className="ps-tb-sub">
              predict total combined points (TB @ ARI)
            </div>
          </div>
          <input
            type="number"
            className="ps-tb-input"
            value={tiebreaker}
            min={0}
            max={150}
            onChange={(e) => setTiebreaker(Number(e.target.value))}
          />
        </div>

        <div className="ps-bottom-bar">
          <div className="ps-score-display">
            week {WEEK} points: <strong>16</strong> / 136 possible
            <br />
            <span className="ps-score-sub">season rank: 4th of 50</span>
          </div>
          <button type="button" className="ps-submit-btn">
            save picks
          </button>
        </div>

      </div>
    </div>
  );
}
