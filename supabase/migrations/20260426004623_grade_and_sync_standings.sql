-- Recovered 2026-08-02 from prod migration history (was applied via dashboard only).

CREATE OR REPLACE FUNCTION public.grade_and_sync_standings(p_league_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week int;
  v_graded int := 0;
BEGIN
  -- Grade picks for all final games in this league that have scores + spread
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
  WHERE p.game_id = g.id
    AND p.league_id = p_league_id
    AND g.status = 'final'
    AND g.home_score IS NOT NULL
    AND g.away_score IS NOT NULL
    AND COALESCE(g.locked_spread_home, g.spread_home) IS NOT NULL;

  GET DIAGNOSTICS v_graded = ROW_COUNT;

  -- Rebuild weekly standings for all weeks that have any final games
  FOR v_week IN
    SELECT DISTINCT p.week
    FROM picks p
    JOIN games g ON g.id = p.game_id
    WHERE p.league_id = p_league_id
      AND g.status = 'final'
      AND p.is_correct IS NOT NULL
  LOOP
    INSERT INTO standings (user_id, league_id, week, total_points, correct_picks, rank)
    SELECT
      p.user_id,
      p_league_id,
      v_week,
      COALESCE(SUM(p.points_earned), 0)::int,
      COUNT(*) FILTER (WHERE p.is_correct = true)::int,
      RANK() OVER (ORDER BY COALESCE(SUM(p.points_earned), 0) DESC)::int
    FROM picks p
    WHERE p.league_id = p_league_id
      AND p.week = v_week
      AND p.is_correct IS NOT NULL
    GROUP BY p.user_id
    ON CONFLICT (user_id, league_id, week) DO UPDATE
      SET total_points   = EXCLUDED.total_points,
          correct_picks  = EXCLUDED.correct_picks,
          rank           = EXCLUDED.rank,
          updated_at     = now();
  END LOOP;

  -- Rebuild season totals (week = 0)
  INSERT INTO standings (user_id, league_id, week, total_points, correct_picks, rank)
  SELECT
    user_id,
    p_league_id,
    0,
    SUM(total_points)::int,
    SUM(correct_picks)::int,
    RANK() OVER (ORDER BY SUM(total_points) DESC)::int
  FROM standings
  WHERE league_id = p_league_id AND week > 0
  GROUP BY user_id
  ON CONFLICT (user_id, league_id, week) DO UPDATE
    SET total_points  = EXCLUDED.total_points,
        correct_picks = EXCLUDED.correct_picks,
        rank          = EXCLUDED.rank,
        updated_at    = now();

  RETURN jsonb_build_object('graded_picks', v_graded);
END;
$$;
