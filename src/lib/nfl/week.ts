// NFL season year + week number from a kickoff timestamp.
//
// Season year convention: a game in Jan/Feb 2027 is still the 2026 season.
// Each NFL week runs Tuesday 00:00 ET → Monday 23:59 ET, so Week 1 starts on
// the Tuesday after Labor Day (first Monday of September).

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function nflSeasonYear(kickoff: Date): number {
  const month = kickoff.getUTCMonth();
  const year = kickoff.getUTCFullYear();
  return month < 6 ? year - 1 : year;
}

export function seasonStartTuesdayUtc(seasonYear: number): Date {
  const sep1 = new Date(Date.UTC(seasonYear, 8, 1));
  const dow = sep1.getUTCDay();
  const daysToMonday = (1 - dow + 7) % 7;
  const tuesday = new Date(sep1);
  tuesday.setUTCDate(sep1.getUTCDate() + daysToMonday + 1);
  return tuesday;
}

export function nflWeek(kickoff: Date, seasonYear?: number): number {
  const year = seasonYear ?? nflSeasonYear(kickoff);
  const start = seasonStartTuesdayUtc(year);
  const diff = kickoff.getTime() - start.getTime();
  const week = Math.floor(diff / WEEK_MS) + 1;
  return Math.max(1, Math.min(22, week));
}
