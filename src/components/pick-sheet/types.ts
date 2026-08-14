export type SlotStatus = "locked" | "live" | "open";

export type PickResult = "correct" | "incorrect" | "push";

export type Team = {
  abbr: string;
  record: string;
  spread: string;
};

export type GameStatus = "scheduled" | "locked" | "in_progress" | "final";

export type Game = {
  id: string;
  away: Team;
  home: Team;
  confidence: number | null;
  pickedTeam?: string;
  result?: PickResult;
  pointsEarned?: number;
  liveScore?: string;
  clock?: string;
  gameTime?: string;
  kickoffIso?: string;
  status?: GameStatus;
  network?: string;
  isPrimetime?: boolean;
};

export type Slot = {
  id: string;
  label: string;
  status: SlotStatus;
  statusText: string;
  countdown?: string;
  games: Game[];
};
