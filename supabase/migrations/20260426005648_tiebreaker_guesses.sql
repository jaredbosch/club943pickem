-- Recovered 2026-08-02 from prod migration history (was applied via dashboard only).

CREATE TABLE public.tiebreaker_guesses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  league_id    uuid NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
  game_id      uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  week         integer NOT NULL,
  guess        integer NOT NULL CHECK (guess >= 0 AND guess <= 120),
  actual_total integer,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, league_id, week)
);

ALTER TABLE public.tiebreaker_guesses ENABLE ROW LEVEL SECURITY;

-- Read: own guess always; others' guesses only after MNF locks
CREATE POLICY tiebreaker_select ON public.tiebreaker_guesses FOR SELECT
  USING (
    user_id = auth.uid()
    OR (
      is_league_member(league_id)
      AND EXISTS (
        SELECT 1 FROM public.games g
        WHERE g.id = game_id AND g.status IN ('in_progress','final')
      )
    )
  );

CREATE POLICY tiebreaker_insert ON public.tiebreaker_guesses FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_league_member(league_id)
    AND EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = game_id AND g.status = 'scheduled'
    )
  );

CREATE POLICY tiebreaker_update ON public.tiebreaker_guesses FOR UPDATE
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.games g
      WHERE g.id = game_id AND g.status = 'scheduled'
    )
  );
