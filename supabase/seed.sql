-- Week 7 2026 fixture — mirrors src/components/pick-sheet/week7-data.ts.
-- Idempotent on games.external_id.

insert into games (
  external_id, week, season_year, home_team, away_team,
  kickoff_time, time_slot, spread_home, locked_spread_home,
  home_score, away_score, status
) values
  -- Thursday Night (final)
  ('2026-w07-den-no',  7, 2026, 'NO',  'DEN',
   '2026-10-15 20:15:00-04', 'thursday',     -3.5, -3.5, 20, 17, 'final'),

  -- International London (final)
  ('2026-w07-jax-chi', 7, 2026, 'CHI', 'JAX',
   '2026-10-18 09:30:00-04', 'intl',         -6.5, -6.5, 28, 14, 'final'),
  ('2026-w07-nyj-ne',  7, 2026, 'NE',  'NYJ',
   '2026-10-18 09:30:00-04', 'intl',         -2.5, -2.5, 17, 14, 'final'),

  -- Sunday 1:00 PM ET (in progress)
  ('2026-w07-buf-ten', 7, 2026, 'TEN', 'BUF',
   '2026-10-18 13:00:00-04', 'sunday_early',  7.0,  7.0, 10, 24, 'in_progress'),
  ('2026-w07-kc-sf',   7, 2026, 'SF',  'KC',
   '2026-10-18 13:00:00-04', 'sunday_early',  3.0,  3.0, 17, 14, 'in_progress'),
  ('2026-w07-cin-cle', 7, 2026, 'CLE', 'CIN',
   '2026-10-18 13:00:00-04', 'sunday_early', -1.5, -1.5,  7, 10, 'in_progress'),
  ('2026-w07-hou-gb',  7, 2026, 'GB',  'HOU',
   '2026-10-18 13:00:00-04', 'sunday_early',  4.5,  4.5, 21, 13, 'in_progress'),
  ('2026-w07-phi-nyg', 7, 2026, 'NYG', 'PHI',
   '2026-10-18 13:00:00-04', 'sunday_early',  2.0,  2.0,  3, 17, 'in_progress'),

  -- Sunday 4:05 PM ET (open)
  ('2026-w07-dal-det', 7, 2026, 'DET', 'DAL',
   '2026-10-18 16:05:00-04', 'sunday_late',  -3.0, null, null, null, 'scheduled'),
  ('2026-w07-sea-atl', 7, 2026, 'ATL', 'SEA',
   '2026-10-18 16:05:00-04', 'sunday_late',   1.5, null, null, null, 'scheduled'),
  ('2026-w07-lar-lv',  7, 2026, 'LV',  'LAR',
   '2026-10-18 16:25:00-04', 'sunday_late',  -5.5, null, null, null, 'scheduled'),

  -- Sunday Night (open)
  ('2026-w07-pit-bal', 7, 2026, 'BAL', 'PIT',
   '2026-10-18 20:20:00-04', 'sunday_night', -2.5, null, null, null, 'scheduled'),

  -- Monday Night (open)
  ('2026-w07-tb-ari',  7, 2026, 'ARI', 'TB',
   '2026-10-19 20:15:00-04', 'monday',        1.0, null, null, null, 'scheduled'),
  ('2026-w07-lac-was', 7, 2026, 'WAS', 'LAC',
   '2026-10-19 20:15:00-04', 'monday',        3.5, null, null, null, 'scheduled')
on conflict (external_id) do update set
  home_team          = excluded.home_team,
  away_team          = excluded.away_team,
  kickoff_time       = excluded.kickoff_time,
  time_slot          = excluded.time_slot,
  spread_home        = excluded.spread_home,
  locked_spread_home = excluded.locked_spread_home,
  home_score         = excluded.home_score,
  away_score         = excluded.away_score,
  status             = excluded.status;
