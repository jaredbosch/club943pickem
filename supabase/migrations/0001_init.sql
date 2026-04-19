-- Club 943 Pick'em — Phase 1 schema
-- Tables follow §5 of nfl-pickem-product-spec.docx.

-- Enums -------------------------------------------------------------------

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

-- Users -------------------------------------------------------------------
-- Shadow table for auth.users. A trigger (below) auto-creates a row for
-- every new Supabase auth user so that FKs can point here instead of
-- directly at auth.users.
create table users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  display_name  text,
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function handle_new_auth_user() returns trigger as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.users.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function handle_new_auth_user();

-- Leagues -----------------------------------------------------------------
create table leagues (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  invite_code       text unique not null,
  commissioner_id   uuid not null references users(id) on delete restrict,
  season_year       int  not null,
  entry_fee_cents   int  not null default 30000,
  max_players       int  not null default 50,
  weekly_pool_pct   numeric(5,2) not null default 36.00,
  season_pool_pct   numeric(5,2) not null default 64.00,
  status            league_status not null default 'open',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index leagues_commissioner_idx on leagues(commissioner_id);

-- League members ---------------------------------------------------------
create table league_members (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  league_id        uuid not null references leagues(id) on delete cascade,
  is_paid          boolean not null default false,
  paid_at          timestamptz,
  is_commissioner  boolean not null default false,
  joined_at        timestamptz not null default now(),
  unique (user_id, league_id)
);

create index league_members_league_idx on league_members(league_id);

-- Games -------------------------------------------------------------------
create table games (
  id                   uuid primary key default gen_random_uuid(),
  external_id          text unique,
  week                 int not null,
  season_year          int not null,
  home_team            text not null,
  away_team            text not null,
  kickoff_time         timestamptz not null,
  time_slot            time_slot not null,
  spread_home          numeric(5,2),
  locked_spread_home   numeric(5,2),
  home_score           int,
  away_score           int,
  status               game_status not null default 'scheduled',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index games_week_idx on games(season_year, week);
create index games_slot_idx on games(season_year, week, time_slot);
create index games_kickoff_idx on games(kickoff_time);

-- Picks -------------------------------------------------------------------
create table picks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  league_id       uuid not null references leagues(id) on delete cascade,
  game_id         uuid not null references games(id) on delete cascade,
  picked_team     text not null,
  confidence      int  not null check (confidence >= 1),
  is_locked       boolean not null default false,
  is_correct      boolean,
  points_earned   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, league_id, game_id)
);

-- Confidence values must be unique per user/league/week. We enforce by
-- storing the week on the pick row (denormalised from games) to avoid a
-- partial index referencing a joined table.
alter table picks add column week int not null default 0;
create unique index picks_conf_unique
  on picks(user_id, league_id, week, confidence);
create index picks_league_week_idx on picks(league_id, week);

-- MNF tiebreakers ---------------------------------------------------------
create table mnf_tiebreakers (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  league_id        uuid not null references leagues(id) on delete cascade,
  week             int  not null,
  predicted_total  int  not null,
  actual_total     int,
  difference       int,
  is_locked        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, league_id, week)
);

-- Standings ---------------------------------------------------------------
-- week = 0 indicates season total.
create table standings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  league_id      uuid not null references leagues(id) on delete cascade,
  week           int  not null,
  total_points   int  not null default 0,
  correct_picks  int  not null default 0,
  rank           int,
  updated_at     timestamptz not null default now(),
  unique (user_id, league_id, week)
);

create index standings_league_week_idx on standings(league_id, week);

-- Payouts -----------------------------------------------------------------
create table payouts (
  id              uuid primary key default gen_random_uuid(),
  league_id       uuid not null references leagues(id) on delete cascade,
  user_id         uuid not null references users(id) on delete cascade,
  week            int,
  amount_cents    int not null,
  payout_type     payout_type not null,
  is_distributed  boolean not null default false,
  status          payout_status not null default 'owed',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index payouts_league_idx on payouts(league_id);

-- updated_at trigger ------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_users_updated        before update on users         for each row execute function set_updated_at();
create trigger trg_leagues_updated      before update on leagues       for each row execute function set_updated_at();
create trigger trg_games_updated        before update on games         for each row execute function set_updated_at();
create trigger trg_picks_updated        before update on picks         for each row execute function set_updated_at();
create trigger trg_tiebreakers_updated  before update on mnf_tiebreakers for each row execute function set_updated_at();
create trigger trg_standings_updated    before update on standings     for each row execute function set_updated_at();
create trigger trg_payouts_updated      before update on payouts       for each row execute function set_updated_at();

-- RLS ---------------------------------------------------------------------
-- All app traffic goes through authenticated server routes that use the
-- service-role client; we enable RLS with a default-deny posture so that
-- the anon key can't accidentally read/write league data.
alter table users            enable row level security;
alter table leagues          enable row level security;
alter table league_members   enable row level security;
alter table games            enable row level security;
alter table picks            enable row level security;
alter table mnf_tiebreakers  enable row level security;
alter table standings        enable row level security;
alter table payouts          enable row level security;
