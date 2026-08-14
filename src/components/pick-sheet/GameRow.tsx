"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Game, SlotStatus, PickResult } from "./types";
import { teamColor } from "@/lib/nfl-colors";

type GlobalPct = { awayPct: number; homePct: number; total: number };

type Props = {
  game: Game;
  slotStatus: SlotStatus;
  onPickTeam: (gameId: string, team: string) => void;
  onConfidenceChange?: (gameId: string, value: number) => void;
  totalGames?: number;
  usedConfidenceMap?: Map<number, string>;
  isPickerOpen?: boolean;
  onOpenPicker?: (id: string | null) => void;
  scheduleOnly?: boolean;
  showConfidence?: boolean;
  showSpread?: boolean;
  globalPct?: GlobalPct;
  spreadHistory?: { spread: number; date: string }[];
};

// Picks close 5 minutes before the posted kickoff, matching lock_slots().
const LOCK_LEAD_MS = 5 * 60_000;

function formatCountdown(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60_000));
  if (mins < 1) return "<1M";
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}D ${h}H`;
  if (h > 0) return `${h}H ${m}M`;
  return `${m}M`;
}

// Kickoff rendered in the viewer's timezone, e.g. "THU 5:00P MST".
function formatLocalKickoff(iso: string): string {
  const d = new Date(iso);
  const day = d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
  const time = d
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(" AM", "A").replace(" PM", "P");
  const tz = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
    .formatToParts(d).find((p) => p.type === "timeZoneName")?.value ?? "";
  return tz ? `${day} ${time} ${tz}` : `${day} ${time}`;
}

export function GameRow({
  game,
  slotStatus,
  onPickTeam,
  onConfidenceChange,
  totalGames = 16,
  usedConfidenceMap,
  isPickerOpen = false,
  onOpenPicker,
  scheduleOnly = false,
  showConfidence = true,
  showSpread = true,
  globalPct,
  spreadHistory,
}: Props) {
  // Client clock — null until mounted so SSR output stays deterministic.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // Per-game lock state. The game's own status is authoritative; the posted
  // kickoff time is the client-side guard so a game locks on schedule even if
  // the status cron lags. Sample data (no status) falls back to slot status.
  const kickoffMs = game.kickoffIso ? Date.parse(game.kickoffIso) : null;
  const lockMs = kickoffMs != null && !isNaN(kickoffMs) ? kickoffMs - LOCK_LEAD_MS : null;
  const kickoffPassed = now != null && lockMs != null && now >= lockMs;
  const hasGameStatus = game.status !== undefined;

  const isLive = hasGameStatus ? game.status === "in_progress" : slotStatus === "live";
  const isFinal = game.status === "final";
  const isOpen = !scheduleOnly && !kickoffPassed && (
    hasGameStatus ? game.status === "scheduled" : slotStatus === "open"
  );
  const isLockedPending = !isOpen && !isLive && !isFinal && !scheduleOnly;

  const localTime = now != null && game.kickoffIso ? formatLocalKickoff(game.kickoffIso) : null;
  const countdownMs = isOpen && now != null && lockMs != null ? lockMs - now : null;
  const showCountdown = countdownMs != null && countdownMs < 48 * 3600_000;
  const countdownSoon = countdownMs != null && countdownMs < 3600_000;

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
    <div className={`pp-pick-row${!isOpen ? " locked" : ""}${isLive ? " game-live" : ""}${isLockedPending ? " game-locked" : ""}${isFinal ? " game-final" : ""}${hasPick ? " has-pick" : ""}${resultCls}${warnCls}`}>
      <div className={`pp-pick-inner${!showConfidence ? " schedule-only" : ""}`}>

        {/* Left: confidence rail — hidden for future weeks or non-confidence leagues */}
        {showConfidence && (
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
        )}

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
            {(localTime ?? game.gameTime) && (
              <span className="pp-pick-meta-time" suppressHydrationWarning>{localTime ?? game.gameTime}</span>
            )}
            {game.network && <span className="pp-pick-meta-net">{game.network}</span>}
            {game.isPrimetime && <span className="pp-pick-meta-prime">★ PRIME</span>}
            {globalPct && (
              <span className="pp-pick-meta-pct-wrap">
                <span className={`pp-pick-meta-pct${globalPct.awayPct >= 50 ? " pop" : ""}`}>{globalPct.awayPct}%</span>
                <span className="pp-pick-meta-pct-sep">·</span>
                <span className={`pp-pick-meta-pct${globalPct.homePct >= 50 ? " pop" : ""}`}>{globalPct.homePct}%</span>
              </span>
            )}
            {spreadHistory && spreadHistory.length >= 2 && (() => {
              const open = spreadHistory[0].spread;
              const current = spreadHistory[spreadHistory.length - 1].spread;
              const diff = current - open;
              if (Math.abs(diff) < 0.5) return null;
              const moved = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
              const dir = diff > 0 ? "▲" : "▼";
              const color = diff > 0 ? "var(--bad)" : "var(--good)";
              return (
                <span className="pp-pick-meta-movement" title={`Opened ${open > 0 ? "+" : ""}${open}`}>
                  <span style={{ color }}>{dir}</span>
                  {Math.abs(diff).toFixed(1)} from {open > 0 ? "+" : ""}{open}
                </span>
              );
            })()}
            <span className="pp-pick-meta-spacer" />
            {!isOpen && game.result === "correct" && (
              <span className="pp-pick-meta-won">+{game.pointsEarned ?? conf} pts</span>
            )}
            {!isOpen && game.result === "incorrect" && (
              <span className="pp-pick-meta-lost">0 pts</span>
            )}
            {showCountdown && (
              <span className={`pp-pick-meta-countdown${countdownSoon ? " soon" : ""}`} suppressHydrationWarning>
                LOCKS IN {formatCountdown(countdownMs!)}
              </span>
            )}
            {isLive && <span className="pp-pick-meta-live">● LIVE</span>}
            {isLockedPending && <span className="pp-pick-meta-lockedtag">LOCKED</span>}
            {isFinal && <span className="pp-pick-meta-finaltag">FINAL</span>}
          </div>

          <div className="pp-pick-teams">
            <TeamSide
              game={game}
              abbr={game.away.abbr}
              side="away"
              picked={pickedAway}
              result={pickedAway ? game.result : undefined}
              locked={!isOpen}
              showSpread={showSpread}
              onClick={() => isOpen && onPickTeam(game.id, game.away.abbr)}
            />

            <div className="pp-pick-at">
              {(isLive || isFinal) && game.liveScore ? (
                <>
                  <div className="pp-pick-live-center">{game.liveScore}</div>
                  {isLive && game.clock && <div className="pp-pick-clock">{game.clock}</div>}
                </>
              ) : (
                <div className="pp-pick-at-vs">@</div>
              )}
            </div>

            <TeamSide
              game={game}
              abbr={game.home.abbr}
              side="home"
              picked={pickedHome}
              result={pickedHome ? game.result : undefined}
              locked={!isOpen}
              showSpread={showSpread}
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
  showSpread = true,
  onClick,
}: {
  game: Game;
  abbr: string;
  side: "away" | "home";
  picked: boolean;
  result?: PickResult;
  locked: boolean;
  showSpread?: boolean;
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
        {picked && <span className="pp-pick-check">✓</span>}
      </div>
      <div className="pp-pick-team-info">
        <span className="pp-pick-abbr">{abbr}</span>
        <span className="pp-pick-record">{side === "away" ? game.away.record : game.home.record}</span>
        {showSpread && spread && spread !== "+0.0" && spread !== "-0.0" ? (
          <span className="pp-pick-spread">{spread}</span>
        ) : null}
      </div>
    </button>
  );
}
