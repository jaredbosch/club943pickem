"use client";

import type { ConfidenceUsage, Game, SlotStatus, Team } from "./types";

type Props = {
  game: Game;
  slotStatus: SlotStatus;
  onTogglePick: (gameId: string) => void;
  onConfidenceChange?: (gameId: string, value: number) => void;
  confidenceValues?: number[];
  usage?: Map<number, ConfidenceUsage>;
};

export function GameRow({
  game,
  slotStatus,
  onTogglePick,
  onConfidenceChange,
  confidenceValues,
  usage,
}: Props) {
  const isLocked = slotStatus !== "open";
  const isRowLocked = slotStatus === "locked";

  return (
    <div className={`ps-game-row${isRowLocked ? " locked" : ""}`}>
      <ConfidenceCell
        game={game}
        slotStatus={slotStatus}
        onConfidenceChange={onConfidenceChange}
        confidenceValues={confidenceValues}
        usage={usage}
      />

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

function ConfidenceCell({
  game,
  slotStatus,
  onConfidenceChange,
  confidenceValues,
  usage,
}: {
  game: Game;
  slotStatus: SlotStatus;
  onConfidenceChange?: (gameId: string, value: number) => void;
  confidenceValues?: number[];
  usage?: Map<number, ConfidenceUsage>;
}) {
  // Locked/live slots: read-only badge.
  if (slotStatus !== "open" || !onConfidenceChange || !confidenceValues || !usage) {
    const confClass =
      slotStatus !== "open" && (game.result || game.liveScore)
        ? "ps-conf used"
        : "ps-conf";
    return <div className={confClass}>{game.confidence || "—"}</div>;
  }

  const current = game.confidence;
  const hasValue = current > 0;

  return (
    <div className={`ps-conf-select-wrap${hasValue ? " has-value" : ""}`}>
      <select
        className="ps-conf-select"
        aria-label="confidence"
        value={hasValue ? String(current) : ""}
        onChange={(e) =>
          onConfidenceChange(game.id, Number(e.target.value) || 0)
        }
      >
        <option value="">— pick</option>
        {confidenceValues.map((n) => {
          const u = usage.get(n);
          const isOwn = u?.gameId === game.id;
          const isTakenElsewhere = !!u && !isOwn;
          const label = isOwn
            ? `${n} ✓`
            : u
              ? `${n} · ${u.gameLabel}${u.locked ? " (locked)" : ""}`
              : `${n}`;
          return (
            <option key={n} value={String(n)} disabled={isTakenElsewhere}>
              {label}
            </option>
          );
        })}
      </select>
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
