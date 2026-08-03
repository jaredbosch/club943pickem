-- grade_and_sync_standings previously re-graded every final-game pick in the
-- league's season on every call (at 250 leagues that is ~1.4M row updates per
-- cron sweep by late season). It now grades only picks that have never been
-- graded (points_earned is null) and rebuilds standings only for weeks that
-- gained newly graded picks or newly resolved tiebreakers. Pass
-- p_force := true to re-grade the whole season (after a score correction).
-- Scoring semantics per format are unchanged from the prod version.

drop function if exists public.grade_and_sync_standings(uuid, integer);

create function public.grade_and_sync_standings(
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
BEGIN
  SELECT scoring_type INTO v_scoring FROM leagues WHERE id = p_league_id;
  v_is_ats   := v_scoring IN ('ats_confidence','ats','pick5_ats');
  v_is_conf  := v_scoring IN ('ats_confidence','su_confidence');
  v_is_pick5 := v_scoring IN ('pick5_su','pick5_ats');

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
          THEN CASE WHEN v_is_pick5 THEN 0.5 ELSE 0 END
        WHEN NOT v_is_ats AND g.home_score = g.away_score
          THEN CASE WHEN v_is_pick5 THEN 0.5 ELSE 0 END
        WHEN (v_is_ats AND p.picked_team = CASE
                WHEN g.home_score - g.away_score + COALESCE(g.locked_spread_home, g.spread_home) > 0
                THEN g.home_team ELSE g.away_team END)
          OR (NOT v_is_ats AND p.picked_team = CASE
                WHEN g.home_score > g.away_score THEN g.home_team ELSE g.away_team END)
          THEN CASE WHEN v_is_conf THEN COALESCE(p.confidence, 0)::real ELSE 1.0 END
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

  -- Resolve tiebreaker actuals for newly-final games. Done inline (same logic
  -- as sync_tiebreaker_actuals) so the affected weeks can be re-ranked even
  -- when no picks in this league were graded in this call.
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
