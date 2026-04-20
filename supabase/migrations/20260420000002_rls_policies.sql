-- Row Level Security policies for Club 943 Pick'em.
--
-- Design:
--   * Authenticated users see their own row plus rows from leagues they
--     belong to.
--   * Games are shared across all leagues and readable by any authenticated
--     user; writes go through the service role (cron, odds sync).
--   * Picks / tiebreakers are writable only before the row is locked.
--   * Standings and payouts are service-role writable; commissioners can
--     mark payouts distributed.
--
-- Service role bypasses RLS by default so admin/cron clients are unaffected.

-- Helper functions. SECURITY DEFINER so policies can reference
-- league_members without recursing through its own RLS.

create or replace function public.is_league_member(_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.league_members
    where league_id = _league_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_league_commissioner(_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.league_members
    where league_id = _league_id
      and user_id = auth.uid()
      and is_commissioner = true
  );
$$;

grant execute on function public.is_league_member(uuid) to authenticated;
grant execute on function public.is_league_commissioner(uuid) to authenticated;

-- Enable RLS ------------------------------------------------------------

alter table public.users enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.games enable row level security;
alter table public.picks enable row level security;
alter table public.mnf_tiebreakers enable row level security;
alter table public.standings enable row level security;
alter table public.payouts enable row level security;

-- users -----------------------------------------------------------------

create policy users_select_authenticated
  on public.users for select
  to authenticated
  using (true);

create policy users_update_self
  on public.users for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- leagues ---------------------------------------------------------------

create policy leagues_select_members
  on public.leagues for select
  to authenticated
  using (public.is_league_member(id));

-- Use the create_league() RPC. Direct inserts require the caller to
-- set themselves as commissioner.
create policy leagues_insert_self_commissioner
  on public.leagues for insert
  to authenticated
  with check (commissioner_id = auth.uid());

create policy leagues_update_commissioner
  on public.leagues for update
  to authenticated
  using (public.is_league_commissioner(id))
  with check (public.is_league_commissioner(id));

create policy leagues_delete_commissioner
  on public.leagues for delete
  to authenticated
  using (public.is_league_commissioner(id));

-- league_members --------------------------------------------------------

create policy league_members_select_same_league
  on public.league_members for select
  to authenticated
  using (public.is_league_member(league_id));

-- Players join via the join_league_by_code RPC. Direct inserts only allow
-- inserting yourself, which matches the RPC's effect.
create policy league_members_insert_self
  on public.league_members for insert
  to authenticated
  with check (user_id = auth.uid());

create policy league_members_update_commissioner
  on public.league_members for update
  to authenticated
  using (public.is_league_commissioner(league_id))
  with check (public.is_league_commissioner(league_id));

create policy league_members_delete_self_or_commissioner
  on public.league_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_league_commissioner(league_id)
  );

-- games -----------------------------------------------------------------

create policy games_select_authenticated
  on public.games for select
  to authenticated
  using (true);

-- No INSERT/UPDATE/DELETE policies; writes must use the service role.

-- picks -----------------------------------------------------------------

-- Own picks always visible. Other league members' picks visible once the
-- slot has locked.
create policy picks_select_own_or_locked_leaguemate
  on public.picks for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      is_locked = true
      and public.is_league_member(league_id)
    )
  );

create policy picks_insert_own_unlocked
  on public.picks for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and is_locked = false
    and public.is_league_member(league_id)
  );

create policy picks_update_own_unlocked
  on public.picks for update
  to authenticated
  using (user_id = auth.uid() and is_locked = false)
  with check (user_id = auth.uid() and is_locked = false);

create policy picks_delete_own_unlocked
  on public.picks for delete
  to authenticated
  using (user_id = auth.uid() and is_locked = false);

-- mnf_tiebreakers -------------------------------------------------------

create policy tiebreakers_select_own_or_locked_leaguemate
  on public.mnf_tiebreakers for select
  to authenticated
  using (
    user_id = auth.uid()
    or (
      is_locked = true
      and public.is_league_member(league_id)
    )
  );

create policy tiebreakers_insert_own_unlocked
  on public.mnf_tiebreakers for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and is_locked = false
    and public.is_league_member(league_id)
  );

create policy tiebreakers_update_own_unlocked
  on public.mnf_tiebreakers for update
  to authenticated
  using (user_id = auth.uid() and is_locked = false)
  with check (user_id = auth.uid() and is_locked = false);

create policy tiebreakers_delete_own_unlocked
  on public.mnf_tiebreakers for delete
  to authenticated
  using (user_id = auth.uid() and is_locked = false);

-- standings -------------------------------------------------------------

create policy standings_select_league_members
  on public.standings for select
  to authenticated
  using (public.is_league_member(league_id));

-- Writes via service role only.

-- payouts ---------------------------------------------------------------

create policy payouts_select_league_members
  on public.payouts for select
  to authenticated
  using (public.is_league_member(league_id));

create policy payouts_update_commissioner
  on public.payouts for update
  to authenticated
  using (public.is_league_commissioner(league_id))
  with check (public.is_league_commissioner(league_id));

-- Inserts and deletes via service role only.
