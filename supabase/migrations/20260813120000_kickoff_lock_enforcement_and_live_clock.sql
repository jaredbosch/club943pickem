-- 1. Live-clock columns. sync-scores writes ESPN's period + display clock so
--    the UI can show "Q2 4:32" next to live scores.
alter table public.games
  add column if not exists period smallint,
  add column if not exists display_clock text;

-- 2. Kickoff-based write gate on picks. is_locked is flipped by lock_slots(),
--    but that runs on a cron cadence — if it stalls, picks would stay editable
--    after kickoff (RLS only checked is_locked). Add a hard gate on the posted
--    kickoff time so a pick can never be written once its game's slot closes
--    (5 minutes before kickoff, matching lock_slots).
create or replace function public.game_is_open(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.games g
    where g.id = p_game_id
      and g.status = 'scheduled'
      and g.kickoff_time - interval '5 minutes' > now()
  );
$$;

revoke all on function public.game_is_open(uuid) from public;
grant execute on function public.game_is_open(uuid) to authenticated;

drop policy if exists picks_insert_own_unlocked on public.picks;
create policy picks_insert_own_unlocked
  on public.picks for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and is_locked = false
    and public.is_league_member(league_id)
    and public.game_is_open(game_id)
  );

drop policy if exists picks_update_own_unlocked on public.picks;
create policy picks_update_own_unlocked
  on public.picks for update
  to authenticated
  using (user_id = (select auth.uid()) and is_locked = false)
  with check (
    user_id = (select auth.uid())
    and is_locked = false
    and public.game_is_open(game_id)
  );

drop policy if exists picks_delete_own_unlocked on public.picks;
create policy picks_delete_own_unlocked
  on public.picks for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and is_locked = false
    and public.game_is_open(game_id)
  );
