"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import type { Game, SlotStatus, PickResult } from "./types";
import { teamColor } from "@/lib/nfl-colors";

type Props = {
  game: Game;
  slotStatus: SlotStatus;
  onPickTeam: (gameId: string, team: string) => void;
  onConfidenceChange?: (gameId: string, value: number) => void;
  totalGames?: number;
  usedConfidenceMap?: Map<number, string>;
  isPickerOpen?: boolean;
  onOpenPicker?: (id: string | null) => void;
};

export function GameRow({
  game,
  slotStatus,
  onPickTeam,
  onConfidenceChange,
  totalGames = 16,
  usedConfidenceMap,
  isPickerOpen = false,
  onOpenPicker,
}: Props) {
  const isOpen = slotStatus === "open";
  const isLive = slotStatus === "live";
  const hasPick = !!game.pickedTeam;
  const conf = game.confidence;
  const isHighConf = hasPick && conf !== null && conf >= Math.ceil(totalGames * 0.8);

  const pickedAway = game.pickedTeam === game.away.abbr;
  const pickedHome = game.pickedTeam === game.home.abbr;
  const canOpenPicker = isOpen && !!onConfidenceChange && !!onOpenPicker;

  const confRailRef = useRef<HTMLDivElement>(null);
  const pickerCoordsRef = useRef<{ top: number; left: number } | null>(null);

  function handleConfClick() {
    if (!canOpenPicker) return;
    if (!isPickerOpen) {
      const rect = confRailRef.current?.getBoundingClientRect();
      if (rect) {
        pickerCoordsRef.current = { top: rect.top, left: rect.right + 8 };
      }
      onOpenPicker!(game.id);
    } else {
      onOpenPicker!(null);
    }
  }

  const resultCls = game.result === "correct" ? " result-correct"
    : game.result === "incorrect" ? " result-incorrect"
    : "";
  const warnCls = hasPick && conf === null && !game.result ? " warn-no-conf" : "";

  const coords = pickerCoordsRef.current;

  return (
    <div className={`pp-pick-row${!isOpen ? " locked" : ""}${hasPick ? " has-pick" : ""}${resultCls}${warnCls}`}>
      <div className="pp-pick-inner">

        {/* Left: confidence rail */}
        <div
          ref={confRailRef}
          className={`pp-pick-conf${hasPick ? " has-pick" : ""}${isHighConf ? " high" : ""}${canOpenPicker ? " clickable" : ""}`}
          onClick={handleConfClick}
          role={canOpenPicker ? "button" : undefined}
          tabIndex={canOpenPicker ? 0 : undefined}
          onKeyDown={(e) => { if (canOpenPicker && (e.key === "Enter" || e.key === " ")) handleConfClick(); }}
        >
          <div className="pp-pick-conf-num">{conf ?? "—"}</div>
          <div className="pp-pick-conf-tag">{canOpenPicker ? "TAP ▾" : "CONF"}</div>
        </div>

        {/* Confidence picker — rendered in a portal to avoid overflow clipping */}
        {isPickerOpen && canOpenPicker && coords && createPortal(
          <>
            <div
              className="pp-conf-picker-backdrop"
              onClick={() => onOpenPicker!(null)}
            />
            <div
              className="pp-conf-picker"
              style={{ top: coords.top, left: coords.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pp-conf-picker-title">SET CONFIDENCE · 1–{totalGames}</div>
              <div className="pp-conf-picker-legend">
                <span className="pp-conf-legend-avail">available</span>
                <span className="pp-conf-legend-used">taken — tap to steal</span>
              </div>
              <div className="pp-conf-picker-grid">
                {Array.from({ length: totalGames }, (_, i) => totalGames - i).map((n) => {
                  const usedBy = usedConfidenceMap?.get(n);
                  const isCurrent = n === conf;
                  const isUsedByOther = !!usedBy && !isCurrent;
                  return (
                    <button
                      key={n}
                      type="button"
                      className={`pp-conf-chip${isCurrent ? " current" : isUsedByOther ? " used" : " avail"}`}
                      onClick={() => {
                        onConfidenceChange!(game.id, n);
                        onOpenPicker!(null);
                      }}
                    >
                      <span className="pp-conf-chip-num">{n}</span>
                      {isUsedByOther && <span className="pp-conf-chip-owner">{usedBy}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </>,
          document.body,
        )}

        {/* Center: meta strip + team sides */}
        <div className="pp-pick-center">
          <div className="pp-pick-meta">
            {game.gameTime && <span className="pp-pick-meta-time">{game.gameTime}</span>}
            {game.network && <span className="pp-pick-meta-net">{game.network}</span>}
            {game.isPrimetime && <span className="pp-pick-meta-prime">★ PRIME</span>}
            <span className="pp-pick-meta-spacer" />
            {!isOpen && game.result === "correct" && (
              <span className="pp-pick-meta-won">+{game.pointsEarned ?? conf} pts</span>
            )}
            {!isOpen && game.result === "incorrect" && (
              <span className="pp-pick-meta-lost">0 pts</span>
            )}
            {isLive && <span className="pp-pick-meta-live">LIVE</span>}
          </div>

          <div className="pp-pick-teams">
            <TeamSide
              game={game}
              abbr={game.away.abbr}
              side="away"
              picked={pickedAway}
              result={pickedAway ? game.result : undefined}
              locked={!isOpen}
              onClick={() => isOpen && onPickTeam(game.id, game.away.abbr)}
            />

            <div className="pp-pick-at">
              {isLive && game.liveScore
                ? <div className="pp-pick-live-center">{game.liveScore}</div>
                : <div className="pp-pick-at-vs">@</div>
              }
            </div>

            <TeamSide
              game={game}
              abbr={game.home.abbr}
              side="home"
              picked={pickedHome}
              result={pickedHome ? game.result : undefined}
              locked={!isOpen}
              onClick={() => isOpen && onPickTeam(game.id, game.home.abbr)}
            />
          </div>
        </div>

      </div>
    </div>
  );
}

function TeamSide({
  game,
  abbr,
  side,
  picked,
  result,
  locked,
  onClick,
}: {
  game: Game;
  abbr: string;
  side: "away" | "home";
  picked: boolean;
  result?: PickResult;
  locked: boolean;
  onClick: () => void;
}) {
  const color = teamColor(abbr);
  const gradDir = side === "away" ? "90deg" : "270deg";
  const logoGradient = `linear-gradient(145deg, ${color}, color-mix(in oklab, ${color} 70%, #000))`;
  const pickedBg = `linear-gradient(${gradDir}, color-mix(in oklab, ${color} 50%, transparent), color-mix(in oklab, ${color} 18%, transparent))`;
  const spread = side === "away" ? game.away.spread : game.home.spread;

  const resultCls = result === "correct" ? " correct" : result === "incorrect" ? " incorrect" : "";

  return (
    <button
      type="button"
      className={`pp-pick-side ${side}${picked ? " picked" : ""}${locked ? " locked" : ""}${resultCls}`}
      onClick={onClick}
      style={{ background: picked ? pickedBg : "transparent" }}
    >
      {picked && (
        <div className="pp-pick-side-edge" style={{ background: color }} />
      )}
      <div className="pp-pick-logo" style={{ background: logoGradient }}>
        {abbr}
      </div>
      <div className="pp-pick-team-info">
        <span className="pp-pick-abbr">{abbr}</span>
        <span className="pp-pick-record">{side === "away" ? game.away.record : game.home.record}</span>
        {spread && spread !== "PK" && spread !== "+0.0" && spread !== "-0.0" ? (
          <span className="pp-pick-spread">{spread}</span>
        ) : spread === "PK" ? (
          <span className="pp-pick-spread">PK</span>
        ) : null}
      </div>
    </button>
  );
}
