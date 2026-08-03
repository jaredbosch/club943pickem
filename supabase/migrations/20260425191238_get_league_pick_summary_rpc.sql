-- Recovered 2026-08-02 from prod migration history (was applied via dashboard only).

CREATE OR REPLACE FUNCTION public.get_league_pick_summary(p_league_id uuid)
RETURNS TABLE(user_id uuid, total_graded bigint, correct_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    user_id,
    COUNT(*)                                    AS total_graded,
    COUNT(*) FILTER (WHERE is_correct = true)   AS correct_count
  FROM picks
  WHERE league_id = p_league_id
    AND is_correct IS NOT NULL
  GROUP BY user_id;
$$;
