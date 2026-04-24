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
  const isLive = slotStatus === "live";
  const hasPick = !!game.pickedTeam;
  const conf = game.confidence;
  const isHighConf = hasPick && conf !== null && conf >= 13;

  const pickedAway = game.pickedTeam === game.away.abbr;
  const pickedHome = game.pickedTeam === game.home.abbr;

  const resultCls = game.result === "correct" ? " result-correct"
    : game.result === "incorrect" ? " result-incorrect"
    : "";

  return (
    <div className={`pp-pick-row${!isOpen ? " locked" : ""}${hasPick ? " has-pick" : ""}${resultCls}`}>
      <div className="pp-pick-inner">

        {/* Left: confidence rail with select overlay for open games */}
        <div className={`pp-pick-conf${hasPick ? " has-pick" : ""}${isHighConf ? " high" : ""}`}>
          <div className="pp-pick-conf-num">{conf ?? "—"}</div>
          <div className="pp-pick-conf-tag">CONF</div>
          {isOpen && onConfidenceChange && (
            <select
              className="pp-pick-conf-select"
              value={conf ?? ""}
              onChange={(e) => onConfidenceChange(game.id, Number(e.target.value))}
              title="Set confidence"
            >
              <option value="" disabled>—</option>
              {Array.from({ length: totalGames }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          )}
        </div>

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

            {/* Center: spread + live score, or @ for open games */}
            <div className="pp-pick-at">
              <div className="pp-pick-spread-center">{game.home.spread}</div>
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
        <span className="pp-pick-record">{side === "away" ? game.away.record : game.home.record}</span>
      </div>
    </button>
  );
}
