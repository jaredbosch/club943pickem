"use client";

import type { Game, SlotStatus, PickResult } from "./types";
import { teamColor } from "@/lib/nfl-colors";

type Props = {
  game: Game;
  slotStatus: SlotStatus;
  onPickTeam: (gameId: string, team: string) => void;
  onConfidenceChange?: (gameId: string, value: number) => void;
  totalGames?: number;
};

export function GameRow({ game, slotStatus, onPickTeam, onConfidenceChange, totalGames = 16 }: Props) {
  const isOpen = slotStatus === "open";
  const hasPick = !!game.pickedTeam;
  const conf = game.confidence;
  const isHighConf = hasPick && conf !== null && conf >= 13;

  const pickedAway = game.pickedTeam === game.away.abbr;
  const pickedHome = game.pickedTeam === game.home.abbr;

  function handleRank(delta: number) {
    if (!onConfidenceChange || conf === null) return;
    const next = conf + delta;
    if (next < 1 || next > totalGames) return;
    onConfidenceChange(game.id, next);
  }

  return (
    <div className={`pp-pick-row${!isOpen ? " locked" : ""}${hasPick ? " has-pick" : ""}`}>
      <div className="pp-pick-inner">

        {/* Left: confidence rail */}
        <div className={`pp-pick-conf${hasPick ? " has-pick" : ""}${isHighConf ? " high" : ""}`}>
          <div className="pp-pick-conf-num">{conf ?? "—"}</div>
          <div className="pp-pick-conf-tag">CONF</div>
        </div>

        {/* Center: meta strip + team sides */}
        <div className="pp-pick-center">
          <div className="pp-pick-meta">
            {game.gameTime && <span className="pp-pick-meta-time">{game.gameTime}</span>}
            {game.network && <span className="pp-pick-meta-net">{game.network}</span>}
            <span className="pp-pick-meta-label">SPREAD</span>
            <span className="pp-pick-meta-val">{game.home.spread}</span>
            <span className="pp-pick-meta-spacer" />
            {game.isPrimetime && <span className="pp-pick-meta-prime">★ PRIME</span>}
            {!isOpen && game.result === "correct" && (
              <span className="pp-pick-meta-won">🔒 +{game.pointsEarned ?? conf}</span>
            )}
            {!isOpen && game.result === "incorrect" && (
              <span className="pp-pick-meta-lost">🔒 0 pts</span>
            )}
            {slotStatus === "live" && game.liveScore && (
              <span className="pp-pick-meta-live">{game.liveScore}</span>
            )}
          </div>

          <div className="pp-pick-teams">
            <TeamSide
              game={game}
              abbr={game.away.abbr}
              spread={game.away.spread}
              side="away"
              picked={pickedAway}
              result={pickedAway ? game.result : undefined}
              locked={!isOpen}
              onClick={() => isOpen && onPickTeam(game.id, game.away.abbr)}
            />
            <div className="pp-pick-at">@</div>
            <TeamSide
              game={game}
              abbr={game.home.abbr}
              spread={game.home.spread}
              side="home"
              picked={pickedHome}
              result={pickedHome ? game.result : undefined}
              locked={!isOpen}
              onClick={() => isOpen && onPickTeam(game.id, game.home.abbr)}
            />
          </div>
        </div>

        {/* Right: rank buttons */}
        <div className="pp-pick-rank">
          {isOpen && onConfidenceChange ? (
            <>
              <button
                type="button"
                className="pp-pick-rank-btn"
                onClick={() => handleRank(1)}
                disabled={conf === null || conf >= totalGames}
                title="More confident"
              >▲</button>
              <span className="pp-pick-rank-label">RANK</span>
              <button
                type="button"
                className="pp-pick-rank-btn"
                onClick={() => handleRank(-1)}
                disabled={conf === null || conf <= 1}
                title="Less confident"
              >▼</button>
            </>
          ) : (
            <span className="pp-pick-rank-label">
              {!isOpen ? "LOCKED" : "RANK"}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}

function TeamSide({
  game,
  abbr,
  spread,
  side,
  picked,
  result,
  locked,
  onClick,
}: {
  game: Game;
  abbr: string;
  spread: string;
  side: "away" | "home";
  picked: boolean;
  result?: PickResult;
  locked: boolean;
  onClick: () => void;
}) {
  const color = teamColor(abbr);
  const gradDir = side === "away" ? "90deg" : "270deg";
  const logoGradient = `linear-gradient(145deg, ${color}, color-mix(in oklab, ${color} 70%, #000))`;
  const pickedBg = `linear-gradient(${gradDir}, color-mix(in oklab, ${color} 28%, transparent), color-mix(in oklab, ${color} 8%, transparent))`;

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
        <span className="pp-pick-spread">{spread}</span>
      </div>
      {picked && (
        <span className="pp-pick-result-mark">
          {result === "correct" ? "✓" : result === "incorrect" ? "✗" : result === "push" ? "P" : null}
        </span>
      )}
    </button>
  );
}
