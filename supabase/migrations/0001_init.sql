-- Club 943 Pick'em — initial schema (spec §5)
-- users.id is the Clerk user ID (e.g. "user_abc123") so RLS can key off auth.jwt()->>'sub'.

set search_path = public;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type league_status as enum ('draft', 'open', 'active', 'completed');
create type time_slot as enum (
  'thursday',
  'intl',
  'sunday_early',
  'sunday_late',
  'sunday_night',
  'monday'
);
create type game_status as enum ('scheduled', 'locked', 'in_progress', 'final');
create type payout_type as enum ('weekly', 'season');
create type payout_status as enum ('owed', 'distributed');

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- users — synced from Clerk via /api/webhooks/clerk
-- ---------------------------------------------------------------------------

create table users (
  id text primary key,
  email text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
before update on users
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- leagues
-- ---------------------------------------------------------------------------

create table leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  commissioner_id text not null references users(id) on delete restrict,
  season_year int not null,
  entry_fee_cents int not null default 30000,
  max_players int not null default 50,
  weekly_pool_pct numeric(5, 2) not null default 36.00,
  season_pool_pct numeric(5, 2) not null default 64.00,
  status league_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leagues_invite_code_format check (invite_code ~ '^[A-Z0-9]{6}$'),
  constraint leagues_pool_pct_sums_100 check (weekly_pool_pct + season_pool_pct = 100.00)
);

create index leagues_commissioner_id_idx on leagues (commissioner_id);
create index leagues_status_idx on leagues (status);

create trigger leagues_set_updated_at
before update on leagues
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- league_members
-- ---------------------------------------------------------------------------

create table league_members (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  league_id uuid not null references leagues(id) on delete cascade,
  is_paid boolean not null default false,
  paid_at timestamptz,
  is_commissioner boolean not null default false,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, league_id)
);

create index league_members_user_id_idx on league_members (user_id);
create index league_members_league_id_idx on league_members (league_id);

create trigger league_members_set_updated_at
before update on league_members
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- games — populated from The Odds API (spec §8)
-- ---------------------------------------------------------------------------

create table games (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  week int not null check (week between 1 and 18),
  season_year int not null,
  home_team text not null,
  away_team text not null,
  kickoff_time timestamptz not null,
  time_slot time_slot not null,
  spread_home numeric(4, 1),
  locked_spread_home numeric(4, 1),
  home_score int,
  away_score int,
  status game_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index games_week_season_idx on games (season_year, week);
create index games_kickoff_time_idx on games (kickoff_time);
create index games_status_idx on games (status);

create trigger games_set_updated_at
before update on games
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- picks
-- (week is denormalized from games so we can enforce
--  unique (user_id, league_id, week, confidence))
-- ---------------------------------------------------------------------------

create table picks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  league_id uuid not null references leagues(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  week int not null check (week between 1 and 18),
  picked_team text not null,
  confidence int not null check (confidence between 1 and 18),
  is_locked boolean not null default false,
  is_correct boolean,
  is_push boolean not null default false,
  points_earned int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, league_id, game_id),
  unique (user_id, league_id, week, confidence)
);

create index picks_user_league_week_idx on picks (user_id, league_id, week);
create index picks_game_id_idx on picks (game_id);

create trigger picks_set_updated_at
before update on picks
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- mnf_tiebreakers
-- ---------------------------------------------------------------------------

create table mnf_tiebreakers (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  league_id uuid not null references leagues(id) on delete cascade,
  week int not null check (week between 1 and 18),
  predicted_total int not null check (predicted_total >= 0),
  actual_total int,
  difference int,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, league_id, week)
);

create index mnf_tiebreakers_league_week_idx on mnf_tiebreakers (league_id, week);

create trigger mnf_tiebreakers_set_updated_at
before update on mnf_tiebreakers
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- standings (week = 0 means season total)
-- ---------------------------------------------------------------------------

create table standings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references users(id) on delete cascade,
  league_id uuid not null references leagues(id) on delete cascade,
  week int not null check (week between 0 and 18),
  total_points int not null default 0,
  correct_picks int not null default 0,
  rank int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, league_id, week)
);

create index standings_league_week_rank_idx on standings (league_id, week, rank);

create trigger standings_set_updated_at
before update on standings
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- payouts
-- ---------------------------------------------------------------------------

create table payouts (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references leagues(id) on delete cascade,
  user_id text not null references users(id) on delete restrict,
  week int check (week is null or week between 1 and 18),
  amount_cents int not null check (amount_cents > 0),
  payout_type payout_type not null,
  status payout_status not null default 'owed',
  is_distributed boolean not null default false,
  distributed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payouts_weekly_has_week
    check ((payout_type = 'weekly' and week is not null)
        or (payout_type = 'season' and week is null))
);

create index payouts_league_status_idx on payouts (league_id, status);
create index payouts_user_id_idx on payouts (user_id);

create trigger payouts_set_updated_at
before update on payouts
for each row execute function set_updated_at();
