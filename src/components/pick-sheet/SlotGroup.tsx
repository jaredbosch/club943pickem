import type { Slot } from "./types";
import { GameRow } from "./GameRow";

type Props = {
  slot: Slot;
  onPickTeam: (gameId: string, team: string) => void;
  onConfidenceChange?: (gameId: string, value: number) => void;
  totalGames?: number;
  usedConfidence?: Set<number>;
};

export function SlotGroup({
  slot,
  onPickTeam,
  onConfidenceChange,
  totalGames = 16,
  usedConfidence = new Set(),
}: Props) {
  return (
    <div className="ps-slot-group">
      <div className="ps-slot-header">
        <span className="ps-slot-label">{slot.label}</span>
        <div>
          <span className={`ps-slot-status ${slot.status}`}>{slot.statusText}</span>
          {slot.countdown && <span className="ps-countdown">{slot.countdown}</span>}
        </div>
      </div>
      {slot.games.map((game) => (
        <GameRow
          key={game.id}
          game={game}
          slotStatus={slot.status}
          onPickTeam={onPickTeam}
          onConfidenceChange={onConfidenceChange}
          totalGames={totalGames}
          usedConfidence={usedConfidence}
        />
      ))}
    </div>
  );
}
