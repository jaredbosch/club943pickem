-- Unranked confidence picks: swap on reassign, backfill at grading.
--
-- Rojo Cinco (pick5_ats + pick5_confidence, Sunday lock mode), week 1 2026:
-- a member picked five games, got auto-ranks 1–5 in pick order, then re-ranked
-- by tapping 5 / 4 / 3 on three other picks. set_pick_confidence "steals" a
-- rank — the previous holder is set to NULL and never gets a new number. His
-- Thursday pick (NE, a push) was the displaced one; it locked at kickoff still
-- unranked, and grading paid COALESCE(confidence, 0) * 0.5 = 0. The same thing
-- happened to the commissioner's own Thursday pick. Rank 2 (resp. 1) was
-- never used all week.
--
-- Two changes:
--
--   1. set_pick_confidence swaps instead of steals. Assigning rank N to pick A
--      while pick B holds N gives B whatever A held before (possibly NULL when
--      A was a fresh unranked pick). A locked holder still refuses, as before.
--      The per-week uniqueness on confidence means B has to be parked on NULL
--      for the duration of the swap.
--
--   2. grade_and_sync_standings fills any unranked pick it is about to grade
--      with the user's lowest unused rank for that week (ascending kickoff
--      order when several are unranked). Covers picks written by clients that
--      never went through the RPC (iOS upserts, the classic sheet's own
--      steal-and-clear), and pre-existing rows like the two above once the
--      league is regraded with p_force.
--
-- Body of set_pick_confidence is 20260911000000_commissioner_edit_picks
-- except the holder branch. Body of grade_and_sync_standings is
-- 20260823120000_pick5_lock_mode_and_confidence plus the backfill block.

-- ---------------------------------------------------------------------------
-- 1. set_pick_confidence: swap
-- ---------------------------------------------------------------------------

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
  v_target_conf   int;
  v_scoring text;
  v_p5_conf boolean;
  v_max     int;
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
  select p.is_locked, p.confidence into v_target_locked, v_target_conf
  from picks p
  where p.user_id   = v_user
    and p.league_id = p_league_id
    and p.game_id   = p_game_id;

  if not found then
    raise exception 'no pick for this game in this league' using errcode = 'P0002';
  end if;

  if v_target_locked or not public.pick_window_open(p_league_id, p_game_id) then
    raise exception 'this pick is locked; its game has already started'
      using errcode = '42501';
  end if;

  if p_value is not null and v_target_conf = p_value then
    return; -- already holds it
  end if;

  -- Swap with whichever pick is holding the value this week: the holder takes
  -- the target's old rank (or goes unranked when the target had none). A value
  -- committed to a locked pick is spent and cannot be reused.
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
      if v_locked or not public.pick_window_open(p_league_id, v_holder) then
        raise exception
          'confidence % is committed to a game that has already started', p_value
          using errcode = '42501';
      end if;

      -- Park the holder on NULL so the per-week uniqueness allows the move.
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

  if v_holder is not null and v_target_conf is not null then
    update picks
       set confidence = v_target_conf
     where user_id   = v_user
       and league_id = p_league_id
       and game_id   = v_holder;
  end if;
end;
$function$;

revoke execute on function public.set_pick_confidence(uuid, uuid, integer, uuid) from public, anon;
grant execute on function public.set_pick_confidence(uuid, uuid, integer, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. grade_and_sync_standings: backfill unranked picks before scoring
-- ---------------------------------------------------------------------------

create or replace function public.grade_and_sync_standings(
  p_league_id uuid,
  p_season_year integer,
  p_force boolean default false
)
returns jsonb
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
DECLARE
  v_week     int;
  v_graded   int := 0;
  v_weeks    int[] := '{}';
  v_tb_weeks int[] := '{}';
  v_scoring  text;
  v_is_ats   bool;
  v_is_conf  bool;
  v_is_pick5 bool;
  v_p5_conf  bool;
BEGIN
  SELECT scoring_type, COALESCE(pick5_confidence, false)
  INTO v_scoring, v_p5_conf
  FROM leagues WHERE id = p_league_id;
  v_is_ats   := v_scoring IN ('ats_confidence','ats','pick5_ats');
  v_is_conf  := v_scoring IN ('ats_confidence','su_confidence');
  v_is_pick5 := v_scoring IN ('pick5_su','pick5_ats');
  v_p5_conf  := v_is_pick5 AND v_p5_conf;

  -- A pick that reaches grading without a rank would score 0 even on a win.
  -- Give it the user's lowest rank still unused that week: Pick 5 draws from
  -- 1–5, classic confidence from 1–(games in the week). Several unranked
  -- picks take the free ranks in kickoff order.
  IF v_is_conf OR v_p5_conf THEN
    WITH unranked AS (
      SELECT p.id, p.user_id, p.week,
             row_number() OVER (PARTITION BY p.user_id, p.week
                                ORDER BY g.kickoff_time, g.id) AS rn
      FROM picks p
      JOIN games g ON g.id = p.game_id
      WHERE p.league_id   = p_league_id
        AND g.season_year = p_season_year
        AND g.status      = 'final'
        AND p.picked_team IS NOT NULL
        AND p.confidence  IS NULL
        AND (p_force OR p.points_earned IS NULL)
    ),
    slots AS (
      SELECT u.user_id, u.week, n,
             row_number() OVER (PARTITION BY u.user_id, u.week ORDER BY n) AS rn
      FROM (SELECT DISTINCT user_id, week FROM unranked) u
      CROSS JOIN LATERAL generate_series(
        1,
        CASE WHEN v_p5_conf THEN 5
             ELSE (SELECT count(*)::int FROM games gw
                   WHERE gw.season_year = p_season_year AND gw.week = u.week)
        END
      ) AS n
      WHERE NOT EXISTS (
        SELECT 1 FROM picks q
        WHERE q.user_id     = u.user_id
          AND q.league_id   = p_league_id
          AND q.season_year = p_season_year
          AND q.week        = u.week
          AND q.confidence  = n
      )
    )
    UPDATE picks p
    SET confidence = s.n
    FROM unranked u
    JOIN slots s ON s.user_id = u.user_id AND s.week = u.week AND s.rn = u.rn
    WHERE p.id = u.id;
  END IF;

  WITH updated AS (
    UPDATE picks p
    SET
      is_correct = CASE
        WHEN v_is_ats AND (g.home_score - g.away_score + COALESCE(g.locked_spread_home, g.spread_home)) = 0
          THEN NULL
        WHEN v_is_ats
          THEN (p.picked_team = CASE
                  WHEN g.home_score - g.away_score + COALESCE(g.locked_spread_home, g.spread_home) > 0
                  THEN g.home_team ELSE g.away_team END)
        WHEN NOT v_is_ats AND g.home_score = g.away_score THEN NULL
        ELSE (p.picked_team = CASE WHEN g.home_score > g.away_score THEN g.home_team ELSE g.away_team END)
      END,
      points_earned = CASE
        WHEN v_is_ats AND (g.home_score - g.away_score + COALESCE(g.locked_spread_home, g.spread_home)) = 0
          THEN CASE
                 WHEN v_p5_conf  THEN COALESCE(p.confidence, 0) * 0.5
                 WHEN v_is_pick5 THEN 0.5
                 ELSE 0
               END
        WHEN NOT v_is_ats AND g.home_score = g.away_score
          THEN CASE
                 WHEN v_p5_conf  THEN COALESCE(p.confidence, 0) * 0.5
                 WHEN v_is_pick5 THEN 0.5
                 ELSE 0
               END
        WHEN (v_is_ats AND p.picked_team = CASE
                WHEN g.home_score - g.away_score + COALESCE(g.locked_spread_home, g.spread_home) > 0
                THEN g.home_team ELSE g.away_team END)
          OR (NOT v_is_ats AND p.picked_team = CASE
                WHEN g.home_score > g.away_score THEN g.home_team ELSE g.away_team END)
          THEN CASE WHEN v_is_conf OR v_p5_conf THEN COALESCE(p.confidence, 0)::real ELSE 1.0 END
        ELSE 0.0
      END,
      updated_at = now()
    FROM games g
    WHERE p.game_id     = g.id
      AND p.league_id   = p_league_id
      AND g.season_year = p_season_year
      AND g.status      = 'final'
      AND g.home_score  IS NOT NULL
      AND g.away_score  IS NOT NULL
      AND p.picked_team IS NOT NULL
      AND (NOT v_is_ats OR COALESCE(g.locked_spread_home, g.spread_home) IS NOT NULL)
      AND (p_force OR p.points_earned IS NULL)
    RETURNING p.week
  )
  SELECT count(*), COALESCE(array_agg(DISTINCT week), '{}')
  INTO v_graded, v_weeks
  FROM updated;

  WITH tb AS (
    UPDATE tiebreaker_guesses tg
    SET actual_total = g.home_score + g.away_score,
        updated_at   = now()
    FROM games g
    WHERE g.id           = tg.game_id
      AND tg.league_id   = p_league_id
      AND g.status       = 'final'
      AND g.home_score   IS NOT NULL
      AND g.away_score   IS NOT NULL
      AND tg.actual_total IS NULL
    RETURNING tg.week
  )
  SELECT COALESCE(array_agg(DISTINCT week), '{}') INTO v_tb_weeks FROM tb;

  v_weeks := (SELECT COALESCE(array_agg(DISTINCT w ORDER BY w), '{}')
              FROM unnest(v_weeks || v_tb_weeks) AS t(w));

  IF COALESCE(array_length(v_weeks, 1), 0) = 0 THEN
    RETURN jsonb_build_object('graded_picks', v_graded);
  END IF;

  FOREACH v_week IN ARRAY v_weeks LOOP
    INSERT INTO standings (user_id, league_id, week, season_year, total_points, correct_picks, rank)
    SELECT p.user_id, p_league_id, v_week, p_season_year,
      COALESCE(SUM(p.points_earned), 0) AS total_points,
      COUNT(*) FILTER (WHERE p.is_correct = true)::int AS correct_picks,
      RANK() OVER (
        ORDER BY COALESCE(SUM(p.points_earned), 0) DESC,
                 COUNT(*) FILTER (WHERE p.is_correct = true) DESC,
                 MIN(ABS(tg.guess - tg.actual_total)) ASC NULLS LAST
      )::int AS rank
    FROM picks p
    JOIN games g ON g.id = p.game_id
    LEFT JOIN tiebreaker_guesses tg
      ON tg.user_id = p.user_id AND tg.league_id = p_league_id
         AND tg.week = v_week AND tg.actual_total IS NOT NULL
    WHERE p.league_id = p_league_id AND g.season_year = p_season_year
      AND p.week = v_week
      AND (p.is_correct IS NOT NULL OR p.points_earned IS NOT NULL)
    GROUP BY p.user_id
    ON CONFLICT (user_id, league_id, week, season_year) DO UPDATE
      SET total_points = EXCLUDED.total_points,
          correct_picks = EXCLUDED.correct_picks,
          rank = EXCLUDED.rank, updated_at = now();
  END LOOP;

  INSERT INTO standings (user_id, league_id, week, season_year, total_points, correct_picks, rank)
  SELECT user_id, p_league_id, 0, p_season_year,
    SUM(total_points), SUM(correct_picks)::int,
    RANK() OVER (ORDER BY SUM(total_points) DESC, SUM(correct_picks) DESC)::int
  FROM standings
  WHERE league_id = p_league_id AND week > 0 AND season_year = p_season_year
  GROUP BY user_id
  ON CONFLICT (user_id, league_id, week, season_year) DO UPDATE
    SET total_points = EXCLUDED.total_points, correct_picks = EXCLUDED.correct_picks,
        rank = EXCLUDED.rank, updated_at = now();

  RETURN jsonb_build_object('graded_picks', v_graded, 'weeks', to_jsonb(v_weeks));
END;
$function$;
