export type LeagueStatus = "draft" | "open" | "active" | "completed";

export type TimeSlot =
  | "thursday"
  | "intl"
  | "sunday_early"
  | "sunday_late"
  | "sunday_night"
  | "monday";

export type GameStatus = "scheduled" | "locked" | "in_progress" | "final";

export type PayoutType = "weekly" | "season";
export type PayoutStatus = "owed" | "distributed";

// All user ids are uuids from Supabase auth.users.
export type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type LeagueRow = {
  id: string;
  name: string;
  invite_code: string;
  commissioner_id: string;
  season_year: number;
  entry_fee_cents: number;
  max_players: number;
  weekly_pool_pct: number;
  season_pool_pct: number;
  status: LeagueStatus;
  created_at: string;
  updated_at: string;
};

export type LeagueMemberRow = {
  id: string;
  user_id: string;
  league_id: string;
  is_paid: boolean;
  paid_at: string | null;
  is_commissioner: boolean;
  joined_at: string;
};

export type GameRow = {
  id: string;
  external_id: string | null;
  week: number;
  season_year: number;
  home_team: string;
  away_team: string;
  kickoff_time: string;
  time_slot: TimeSlot;
  spread_home: number | null;
  locked_spread_home: number | null;
  home_score: number | null;
  away_score: number | null;
  status: GameStatus;
  created_at: string;
  updated_at: string;
};

export type PickRow = {
  id: string;
  user_id: string;
  league_id: string;
  game_id: string;
  week: number;
  picked_team: string;
  confidence: number;
  is_locked: boolean;
  is_correct: boolean | null;
  points_earned: number;
  created_at: string;
  updated_at: string;
};

export type MnfTiebreakerRow = {
  id: string;
  user_id: string;
  league_id: string;
  week: number;
  predicted_total: number;
  actual_total: number | null;
  difference: number | null;
  is_locked: boolean;
  created_at: string;
  updated_at: string;
};

export type StandingsRow = {
  id: string;
  user_id: string;
  league_id: string;
  week: number;
  total_points: number;
  correct_picks: number;
  rank: number | null;
  updated_at: string;
};

export type PayoutRow = {
  id: string;
  league_id: string;
  user_id: string;
  week: number | null;
  amount_cents: number;
  payout_type: PayoutType;
  is_distributed: boolean;
  status: PayoutStatus;
  created_at: string;
  updated_at: string;
};
