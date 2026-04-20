-- ============================================================
-- Club 943 Pick'em — initial schema
-- ============================================================

-- ------------------------------------------------------------
-- profiles (mirrors auth.users, created automatically on signup)
-- ------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  created_at    timestamptz not null default now()
);

-- auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- leagues
-- ------------------------------------------------------------
create table public.leagues (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  invite_code      text not null unique,
  commissioner_id  uuid not null references public.profiles (id),
  season           integer not null,
  entry_fee        numeric(6, 2) not null default 0,
  created_at       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- league_members
-- ------------------------------------------------------------
create table public.league_members (
  league_id  uuid not null references public.leagues (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  paid       boolean not null default false,
  joined_at  timestamptz not null default now(),
  primary key (league_id, user_id)
);

-- ------------------------------------------------------------
-- slots  (time-window groupings: Thursday Night, Sunday 1pm, etc.)
-- ------------------------------------------------------------
create table public.slots (
  id          uuid primary key default gen_random_uuid(),
  season      integer not null,
  week        integer not null,
  label       text not null,    -- display label, e.g. "thursday night"
  locks_at    timestamptz not null,
  created_at  timestamptz not null default now()
);

create index on public.slots (season, week);

-- ------------------------------------------------------------
-- games
-- ------------------------------------------------------------
create table public.games (
  id            uuid primary key default gen_random_uuid(),
  odds_api_id   text unique,    -- external ID from The Odds API
  slot_id       uuid not null references public.slots (id),
  away_team     text not null,  -- 3-letter abbr, e.g. "DEN"
  home_team     text not null,
  away_record   text,           -- e.g. "4-2"
  home_record   text,
  -- away spread: positive = away is underdog (e.g. +3.5), negative = away is favourite
  spread        numeric(5, 1) not null,
  kickoff_at    timestamptz not null,
  -- set after the game is final
  result        text check (result in ('away_covered', 'home_covered', 'push')),
  live_score    text,           -- e.g. "24-10" while in progress
  created_at    timestamptz not null default now()
);

create index on public.games (slot_id);
create index on public.games (kickoff_at);

-- ------------------------------------------------------------
-- picks
-- ------------------------------------------------------------
create table public.picks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  league_id     uuid not null references public.leagues (id) on delete cascade,
  game_id       uuid not null references public.games (id) on delete cascade,
  picked_team   text not null check (picked_team in ('away', 'home')),
  confidence    integer not null check (confidence between 1 and 16),
  -- populated by scoring job after game final
  result        text check (result in ('correct', 'incorrect', 'push')),
  points_earned integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, league_id, game_id)
);

create index on public.picks (user_id, league_id);
create index on public.picks (game_id);

-- keep updated_at current
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger picks_set_updated_at
  before update on public.picks
  for each row execute procedure public.set_updated_at();

-- ------------------------------------------------------------
-- tiebreakers  (one per user per league per week)
-- ------------------------------------------------------------
create table public.tiebreakers (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  league_id        uuid not null references public.leagues (id) on delete cascade,
  season           integer not null,
  week             integer not null,
  predicted_total  integer not null check (predicted_total >= 0),
  unique (user_id, league_id, season, week)
);

-- ------------------------------------------------------------
-- standings view  (total points per user per league)
-- ------------------------------------------------------------
create or replace view public.standings as
select
  p.user_id,
  p.league_id,
  pr.display_name,
  coalesce(sum(p.points_earned), 0)                                          as total_points,
  rank() over (
    partition by p.league_id
    order by coalesce(sum(p.points_earned), 0) desc
  )                                                                           as rank,
  count(*) filter (where p.result = 'correct')                               as correct_picks,
  count(*) filter (where p.result = 'incorrect')                             as incorrect_picks,
  count(*) filter (where p.result = 'push')                                  as push_picks
from public.picks p
join public.profiles pr on pr.id = p.user_id
group by p.user_id, p.league_id, pr.display_name;

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.profiles      enable row level security;
alter table public.leagues       enable row level security;
alter table public.league_members enable row level security;
alter table public.slots         enable row level security;
alter table public.games         enable row level security;
alter table public.picks         enable row level security;
alter table public.tiebreakers   enable row level security;

-- profiles
create policy "profiles: read all"
  on public.profiles for select
  to authenticated using (true);

create policy "profiles: update own"
  on public.profiles for update
  to authenticated using (auth.uid() = id);

-- leagues (members can read; anyone authed can create)
create policy "leagues: members can read"
  on public.leagues for select
  to authenticated using (
    exists (
      select 1 from public.league_members lm
      where lm.league_id = id and lm.user_id = auth.uid()
    )
  );

create policy "leagues: create"
  on public.leagues for insert
  to authenticated with check (commissioner_id = auth.uid());

create policy "leagues: commissioner can update"
  on public.leagues for update
  to authenticated using (commissioner_id = auth.uid());

-- league_members
create policy "league_members: members can read"
  on public.league_members for select
  to authenticated using (
    exists (
      select 1 from public.league_members lm2
      where lm2.league_id = league_id and lm2.user_id = auth.uid()
    )
  );

create policy "league_members: join"
  on public.league_members for insert
  to authenticated with check (user_id = auth.uid());

create policy "league_members: commissioner can update"
  on public.league_members for update
  to authenticated using (
    exists (
      select 1 from public.leagues l
      where l.id = league_id and l.commissioner_id = auth.uid()
    )
  );

-- slots & games: any authenticated user can read (public fixture data)
create policy "slots: read"
  on public.slots for select
  to authenticated using (true);

create policy "games: read"
  on public.games for select
  to authenticated using (true);

-- picks: own picks always; other members' picks readable after slot locks
create policy "picks: read own"
  on public.picks for select
  to authenticated using (user_id = auth.uid());

create policy "picks: read league (locked slots only)"
  on public.picks for select
  to authenticated using (
    exists (
      select 1 from public.league_members lm
      where lm.league_id = picks.league_id and lm.user_id = auth.uid()
    )
    and exists (
      select 1 from public.games g
      join public.slots s on s.id = g.slot_id
      where g.id = game_id and s.locks_at <= now()
    )
  );

create policy "picks: insert own"
  on public.picks for insert
  to authenticated with check (
    user_id = auth.uid()
    -- slot must still be open
    and exists (
      select 1 from public.games g
      join public.slots s on s.id = g.slot_id
      where g.id = game_id and s.locks_at > now()
    )
  );

create policy "picks: update own (open slot)"
  on public.picks for update
  to authenticated using (
    user_id = auth.uid()
    and exists (
      select 1 from public.games g
      join public.slots s on s.id = g.slot_id
      where g.id = game_id and s.locks_at > now()
    )
  );

-- tiebreakers: own only
create policy "tiebreakers: read own"
  on public.tiebreakers for select
  to authenticated using (user_id = auth.uid());

create policy "tiebreakers: upsert own"
  on public.tiebreakers for insert
  to authenticated with check (user_id = auth.uid());

create policy "tiebreakers: update own"
  on public.tiebreakers for update
  to authenticated using (user_id = auth.uid());
