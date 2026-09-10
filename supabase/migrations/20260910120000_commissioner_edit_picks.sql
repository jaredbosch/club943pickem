-- Commissioner pick editing.
--
-- leagues.commissioner_can_edit has existed since 20260507 and the
-- commissioner panel has toggled it (and the FAQ has promised it) ever since,
-- but nothing ever read it: every picks / tiebreaker policy required
-- user_id = auth.uid(), so a commissioner could not write a member's picks
-- from any client. This migration wires the flag up.
--
--   * commissioner_can_edit_picks(league)  — caller is that league's
--     commissioner AND the league has the toggle on.
--   * can_write_picks_for(league, user)     — caller is that user, or the
--     above holds and `user` is a member of the league.
--   * picks + tiebreaker_guesses policies use can_write_picks_for() for
--     writes, still behind is_locked / pick_window_open, so "pre-deadline
--     only" is enforced by the database, not the UI.
--   * SELECT widens so a commissioner with the toggle on can read members'
--     unlocked picks — editing requires seeing, and the upsert/delete paths
--     reference the existing row.
--   * picks.edited_by records who last wrote the row when it was not the
--     row's owner (set by trigger from auth.uid(); service-role writes such
--     as grading leave it untouched).
--   * set_pick_confidence gains an optional p_user_id so the Pick 5 rank
--     RPC can act on a member's pick under the same rule.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.commissioner_can_edit_picks(_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.league_members lm
    join public.leagues l on l.id = lm.league_id
    where lm.league_id = _league_id
      and lm.user_id = (select auth.uid())
      and lm.is_commissioner = true
      and l.commissioner_can_edit = true
  );
$$;

revoke all on function public.commissioner_can_edit_picks(uuid) from public, anon;
grant execute on function public.commissioner_can_edit_picks(uuid) to authenticated;

create or replace function public.can_write_picks_for(_league_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select _user_id = (select auth.uid())
      or (
        public.commissioner_can_edit_picks(_league_id)
        and exists (
          select 1 from public.league_members lm
          where lm.league_id = _league_id and lm.user_id = _user_id
        )
      );
$$;

revoke all on function public.can_write_picks_for(uuid, uuid) from public, anon;
grant execute on function public.can_write_picks_for(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Audit column
-- ---------------------------------------------------------------------------

alter table public.picks
  add column if not exists edited_by uuid references public.users (id) on delete set null;

comment on column public.picks.edited_by is
  'Set when the last write came from someone other than the pick owner (commissioner edit). NULL when the owner wrote it last. Service-role writes (grading, lock_slots) leave it untouched.';

create or replace function public.picks_track_editor()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  -- No JWT (service role / cron / grading): not a user edit, leave as-is.
  if v_actor is null then
    return new;
  end if;
  if v_actor <> new.user_id then
    new.edited_by := v_actor;
  else
    new.edited_by := null;
  end if;
  return new;
end;
$$;

revoke execute on function public.picks_track_editor() from public, anon, authenticated;

drop trigger if exists picks_track_editor on public.picks;
create trigger picks_track_editor
  before insert or update on public.picks
  for each row execute function public.picks_track_editor();

-- ---------------------------------------------------------------------------
-- picks policies
-- ---------------------------------------------------------------------------

drop policy if exists picks_select_own_or_locked_leaguemate on public.picks;
create policy picks_select_own_or_locked_leaguemate
  on public.picks for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      is_locked = true
      and public.is_league_member(league_id)
    )
    or public.commissioner_can_edit_picks(league_id)
  );

drop policy if exists picks_insert_own_unlocked on public.picks;
create policy picks_insert_own_unlocked
  on public.picks for insert
  to authenticated
  with check (
    public.can_write_picks_for(league_id, user_id)
    and is_locked = false
    and public.is_league_member(league_id)
    and public.pick_window_open(league_id, game_id)
  );

drop policy if exists picks_update_own_unlocked on public.picks;
create policy picks_update_own_unlocked
  on public.picks for update
  to authenticated
  using (public.can_write_picks_for(league_id, user_id) and is_locked = false)
  with check (
    public.can_write_picks_for(league_id, user_id)
    and is_locked = false
    and public.pick_window_open(league_id, game_id)
  );

drop policy if exists picks_delete_own_unlocked on public.picks;
create policy picks_delete_own_unlocked
  on public.picks for delete
  to authenticated
  using (
    public.can_write_picks_for(league_id, user_id)
    and is_locked = false
    and public.pick_window_open(league_id, game_id)
  );

-- ---------------------------------------------------------------------------
-- tiebreaker_guesses policies
-- ---------------------------------------------------------------------------

drop policy if exists tiebreaker_select on public.tiebreaker_guesses;
create policy tiebreaker_select
  on public.tiebreaker_guesses for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      public.is_league_member(league_id)
      and exists (
        select 1 from public.games g
        where g.id = tiebreaker_guesses.game_id
          and g.status in ('in_progress', 'final')
      )
    )
    or public.commissioner_can_edit_picks(league_id)
  );

drop policy if exists tiebreaker_insert on public.tiebreaker_guesses;
create policy tiebreaker_insert
  on public.tiebreaker_guesses for insert
  to authenticated
  with check (
    public.can_write_picks_for(league_id, user_id)
    and public.is_league_member(league_id)
    and exists (
      select 1 from public.games g
      where g.id = tiebreaker_guesses.game_id and g.status = 'scheduled'
    )
  );

drop policy if exists tiebreaker_update on public.tiebreaker_guesses;
create policy tiebreaker_update
  on public.tiebreaker_guesses for update
  to authenticated
  using (
    public.can_write_picks_for(league_id, user_id)
    and exists (
      select 1 from public.games g
      where g.id = tiebreaker_guesses.game_id and g.status = 'scheduled'
    )
  );

-- ---------------------------------------------------------------------------
-- set_pick_confidence: optional target user.
--
-- Same body as 20260821120000 with auth.uid() replaced by v_user. The 3-arg
-- overload is dropped rather than kept alongside: PostgREST resolves RPCs by
-- named parameters, and a 3-arg call would match both signatures.
-- ---------------------------------------------------------------------------

drop function if exists public.set_pick_confidence(uuid, uuid, integer);

create or replace function public.set_pick_confidence(
  p_league_id uuid,
  p_game_id   uuid,
  p_value     integer,
  p_user_id   uuid default null
)
returns void
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_user    uuid := coalesce(p_user_id, (select auth.uid()));
  v_week    int;
  v_season  int;
  v_updated int;
  v_holder  uuid;
  v_locked  boolean;
  v_target_locked boolean;
  v_scoring text;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Acting on someone else's pick requires commissioner edit rights. The
  -- UPDATEs below are RLS-gated too; this just turns a silent zero-row update
  -- into a readable error.
  if v_user <> (select auth.uid()) and not public.can_write_picks_for(p_league_id, v_user) then
    raise exception 'not allowed to edit picks for this user' using errcode = '42501';
  end if;

  if p_value is not null and (p_value < 1 or p_value > 22) then
    raise exception 'confidence must be between 1 and 22, got %', p_value
      using errcode = '22003';
  end if;

  -- Only confidence formats may be assigned a value. Checked before anything
  -- else touches picks so a mis-scoped client write fails loudly instead of
  -- silently seeding a number the format has no way to score or display.
  if p_value is not null then
    select l.scoring_type into v_scoring
    from leagues l
    where l.id = p_league_id;

    if v_scoring is null then
      raise exception 'league % not found', p_league_id using errcode = 'P0002';
    end if;

    if v_scoring not in ('ats_confidence', 'su_confidence') then
      raise exception
        'league format % does not use confidence values', v_scoring
        using errcode = '22023';
    end if;
  end if;

  select g.week, g.season_year
    into v_week, v_season
  from games g
  where g.id = p_game_id;

  if v_week is null then
    raise exception 'game % not found', p_game_id using errcode = 'P0002';
  end if;

  -- The pick being written must exist and still be editable. Checked up front
  -- for the same reason as the holder check below: otherwise the UPDATE's
  -- WITH CHECK fires and the caller sees a bare row-level-security violation
  -- naming an internal statement instead of the actual reason.
  select p.is_locked into v_target_locked
  from picks p
  where p.user_id   = v_user
    and p.league_id = p_league_id
    and p.game_id   = p_game_id;

  if not found then
    raise exception 'no pick for this game in this league' using errcode = 'P0002';
  end if;

  if v_target_locked or not public.game_is_open(p_game_id) then
    raise exception 'this pick is locked; its game has already started'
      using errcode = '42501';
  end if;

  -- Release the value from whichever pick is holding it this week.
  --
  -- The holder is checked before the write rather than letting the UPDATE
  -- fail: if its game has already started, RLS rejects the release and the
  -- caller would otherwise see either a bare row-level-security error or a
  -- unique-constraint violation on the following statement, neither of which
  -- says what actually went wrong. A confidence value committed to a started
  -- game is spent and cannot be reused.
  if p_value is not null then
    select p.game_id, p.is_locked
      into v_holder, v_locked
    from picks p
    where p.user_id     = v_user
      and p.league_id   = p_league_id
      and p.season_year = v_season
      and p.week        = v_week
      and p.confidence  = p_value
      and p.game_id    <> p_game_id;

    if v_holder is not null then
      if v_locked or not public.game_is_open(v_holder) then
        raise exception
          'confidence % is committed to a game that has already started', p_value
          using errcode = '42501';
      end if;

      update picks
         set confidence = null
       where user_id   = v_user
         and league_id = p_league_id
         and game_id   = v_holder;
    end if;
  end if;

  update picks
     set confidence = p_value
   where user_id   = v_user
     and league_id = p_league_id
     and game_id   = p_game_id;

  get diagnostics v_updated = row_count;

  -- Without this the caller cannot tell "assigned" from "silently refused by
  -- RLS because the pick is locked".
  if v_updated = 0 then
    raise exception 'no editable pick for this game in this league'
      using errcode = '42501';
  end if;
end;
$function$;

revoke execute on function public.set_pick_confidence(uuid, uuid, integer, uuid) from public, anon;
grant execute on function public.set_pick_confidence(uuid, uuid, integer, uuid) to authenticated;
