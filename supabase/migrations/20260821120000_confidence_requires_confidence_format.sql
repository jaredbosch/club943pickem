-- set_pick_confidence validated the value, the lock state, and uniqueness, but
-- never that the league actually uses confidence. A Pick 5 SU pick could carry
-- a confidence value, and The Grid rendered it as a lone number under the team
-- abbreviation — which reads as a spread.
--
-- Clearing (p_value is null) stays allowed in every format so a stray value can
-- always be removed.

create or replace function public.set_pick_confidence(
  p_league_id uuid,
  p_game_id   uuid,
  p_value     integer
)
returns void
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_week    int;
  v_season  int;
  v_updated int;
  v_holder  uuid;
  v_locked  boolean;
  v_target_locked boolean;
  v_scoring text;
begin
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
  where p.user_id   = (select auth.uid())
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
    where p.user_id     = (select auth.uid())
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
       where user_id   = (select auth.uid())
         and league_id = p_league_id
         and game_id   = v_holder;
    end if;
  end if;

  update picks
     set confidence = p_value
   where user_id   = (select auth.uid())
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

-- Clear values already written into formats that cannot use them. Confidence is
-- meaningless in flat formats, so there is nothing to preserve.
update picks p
   set confidence = null
  from leagues l
 where l.id = p.league_id
   and p.confidence is not null
   and l.scoring_type not in ('ats_confidence', 'su_confidence');
