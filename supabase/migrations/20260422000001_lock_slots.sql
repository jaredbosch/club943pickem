-- Slot-locking routine. Spec §2.3: picks lock 5 minutes before kickoff.
--
-- Called by the /api/cron/lock-slots route on a short cadence (every 5 min).
-- SECURITY DEFINER so a service-role caller (which already bypasses RLS) and
-- any future authenticated invocation path run against a fixed search_path.

create or replace function public.lock_slots()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  _threshold timestamptz := now() + interval '5 minutes';
  _games_locked int;
  _picks_locked int;
  _tiebreakers_locked int;
begin
  -- 1. Flip scheduled games whose kickoff is within the threshold. Snapshot
  --    the current spread so scoring uses the number that was live when the
  --    slot closed, not whatever drifts in afterward.
  with locked as (
    update public.games
    set status = 'locked',
        locked_spread_home = coalesce(locked_spread_home, spread_home)
    where status = 'scheduled'
      and kickoff_time <= _threshold
    returning 1
  )
  select count(*) into _games_locked from locked;

  -- 2. Lock picks on any game at/past the threshold. Keyed on kickoff_time
  --    (not status) so a transient failure in step 1 doesn't leave picks
  --    editable after kickoff.
  with locked as (
    update public.picks p
    set is_locked = true
    from public.games g
    where p.game_id = g.id
      and p.is_locked = false
      and g.kickoff_time <= _threshold
    returning 1
  )
  select count(*) into _picks_locked from locked;

  -- 3. Lock MNF tiebreakers once any Monday game in the same (week, season)
  --    hits the threshold. Tiebreakers don't carry season_year themselves —
  --    we source it from the owning league.
  with locked as (
    update public.mnf_tiebreakers m
    set is_locked = true
    from public.leagues l
    where m.league_id = l.id
      and m.is_locked = false
      and exists (
        select 1 from public.games g
        where g.time_slot = 'monday'
          and g.week = m.week
          and g.season_year = l.season_year
          and g.kickoff_time <= _threshold
      )
    returning 1
  )
  select count(*) into _tiebreakers_locked from locked;

  return json_build_object(
    'games_locked', _games_locked,
    'picks_locked', _picks_locked,
    'tiebreakers_locked', _tiebreakers_locked
  );
end;
$$;

-- Service-role only. Do not grant to authenticated; the cron route uses the
-- admin client and RLS is bypassed there.
revoke all on function public.lock_slots() from public;
