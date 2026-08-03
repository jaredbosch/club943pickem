-- Recovered 2026-08-02 from prod migration history (was applied via dashboard only).

ALTER TABLE public.leagues
  ADD COLUMN IF NOT EXISTS playoffs_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS drop_lowest_weeks int NOT NULL DEFAULT 0
    CHECK (drop_lowest_weeks BETWEEN 0 AND 16),
  ADD COLUMN IF NOT EXISTS commissioner_can_edit boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS registration_locked boolean NOT NULL DEFAULT false;
