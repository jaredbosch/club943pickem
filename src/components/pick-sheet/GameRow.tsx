"use client";

import type { Game, SlotStatus, Team } from "./types";

type Props = {
  game: Game;
  slotStatus: SlotStatus;
  onTogglePick: (gameId: string) => void;
};

export function GameRow({ game, slotStatus, onTogglePick }: Props) {
  const isLocked = slotStatus !== "open";
  const isRowLocked = slotStatus === "locked";

  const confClass =
    isLocked && (game.result || game.liveScore)
      ? "ps-conf used"
      : slotStatus === "open"
        ? "ps-conf unlocked"
        : "ps-conf";

  return (
    <div className={`ps-game-row${isRowLocked ? " locked" : ""}`}>
      <div className={confClass}>{game.confidence}</div>

      <div className="ps-matchup">
        <TeamRow team={game.away} />
        <TeamRow team={game.home} />
      </div>

      <PickButton
        game={game}
        slotStatus={slotStatus}
        onClick={() => onTogglePick(game.id)}
      />

      <ResultCell game={game} slotStatus={slotStatus} />
    </div>
  );
}

function TeamRow({ team }: { team: Team }) {
  return (
    <div className="ps-team-row">
      <span className="ps-team-name">{team.abbr}</span>
      <span className="ps-team-record">{team.record}</span>
      <span className="ps-spread">{team.spread}</span>
    </div>
  );
}

function PickButton({
  game,
  slotStatus,
  onClick,
}: {
  game: Game;
  slotStatus: SlotStatus;
  onClick: () => void;
}) {
  const isLocked = slotStatus !== "open";

  if (slotStatus === "locked") {
    if (game.result === "push") {
      return <div className="ps-pick-btn push-state locked">PUSH</div>;
    }
    if (game.result === "correct") {
      return (
        <div className="ps-pick-btn correct locked">{game.pickedTeam} ✓</div>
      );
    }
    if (game.result === "incorrect") {
      return (
        <div className="ps-pick-btn incorrect locked">{game.pickedTeam} ✗</div>
      );
    }
  }

  const classes = ["ps-pick-btn"];
  if (game.pickedTeam) classes.push("selected");
  if (isLocked) classes.push("locked");

  const label = game.pickedTeam ?? game.away.abbr;

  if (isLocked) {
    return <div className={classes.join(" ")}>{label}</div>;
  }
  return (
    <button type="button" className={classes.join(" ")} onClick={onClick}>
      {label}
    </button>
  );
}

function ResultCell({
  game,
  slotStatus,
}: {
  game: Game;
  slotStatus: SlotStatus;
}) {
  if (slotStatus === "locked") {
    if (game.result === "correct") {
      return (
        <div className="ps-result-col ps-pts-earned">
          +{game.pointsEarned ?? game.confidence}
        </div>
      );
    }
    if (game.result === "incorrect") {
      return <div className="ps-result-col ps-pts-zero">0</div>;
    }
    if (game.result === "push") {
      return <div className="ps-result-col ps-pts-push">0</div>;
    }
  }
  if (slotStatus === "live" && game.liveScore) {
    return <div className="ps-result-live">{game.liveScore}</div>;
  }
  return <div className="ps-result-pending">—</div>;
}
