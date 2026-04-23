"use client";

import Link from "next/link";
import { SlotGroup } from "./SlotGroup";
import { week7Slots } from "./week7-data";
import type { Slot } from "./types";

const WEEK = 7;
const WEEKS_NAV = [6, 7, 8];

type Props = {
  playerName: string;
};

const noop = () => {};

export function ReadOnlyPickSheet({ playerName }: Props) {
  return (
    <div className="ps-shell">
      <div className="ps-container">
        <div className="ps-header">
          <div>
            <Link href="/dashboard" className="dash-back-link">← Standings</Link>
            <div className="ps-title" style={{ marginTop: "4px" }}>{playerName}</div>
            <div className="ps-subtitle">week {WEEK} picks · view only</div>
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

        {week7Slots.map((slot) =>
          slot.status === "open" ? (
            <div key={slot.id} className="ps-slot-group">
              <div className="ps-slot-header">
                <span className="ps-slot-label">{slot.label}</span>
                <span className="ps-slot-status open">{slot.statusText}</span>
              </div>
              <div className="dash-picks-hidden">
                Picks hidden until this slot locks
              </div>
            </div>
          ) : (
            <SlotGroup key={slot.id} slot={slot} onPickTeam={noop} />
          )
        )}
      </div>
    </div>
  );
}
