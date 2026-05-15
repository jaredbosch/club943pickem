import type { Slot } from "./types";
import { GameRow } from "./GameRow";

type Props = {
  slot: Slot;
  onPickTeam: (gameId: string, team: string) => void;
  onConfidenceChange?: (gameId: string, value: number) => void;
  totalGames?: number;
  usedConfidenceMap?: Map<number, string>;
  openPickerId?: string | null;
  onOpenPicker?: (id: string | null) => void;
  scheduleOnly?: boolean;
};

export function SlotGroup({ slot, onPickTeam, onConfidenceChange, totalGames = 16, usedConfidenceMap, openPickerId, onOpenPicker, scheduleOnly = false }: Props) {
  return (
    <div className="ps-slot-group">
      <div className="ps-slot-header">
        <span className="ps-slot-label">{slot.label}</span>
        <span className="ps-slot-spacer" />
        {scheduleOnly
          ? <span className="ps-slot-status open">scheduled</span>
          : <span className={`ps-slot-status ${slot.status}`}>{slot.statusText}</span>
        }
        {!scheduleOnly && slot.countdown && <span className="ps-countdown">{slot.countdown}</span>}
      </div>
      {slot.games.map((game) => (
        <GameRow
          key={game.id}
          game={game}
          slotStatus={slot.status}
          onPickTeam={onPickTeam}
          onConfidenceChange={onConfidenceChange}
          totalGames={totalGames}
          usedConfidenceMap={usedConfidenceMap}
          isPickerOpen={openPickerId === game.id}
          onOpenPicker={onOpenPicker}
          scheduleOnly={scheduleOnly}
        />
      ))}
    </div>
  );
}
