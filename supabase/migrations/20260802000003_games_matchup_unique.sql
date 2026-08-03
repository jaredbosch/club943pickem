-- A matchup can only exist once per week per season. Backstop against the
-- odds sync and the schedule import inserting the same game as separate rows
-- (167 duplicates were created this way in weeks 5–17 and cleaned up 2026-08-02).
create unique index games_matchup_unique_idx
  on public.games (season_year, week, away_team, home_team);
