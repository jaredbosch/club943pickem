-- Pick 5 confidence ranks were silently discarded.
--
-- 20260823 added leagues.pick5_confidence (rank the 5 picks 1–5) but left two
-- guards from 20260821 in place that only knew about the two classic
-- confidence formats:
--
--   * picks_clear_confidence_in_flat_format  — a BEFORE trigger that nulls
--     confidence on every insert/update unless the league is
--     ats_confidence / su_confidence. The Pick 5 sheet's upserts ("Save
--     Picks", and the auto-rank on a new pick) therefore reported success
--     while the rank never reached the row. Reloading the sheet showed
--     "5 picks unranked".
--   * set_pick_confidence — the RPC behind the 1–5 rank chips raised
--     'league format pick5_ats does not use confidence values'.
--
-- Both now treat a Pick 5 league with pick5_confidence = true as a
-- confidence format. Pick 5 ranks are bounded 1–5 (classic stays 1–22), and
-- the RPC's lock checks use pick_window_open(), the same league-aware gate
-- the picks RLS policies use — so a Pick 5 rank change after the weekly
-- deadline fails with the real reason instead of a bare RLS violation.

-- ---------------------------------------------------------------------------
-- Which leagues carry a confidence value.
-- ---------------------------------------------------------------------------
create or replace function public.league_uses_confidence(p_league_id uuid)
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce((
    select l.scoring_type in ('ats_confidence', 'su_confidence')
        or (l.scoring_type in ('pick5_su', 'pick5_ats')
            and coalesce(l.pick5_confidence, false))
    from leagues l
    where l.id = p_league_id
  ), false);
$$;

revoke all on function public.league_uses_confidence(uuid) from public, anon;
grant execute on function public.league_uses_confidence(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Trigger: still coerces (never raises) for the reasons in 20260821120001,
-- but Pick 5 + pick5_confidence keeps its value.
-- ---------------------------------------------------------------------------
create or replace function public.picks_clear_confidence_in_flat_format()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
  if new.confidence is null then
    return new;
  end if;

  if not public.league_uses_confidence(new.league_id) then
    new.confidence := null;
  end if;

  return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- RPC: rank assignment / steal. Body unchanged from 20260821120000 except the
-- format gate, the Pick 5 range, and the league-aware lock checks.
-- ---------------------------------------------------------------------------
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
  v_p5_conf boolean;
  v_max     int;
begin
  -- Only confidence formats may be assigned a value. Checked before anything
  -- else touches picks so a mis-scoped client write fails loudly instead of
  -- silently seeding a number the format has no way to score or display.
  -- Clearing (p_value is null) stays allowed in every format.
  if p_value is not null then
    select l.scoring_type, coalesce(l.pick5_confidence, false)
      into v_scoring, v_p5_conf
    from leagues l
    where l.id = p_league_id;

    if v_scoring is null then
      raise exception 'league % not found', p_league_id using errcode = 'P0002';
    end if;

    if v_scoring in ('pick5_su', 'pick5_ats') then
      if not v_p5_conf then
        raise exception
          'league format % does not use confidence values (pick5_confidence is off)', v_scoring
          using errcode = '22023';
      end if;
      v_max := 5;
    elsif v_scoring in ('ats_confidence', 'su_confidence') then
      v_max := 22;
    else
      raise exception
        'league format % does not use confidence values', v_scoring
        using errcode = '22023';
    end if;

    if p_value < 1 or p_value > v_max then
      raise exception 'confidence must be between 1 and %, got %', v_max, p_value
        using errcode = '22003';
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
  -- so the caller sees the actual reason instead of a bare row-level-security
  -- violation from the UPDATE's WITH CHECK.
  select p.is_locked into v_target_locked
  from picks p
  where p.user_id   = (select auth.uid())
    and p.league_id = p_league_id
    and p.game_id   = p_game_id;

  if not found then
    raise exception 'no pick for this game in this league' using errcode = 'P0002';
  end if;

  if v_target_locked or not public.pick_window_open(p_league_id, p_game_id) then
    raise exception 'this pick is locked; its game has already started'
      using errcode = '42501';
  end if;

  -- Release the value from whichever pick is holding it this week. A value
  -- committed to a locked pick is spent and cannot be reused.
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
      if v_locked or not public.pick_window_open(p_league_id, v_holder) then
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
