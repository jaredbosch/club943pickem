// Canonical ScoringType — single source of truth across the app.

export type ScoringType =
  | 'ats_confidence' // ATS picks + confidence 1–16 (default)
  | 'ats'            // ATS picks, flat 1pt per correct
  | 'straight_up'    // Outright winner, flat 1pt, no spread
  | 'su_confidence'  // Outright winner + confidence 1–16, no spread
  | 'pick5_su'       // Pick any 5 games — straight up, weekly lock (see Pick5LockMode)
  | 'pick5_ats';     // Pick any 5 games — ATS, weekly lock (see Pick5LockMode)

// When a Pick 5 league's weekly pick window closes (leagues.pick5_lock_mode).
// 'thursday' (default): all picks lock at the Thursday game's kickoff.
// 'sunday': picks lock at the first Sunday kickoff; games kicking off earlier
// (Thu/Fri/Sat) lock at their own kickoff.
export type Pick5LockMode = 'thursday' | 'sunday';

export function isConfidenceFormat(t: ScoringType): boolean {
  return t === 'ats_confidence' || t === 'su_confidence';
}

export function isAtsFormat(t: ScoringType): boolean {
  return t === 'ats_confidence' || t === 'ats' || t === 'pick5_ats';
}

export function isPick5Format(t: ScoringType): boolean {
  return t === 'pick5_su' || t === 'pick5_ats';
}

export function scoringTypeHeroLabel(t: ScoringType): string {
  switch (t) {
    case 'ats_confidence': return 'CONFIDENCE PICKS';
    case 'ats':            return 'ATS PICKS';
    case 'straight_up':    return 'PICKS';
    case 'su_confidence':  return 'CONFIDENCE PICKS';
    case 'pick5_su':       return 'PICK 5';
    case 'pick5_ats':      return 'PICK 5 ATS';
  }
}

// Pick 5 result encoding in the picks table:
//   Win:   is_correct = true,  points_earned = 1.0 (or the 1–5 rank when the
//          league has pick5_confidence on)
//   Push:  is_correct = null,  points_earned = 0.5 (or rank × 0.5) — null means
//          "not a win or loss", the nonzero points signal push
//   Loss:  is_correct = false, points_earned = 0
//   Pending: is_correct = null, points_earned = null
export function isPick5Push(isCorrect: boolean | null, pointsEarned: number | null): boolean {
  return isCorrect === null && pointsEarned !== null && pointsEarned > 0;
}

export const SCORING_OPTIONS: [ScoringType, string, string][] = [
  ['ats_confidence', 'ATS + Confidence',        'Pick ATS winners and assign 1–16 confidence per game'],
  ['ats',           'ATS Only',                 'Pick ATS winners — 1 point per correct pick'],
  ['straight_up',   'Straight Up Winners',       'Pick the outright winner, no spread — 1 pt per correct'],
  ['su_confidence', 'Straight Up + Confidence', 'Pick outright winners and assign 1–16 confidence — no spread'],
  ['pick5_su',      'Pick 5 — Straight Up',     'Choose any 5 games. Pick the outright winner. Picks lock at Thursday kickoff by default.'],
  ['pick5_ats',     'Pick 5 — ATS',             'Choose any 5 games. Pick against the spread. Picks lock at Thursday kickoff by default.'],
];
