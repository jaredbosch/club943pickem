-- League option: "Push = half points" for the classic confidence formats
-- (ats_confidence, su_confidence).
--
--   push_half_points = true:  a graded push pays half the pick's confidence
--                             (confidence 14 push -> 7 points).
--   push_half_points = false: a push pays 0 (the behaviour before this
--                             migration).
--
-- Pick 5 is unaffected: it already pays 0.5 (flat) or rank x 0.5
-- (pick5_confidence) on a push, and ignores this column. Flat ATS / straight
-- up formats have no confidence and also ignore it.
--
-- Existing leagues keep today's rule (column added with default false, which
-- backfills every existing row with false); leagues created afterwards get
-- true (the default is flipped after the add). create_league() does not name
-- the column in its INSERT, so it picks up the new default.
--
-- Toggling the option re-scores the league's whole season: an AFTER UPDATE
-- trigger calls grade_and_sync_standings(league, season, p_force => true),
-- which re-grades every final-game pick from week 1 and rebuilds every weekly
-- standings row plus the season (week 0) row.
--
-- Replaced functions (CREATE OR REPLACE, bodies taken from the latest repo
-- definitions — diff against prod before applying, prod carries ad-hoc
-- migrations under different ids):
--   * public.grade_and_sync_standings(uuid, integer, boolean)
--       base: 20260920143909_confidence_swap_and_backfill
--       change: v_push_half; push branch pays confidence * 0.5 when on.
--   * public.get_live_week(uuid, integer, integer)
--       base: 20260823120000_pick5_lock_mode_and_confidence
--       change: live "on the number" projection pays confidence * 0.5 when on.
-- New:
--   * public.leagues_regrade_on_push_rule_change()  (trigger function)
--   * trigger leagues_regrade_on_push_rule_change on public.leagues
--
-- Column types already hold halves: picks.points_earned is numeric and
-- standings.total_points is real (20260803120000_capture_format_drift).

-- ---------------------------------------------------------------------------
-- 1. Column: false for every existing league, true for new ones.
-- ---------------------------------------------------------------------------

alter table public.leagues
  add column if not exists push_half_points boolean not null default false;

alter table public.leagues
  alter column push_half_points set default true;

-- ---------------------------------------------------------------------------
-- 2. grade_and_sync_standings: push pays half the confidence when on.
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
  v_push_half bool;
BEGIN
  SELECT scoring_type, COALESCE(pick5_confidence, false), COALESCE(push_half_points, false)
  INTO v_scoring, v_p5_conf, v_push_half
  FROM leagues WHERE id = p_league_id;
  v_is_ats   := v_scoring IN ('ats_confidence','ats','pick5_ats');
  v_is_conf  := v_scoring IN ('ats_confidence','su_confidence');
  v_is_pick5 := v_scoring IN ('pick5_su','pick5_ats');
  v_p5_conf  := v_is_pick5 AND v_p5_conf;
  -- Classic confidence formats only; Pick 5 push scoring is unchanged.
  v_push_half := v_is_conf AND v_push_half;

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
                 WHEN v_p5_conf OR v_push_half THEN COALESCE(p.confidence, 0) * 0.5
                 WHEN v_is_pick5 THEN 0.5
                 ELSE 0
               END
        WHEN NOT v_is_ats AND g.home_score = g.away_score
          THEN CASE
                 WHEN v_p5_conf OR v_push_half THEN COALESCE(p.confidence, 0) * 0.5
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


-- ---------------------------------------------------------------------------
-- 3. get_live_week (iOS sweat view): same push payout as grading.
-- ---------------------------------------------------------------------------

create or replace function public.get_live_week(
  p_league_id   uuid,
  p_season_year int,
  p_week        int
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_scoring  text;
  v_is_ats   bool;
  v_is_conf  bool;
  v_is_pick5 bool;
  v_p5_conf  bool;
  v_push_half bool;
  v_me       uuid := (select auth.uid());
  v_result   jsonb;
begin
  if not public.is_league_member(p_league_id) then
    raise exception 'not a member of this league' using errcode = '42501';
  end if;

  select scoring_type, coalesce(pick5_confidence, false), coalesce(push_half_points, false)
  into v_scoring, v_p5_conf, v_push_half
  from leagues where id = p_league_id;
  v_is_ats   := v_scoring in ('ats_confidence', 'ats', 'pick5_ats');
  v_is_conf  := v_scoring in ('ats_confidence', 'su_confidence');
  v_is_pick5 := v_scoring in ('pick5_su', 'pick5_ats');
  v_p5_conf  := v_is_pick5 and v_p5_conf;
  v_push_half := v_is_conf and v_push_half;

  with week_picks as (
    select
      p.user_id,
      p.game_id,
      p.picked_team,
      p.confidence,
      p.points_earned,
      g.home_team,
      g.away_team,
      g.home_score,
      g.away_score,
      g.status,
      coalesce(g.locked_spread_home, g.spread_home) as line
    from picks p
    join games g on g.id = p.game_id
    where p.league_id   = p_league_id
      and p.season_year = p_season_year
      and p.week        = p_week
      and p.picked_team is not null
  ),
  live as (
    select
      wp.*,
      case
        when v_is_ats and wp.picked_team = wp.home_team
          then  (wp.home_score - wp.away_score + wp.line)
        when v_is_ats
          then -(wp.home_score - wp.away_score + wp.line)
        when wp.picked_team = wp.home_team
          then  (wp.home_score - wp.away_score)
        else  -(wp.home_score - wp.away_score)
      end::numeric as margin
    from week_picks wp
    where wp.status     = 'in_progress'
      and wp.home_score is not null
      and wp.away_score is not null
      and (not v_is_ats or wp.line is not null)
  ),
  scored as (
    select
      l.*,
      case
        when l.margin > 0 then
          case when v_is_conf or v_p5_conf then coalesce(l.confidence, 0)::numeric else 1.0 end
        when l.margin = 0 and (v_p5_conf or v_push_half) then coalesce(l.confidence, 0) * 0.5
        when l.margin = 0 and v_is_pick5 then 0.5
        else 0.0
      end as live_points
    from live l
  ),
  banked as (
    select wp.user_id, coalesce(sum(wp.points_earned), 0)::numeric as pts
    from week_picks wp
    where wp.points_earned is not null
    group by wp.user_id
  ),
  member_totals as (
    select
      m.user_id,
      coalesce(b.pts, 0)                as banked_pts,
      coalesce(sum(s.live_points), 0)   as live_pts
    from league_members m
    left join banked b on b.user_id = m.user_id
    left join scored s on s.user_id = m.user_id
    where m.league_id = p_league_id
    group by m.user_id, b.pts
  ),
  ranked as (
    select
      mt.*,
      rank() over (order by mt.banked_pts desc)                    as banked_rank,
      rank() over (order by (mt.banked_pts + mt.live_pts) desc)    as live_rank,
      count(*) over ()                                             as league_size
    from member_totals mt
  ),
  mine as (select * from ranked where user_id = v_me)
  select jsonb_build_object(
    'games', coalesce((
      select jsonb_agg(jsonb_build_object(
        'game_id',      s.game_id,
        'cover_state',  case
                          when s.margin > 0 then 'covering'
                          when s.margin = 0 then 'on_the_number'
                          else                   'not_covering'
                        end,
        'cover_margin', s.margin,
        'confidence',   s.confidence,
        'live_points',  s.live_points
      ) order by s.live_points desc, s.margin asc)
      from scored s where s.user_id = v_me
    ), '[]'::jsonb),
    'banked_points',    coalesce((select banked_pts from mine), 0),
    'live_points',      coalesce((select live_pts   from mine), 0),
    'projected_points', coalesce((select banked_pts + live_pts from mine), 0),
    'banked_rank',      (select banked_rank from mine),
    'live_rank',        (select live_rank   from mine),
    'rank_delta',       (select banked_rank - live_rank from mine),
    'league_size',      coalesce((select league_size from mine), 0)
  )
  into v_result;

  return v_result;
end;
$$;


-- ---------------------------------------------------------------------------
-- 4. Re-score the whole season when a commissioner flips the option.
--
-- SECURITY DEFINER because the commissioner's UPDATE runs as `authenticated`,
-- and grading writes every member's picks and standings rows (RLS would
-- limit an invoker to their own unlocked picks). Only fires when the value
-- actually changes — the commissioner panel re-sends every setting on each
-- save, so a bare UPDATE OF would re-grade on unrelated saves.
-- ---------------------------------------------------------------------------

create or replace function public.leagues_regrade_on_push_rule_change()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
begin
  perform public.grade_and_sync_standings(new.id, new.season_year, true);
  return null;
end;
$function$;

revoke all on function public.leagues_regrade_on_push_rule_change() from public, anon, authenticated;

drop trigger if exists leagues_regrade_on_push_rule_change on public.leagues;
create trigger leagues_regrade_on_push_rule_change
  after update of push_half_points on public.leagues
  for each row
  when (old.push_half_points is distinct from new.push_half_points)
  execute function public.leagues_regrade_on_push_rule_change();
