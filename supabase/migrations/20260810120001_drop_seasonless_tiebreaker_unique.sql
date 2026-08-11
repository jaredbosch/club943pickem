-- Second half of 20260810120000_season_aware_uniqueness: once the client
-- upserting tiebreakers ON CONFLICT (user_id, league_id, season_year, week)
-- is deployed, the season-blind constraint can go.
alter table public.tiebreaker_guesses
  drop constraint if exists tiebreaker_guesses_user_id_league_id_week_key;
