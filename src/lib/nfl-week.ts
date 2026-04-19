/**
 * NFL regular season week computation.
 * The season starts on the Thursday after Labour Day; weeks advance each Tuesday
 * (the day new spreads populate, per §6.2).
 */

function laborDay(year: number): Date {
  // First Monday in September, in US Eastern.
  for (let day = 1; day <= 7; day++) {
    const d = new Date(Date.UTC(year, 8, day, 16, 0, 0)); // 12pm ET ~= 16Z
    if (d.getUTCDay() === 1) return d;
  }
  throw new Error("unreachable");
}

function seasonKickoff(year: number): Date {
  // Thursday after Labour Day.
  const labor = laborDay(year);
  return new Date(labor.getTime() + 3 * 24 * 60 * 60 * 1000);
}

/**
 * Returns { season_year, week } for a given UTC instant.
 * Week boundaries roll over on Tuesday 10:00 UTC (~ 6am ET Tuesday),
 * matching when the Odds API typically publishes the next week's lines.
 */
export function nflWeekFor(date: Date): { season_year: number; week: number } {
  const year =
    date.getUTCMonth() < 6 ? date.getUTCFullYear() - 1 : date.getUTCFullYear();
  const kickoff = seasonKickoff(year);
  // Week 1 opens the Tuesday before kickoff Thursday.
  const week1Start = new Date(kickoff.getTime() - 2 * 24 * 60 * 60 * 1000);
  const ms = date.getTime() - week1Start.getTime();
  if (ms < 0) return { season_year: year, week: 1 };
  const week = Math.min(18, 1 + Math.floor(ms / (7 * 24 * 60 * 60 * 1000)));
  return { season_year: year, week };
}
