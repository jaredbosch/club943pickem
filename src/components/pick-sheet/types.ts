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
  confidence: number | null;
  pickedTeam?: string;
  result?: PickResult;
  pointsEarned?: number;
  liveScore?: string;
  gameTime?: string;
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
