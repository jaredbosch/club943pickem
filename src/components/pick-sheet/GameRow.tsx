"use client";

import type { Game, SlotStatus } from "./types";

type Props = {
  game: Game;
  slotStatus: SlotStatus;
  onPickTeam: (gameId: string, team: string) => void;
  onConfidenceChange?: (gameId: string, value: number) => void;
  totalGames?: number;
  usedConfidence?: Set<number>;
};

export function GameRow({
  game,
  slotStatus,
  onPickTeam,
  onConfidenceChange,
  totalGames = 16,
  usedConfidence = new Set(),
}: Props) {
  const isOpen = slotStatus === "open";
  const isLocked = slotStatus === "locked";

  return (
    <div className={`ps-game-row2${isLocked ? " locked" : ""}`}>
      {/* Confidence */}
      <div className="ps-conf-col">
        {isOpen && onConfidenceChange ? (
          <label className="ps-conf-btn" title="Assign confidence points">
            <span className="ps-conf-num">{game.confidence ?? "–"}</span>
            <span className="ps-conf-label">pts</span>
            <select
              className="ps-conf-overlay-select"
              value={game.confidence ?? ""}
              onChange={(e) => onConfidenceChange(game.id, parseInt(e.target.value))}
            >
              <option value="" disabled>–</option>
              {Array.from({ length: totalGames }, (_, i) => totalGames - i).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        ) : (
          <div className={`ps-conf-static${game.result === "correct" ? " correct" : game.result === "incorrect" ? " incorrect" : ""}`}>
            <span className="ps-conf-num">{game.confidence ?? "–"}</span>
            <span className="ps-conf-label">pts</span>
          </div>
        )}
      </div>

      {/* Team pick buttons or locked display */}
      {isOpen ? (
        <div className="ps-team-picks">
          <button
            type="button"
            className={`ps-team-btn${game.pickedTeam === game.away.abbr ? " picked" : ""}`}
            onClick={() => onPickTeam(game.id, game.away.abbr)}
          >
            <span className="ps-team-btn-abbr">{game.away.abbr}</span>
            <span className="ps-team-btn-spread">{game.away.spread}</span>
          </button>
          <span className="ps-vs">vs</span>
          <button
            type="button"
            className={`ps-team-btn${game.pickedTeam === game.home.abbr ? " picked" : ""}`}
            onClick={() => onPickTeam(game.id, game.home.abbr)}
          >
            <span className="ps-team-btn-abbr">{game.home.abbr}</span>
            <span className="ps-team-btn-spread">{game.home.spread}</span>
          </button>
        </div>
      ) : (
        <div className="ps-matchup-locked">
          <LockedTeamRow
            abbr={game.away.abbr}
            spread={game.away.spread}
            picked={game.pickedTeam === game.away.abbr}
            result={game.pickedTeam === game.away.abbr ? game.result : undefined}
          />
          <LockedTeamRow
            abbr={game.home.abbr}
            spread={game.home.spread}
            picked={game.pickedTeam === game.home.abbr}
            result={game.pickedTeam === game.home.abbr ? game.result : undefined}
          />
        </div>
      )}

      {/* Result / score */}
      <ResultCell game={game} slotStatus={slotStatus} />
    </div>
  );
}

function LockedTeamRow({
  abbr,
  spread,
  picked,
  result,
}: {
  abbr: string;
  spread: string;
  picked: boolean;
  result?: string;
}) {
  const cls = picked
    ? result === "correct"
      ? "ps-locked-team correct"
      : result === "incorrect"
        ? "ps-locked-team incorrect"
        : "ps-locked-team picked"
    : "ps-locked-team";

  return (
    <div className={cls}>
      <span className="ps-locked-abbr">{abbr}</span>
      <span className="ps-locked-spread">{spread}</span>
      {picked && result === "correct" && <span className="ps-pick-mark">✓</span>}
      {picked && result === "incorrect" && <span className="ps-pick-mark">✗</span>}
      {picked && result === "push" && <span className="ps-pick-mark">P</span>}
    </div>
  );
}

function ResultCell({ game, slotStatus }: { game: Game; slotStatus: SlotStatus }) {
  if (slotStatus === "locked") {
    if (game.result === "correct")
      return <div className="ps-result-col ps-pts-earned">+{game.pointsEarned ?? game.confidence}</div>;
    if (game.result === "incorrect")
      return <div className="ps-result-col ps-pts-zero">0</div>;
    if (game.result === "push")
      return <div className="ps-result-col ps-pts-push">–</div>;
    return <div className="ps-result-col ps-pts-zero" />;
  }
  if (slotStatus === "live" && game.liveScore)
    return <div className="ps-result-live">{game.liveScore}</div>;
  return <div className="ps-result-pending" />;
}
