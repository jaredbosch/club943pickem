-- Recovered 2026-08-02 from prod migration history (was applied via dashboard only).

-- Add season_year column, backfill existing rows as 2026
ALTER TABLE standings ADD COLUMN IF NOT EXISTS season_year INTEGER NOT NULL DEFAULT 2026;

-- Replace unique constraint to include season_year
ALTER TABLE standings DROP CONSTRAINT IF EXISTS standings_user_id_league_id_week_key;
ALTER TABLE standings ADD CONSTRAINT standings_user_id_league_id_week_season_year_key
  UNIQUE (user_id, league_id, week, season_year);

-- Update grade_and_sync_standings to be season-aware
CREATE OR REPLACE FUNCTION grade_and_sync_standings(p_league_id uuid, p_season_year int DEFAULT 2026)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_week   int;
  v_graded int := 0;
BEGIN
  -- 1. Grade picks for all final games in this season
  UPDATE picks p
  SET
    is_correct = (
      p.picked_team = CASE
        WHEN g.home_score - g.away_score + COALESCE(g.locked_spread_home, g.spread_home) > 0
        THEN g.home_team ELSE g.away_team
      END
    ),
    points_earned = CASE
      WHEN p.picked_team = CASE
        WHEN g.home_score - g.away_score + COALESCE(g.locked_spread_home, g.spread_home) > 0
        THEN g.home_team ELSE g.away_team
      END THEN p.confidence ELSE 0
    END,
    updated_at = now()
  FROM games g
  WHERE p.game_id    = g.id
    AND p.league_id  = p_league_id
    AND g.season_year = p_season_year
    AND g.status     = 'final'
    AND g.home_score IS NOT NULL
    AND g.away_score IS NOT NULL
    AND COALESCE(g.locked_spread_home, g.spread_home) IS NOT NULL;

  GET DIAGNOSTICS v_graded = ROW_COUNT;

  -- 2. Fill tiebreaker actuals
  PERFORM sync_tiebreaker_actuals(p_league_id);

  -- 3. Rebuild weekly standings with 3-level tiebreaker
  FOR v_week IN
    SELECT DISTINCT g.week
    FROM picks p
    JOIN games g ON g.id = p.game_id
    WHERE p.league_id   = p_league_id
      AND g.season_year = p_season_year
      AND g.status      = 'final'
      AND p.is_correct  IS NOT NULL
  LOOP
    INSERT INTO standings (user_id, league_id, week, season_year, total_points, correct_picks, rank)
    SELECT
      p.user_id,
      p_league_id,
      v_week,
      p_season_year,
      COALESCE(SUM(p.points_earned), 0)::int           AS total_points,
      COUNT(*) FILTER (WHERE p.is_correct = true)::int AS correct_picks,
      RANK() OVER (
        ORDER BY
          COALESCE(SUM(p.points_earned), 0)           DESC,
          COUNT(*) FILTER (WHERE p.is_correct = true) DESC,
          MIN(ABS(tg.guess - tg.actual_total))        ASC NULLS LAST
      )::int AS rank
    FROM picks p
    JOIN games g ON g.id = p.game_id
    LEFT JOIN tiebreaker_guesses tg
           ON tg.user_id   = p.user_id
          AND tg.league_id = p_league_id
          AND tg.week      = v_week
          AND tg.actual_total IS NOT NULL
    WHERE p.league_id   = p_league_id
      AND g.season_year = p_season_year
      AND p.week        = v_week
      AND p.is_correct  IS NOT NULL
    GROUP BY p.user_id
    ON CONFLICT (user_id, league_id, week, season_year) DO UPDATE
      SET total_points  = EXCLUDED.total_points,
          correct_picks = EXCLUDED.correct_picks,
          rank          = EXCLUDED.rank,
          updated_at    = now();
  END LOOP;

  -- 4. Rebuild season totals (week = 0) for this season
  INSERT INTO standings (user_id, league_id, week, season_year, total_points, correct_picks, rank)
  SELECT
    user_id,
    p_league_id,
    0,
    p_season_year,
    SUM(total_points)::int,
    SUM(correct_picks)::int,
    RANK() OVER (ORDER BY SUM(total_points) DESC, SUM(correct_picks) DESC)::int
  FROM standings
  WHERE league_id  = p_league_id
    AND week       > 0
    AND season_year = p_season_year
  GROUP BY user_id
  ON CONFLICT (user_id, league_id, week, season_year) DO UPDATE
    SET total_points  = EXCLUDED.total_points,
        correct_picks = EXCLUDED.correct_picks,
        rank          = EXCLUDED.rank,
        updated_at    = now();

  RETURN jsonb_build_object('graded_picks', v_graded);
END;
$$;

-- Update get_league_pick_summary to filter by season
CREATE OR REPLACE FUNCTION get_league_pick_summary(p_league_id uuid, p_season_year int DEFAULT 2026)
RETURNS TABLE(user_id uuid, total_graded bigint, correct_count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.user_id,
    COUNT(*)                                          AS total_graded,
    COUNT(*) FILTER (WHERE p.is_correct = true)       AS correct_count
  FROM picks p
  JOIN games g ON g.id = p.game_id
  WHERE p.league_id    = p_league_id
    AND g.season_year  = p_season_year
    AND p.is_correct   IS NOT NULL
  GROUP BY p.user_id;
$$;
