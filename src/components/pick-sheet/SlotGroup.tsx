import type { Slot } from "./types";
import { GameRow } from "./GameRow";

type Props = {
  slot: Slot;
  onTogglePick: (gameId: string) => void;
};

export function SlotGroup({ slot, onTogglePick }: Props) {
  return (
    <div className="ps-slot-group">
      <div className="ps-slot-header">
        <span className="ps-slot-label">{slot.label}</span>
        <div>
          <span className={`ps-slot-status ${slot.status}`}>
            {slot.statusText}
          </span>
          {slot.countdown && (
            <span className="ps-countdown">{slot.countdown}</span>
          )}
        </div>
      </div>
      {slot.games.map((game) => (
        <GameRow
          key={game.id}
          game={game}
          slotStatus={slot.status}
          onTogglePick={onTogglePick}
        />
      ))}
    </div>
  );
}
