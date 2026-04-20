-- Initial schema for Club 943 Pick'em.
-- Spec: nfl-pickem-product-spec.docx §5.1.
--
-- `public.users.id` is the Supabase auth user id — a trigger on `auth.users`
-- keeps `public.users` in sync on signup.

create extension if not exists pgcrypto;

-- Enums -----------------------------------------------------------------

create type time_slot as enum (
  'thursday',
  'intl',
  'sunday_early',
  'sunday_late',
  'sunday_night',
  'monday'
);

create type league_status as enum ('draft', 'open', 'active', 'completed');

create type game_status as enum ('scheduled', 'locked', 'in_progress', 'final');

create type payout_type as enum ('weekly', 'season');

create type payout_status as enum ('owed', 'distributed');

-- Helpers ---------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 6-char alphanumeric invite code, ambiguous chars removed.
create or replace function public.gen_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

-- Tables ----------------------------------------------------------------

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default public.gen_invite_code(),
  commissioner_id uuid not null references public.users (id) on delete restrict,
  season_year int not null,
  entry_fee_cents int not null default 30000,
  max_players int not null default 50,
  weekly_pool_pct numeric(5,4) not null default 0.36,
  season_pool_pct numeric(5,4) not null default 0.64,
  status league_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pool_pct_sums_to_one
    check (weekly_pool_pct + season_pool_pct = 1)
);

create index leagues_commissioner_idx on public.leagues (commissioner_id);
create index leagues_status_idx on public.leagues (status);

create trigger leagues_set_updated_at
  before update on public.leagues
  for each row execute function public.set_updated_at();

create table public.league_members (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  is_paid boolean not null default false,
  paid_at timestamptz,
  is_commissioner boolean not null default false,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (league_id, user_id)
);

create index league_members_user_idx on public.league_members (user_id);
create index league_members_league_idx on public.league_members (league_id);

create trigger league_members_set_updated_at
  before update on public.league_members
  for each row execute function public.set_updated_at();

create table public.games (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  week int not null check (week between 1 and 22),
  season_year int not null,
  home_team text not null,
  away_team text not null,
  kickoff_time timestamptz not null,
  time_slot time_slot not null,
  spread_home numeric(4,1),
  locked_spread_home numeric(4,1),
  home_score int,
  away_score int,
  status game_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index games_week_season_idx on public.games (season_year, week);
create index games_kickoff_idx on public.games (kickoff_time);
create index games_status_idx on public.games (status);

create trigger games_set_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

create table public.picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  league_id uuid not null references public.leagues (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  -- Denormalised so the unique confidence constraint works without a join.
  week int not null,
  picked_team text not null,
  confidence int not null check (confidence between 1 and 22),
  is_locked boolean not null default false,
  is_correct boolean,
  points_earned int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, league_id, game_id),
  unique (user_id, league_id, week, confidence)
);

create index picks_user_league_week_idx
  on public.picks (user_id, league_id, week);
create index picks_game_idx on public.picks (game_id);

create trigger picks_set_updated_at
  before update on public.picks
  for each row execute function public.set_updated_at();

create table public.mnf_tiebreakers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  league_id uuid not null references public.leagues (id) on delete cascade,
  week int not null check (week between 1 and 22),
  predicted_total int not null check (predicted_total >= 0),
  actual_total int,
  difference int,
  is_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, league_id, week)
);

create index mnf_tiebreakers_league_week_idx
  on public.mnf_tiebreakers (league_id, week);

create trigger mnf_tiebreakers_set_updated_at
  before update on public.mnf_tiebreakers
  for each row execute function public.set_updated_at();

create table public.standings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  league_id uuid not null references public.leagues (id) on delete cascade,
  -- 0 = season total, otherwise NFL week number.
  week int not null check (week between 0 and 22),
  total_points int not null default 0,
  correct_picks int not null default 0,
  rank int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, league_id, week)
);

create index standings_league_week_rank_idx
  on public.standings (league_id, week, rank);

create trigger standings_set_updated_at
  before update on public.standings
  for each row execute function public.set_updated_at();

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  week int check (week between 1 and 22),
  amount_cents int not null check (amount_cents >= 0),
  payout_type payout_type not null,
  is_distributed boolean not null default false,
  status payout_status not null default 'owed',
  distributed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payout_week_matches_type check (
    (payout_type = 'weekly' and week is not null)
    or (payout_type = 'season' and week is null)
  )
);

create index payouts_league_idx on public.payouts (league_id);
create index payouts_user_idx on public.payouts (user_id);

create trigger payouts_set_updated_at
  before update on public.payouts
  for each row execute function public.set_updated_at();

-- Auth sync -------------------------------------------------------------

-- Create a public.users row whenever a new auth.users row is inserted.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- League join RPC -------------------------------------------------------

create or replace function public.join_league_by_code(_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _league_id uuid;
  _uid uuid := auth.uid();
begin
  if _uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select id into _league_id
  from public.leagues
  where invite_code = upper(_code)
    and status in ('open', 'active');

  if _league_id is null then
    raise exception 'Invalid invite code' using errcode = 'P0002';
  end if;

  insert into public.league_members (league_id, user_id)
  values (_league_id, _uid)
  on conflict (league_id, user_id) do nothing;

  return _league_id;
end;
$$;

revoke all on function public.join_league_by_code(text) from public;
grant execute on function public.join_league_by_code(text) to authenticated;

-- League creation RPC: creates league and makes caller commissioner in
-- the same transaction.
create or replace function public.create_league(
  _name text,
  _season_year int,
  _entry_fee_cents int default 30000,
  _max_players int default 50,
  _weekly_pool_pct numeric default 0.36,
  _season_pool_pct numeric default 0.64
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _league_id uuid;
  _uid uuid := auth.uid();
begin
  if _uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  insert into public.leagues (
    name, commissioner_id, season_year,
    entry_fee_cents, max_players,
    weekly_pool_pct, season_pool_pct
  )
  values (
    _name, _uid, _season_year,
    _entry_fee_cents, _max_players,
    _weekly_pool_pct, _season_pool_pct
  )
  returning id into _league_id;

  insert into public.league_members (league_id, user_id, is_commissioner)
  values (_league_id, _uid, true);

  return _league_id;
end;
$$;

revoke all on function public.create_league(text, int, int, int, numeric, numeric) from public;
grant execute on function public.create_league(text, int, int, int, numeric, numeric) to authenticated;
