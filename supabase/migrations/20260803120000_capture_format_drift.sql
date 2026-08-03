-- Captures schema changes that were applied to prod ad-hoc (dashboard/MCP)
-- while the multi-format leagues feature was built, so the repo matches prod.
-- Everything here is idempotent; against current prod it is a no-op.

-- leagues: scoring format + weekly pot configuration
alter table public.leagues
  add column if not exists scoring_type text not null default 'ats_confidence',
  add column if not exists weekly_pot_type text not null default 'percentage',
  add column if not exists weekly_fixed_cents int;

-- picks: formats without confidence store null confidence; pick-5 pushes
-- earn 0.5, so points_earned must hold fractions
alter table public.picks
  alter column confidence drop not null,
  alter column picked_team drop not null;

do $$
begin
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'picks'
        and column_name = 'points_earned') <> 'numeric' then
    alter table public.picks
      alter column points_earned type numeric using points_earned::numeric;
  end if;
  if (select data_type from information_schema.columns
      where table_schema = 'public' and table_name = 'standings'
        and column_name = 'total_points') <> 'real' then
    alter table public.standings
      alter column total_points type real using total_points::real;
  end if;
end $$;

-- spread_history: line-movement snapshots recorded by the odds sync
create table if not exists public.spread_history (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  spread_home numeric not null,
  recorded_at timestamptz not null default now()
);

create index if not exists spread_history_game_idx
  on public.spread_history (game_id, recorded_at);

alter table public.spread_history enable row level security;

drop policy if exists spread_history_select on public.spread_history;
create policy spread_history_select
  on public.spread_history for select
  using (true);
