/**
 * ATS scoring: home covers if (home_score - away_score) > -locked_spread_home.
 *   - Push: exact spread (home_score - away_score == -locked_spread_home).
 *   - Home covers: home won by more than the negative of the spread.
 *   - Away covers: the opposite.
 */
export type GradeResult = "home_covers" | "away_covers" | "push";

export function gradeAts(args: {
  homeScore: number;
  awayScore: number;
  lockedSpreadHome: number;
}): GradeResult {
  const margin = args.homeScore - args.awayScore;
  const threshold = -args.lockedSpreadHome;
  if (margin === threshold) return "push";
  return margin > threshold ? "home_covers" : "away_covers";
}
