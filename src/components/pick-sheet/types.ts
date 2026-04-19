export type SlotStatus = "locked" | "live" | "open";

export type PickResult = "correct" | "incorrect" | "push";

export type Team = {
  abbr: string;
  record: string;
  spread: string;
};

export type Game = {
  id: string;
  away: Team;
  home: Team;
  confidence: number;
  pickedTeam?: string;
  result?: PickResult;
  pointsEarned?: number;
  liveScore?: string;
};

export type Slot = {
  id: string;
  label: string;
  status: SlotStatus;
  statusText: string;
  countdown?: string;
  games: Game[];
};

/**
 * How a given confidence value is being used. `locked` = assigned inside
 * an already-locked slot, so it can't be freed by the player.
 */
export type ConfidenceUsage = {
  gameId: string;
  gameLabel: string; // e.g. "DAL@DET"
  locked: boolean;
};
