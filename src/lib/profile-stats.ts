// Profile stats computation — all derived from picks + games data

const NFL_DIVISIONS: Record<string, string> = {
  BUF: "AFC East",  MIA: "AFC East",  NE: "AFC East",   NYJ: "AFC East",
  BAL: "AFC North", CIN: "AFC North", CLE: "AFC North", PIT: "AFC North",
  HOU: "AFC South", IND: "AFC South", JAX: "AFC South", TEN: "AFC South",
  DEN: "AFC West",  KC:  "AFC West",  LV:  "AFC West",  LAC: "AFC West",
  DAL: "NFC East",  NYG: "NFC East",  PHI: "NFC East",  WSH: "NFC East",
  CHI: "NFC North", DET: "NFC North", GB:  "NFC North", MIN: "NFC North",
  ATL: "NFC South", CAR: "NFC South", NO:  "NFC South",  TB: "NFC South",
  ARI: "NFC West",  LAR: "NFC West",  SF:  "NFC West",  SEA: "NFC West",
};

export type StatLine = { picks: number; wins: number; winRate: number };

export type ProfileStats = {
  // Confidence calibration — win% per tier
  confTiers: { label: string; range: string; picks: number; wins: number; winRate: number }[];

  // Favorite vs underdog
  fav: StatLine;
  dog: StatLine;

  // Home vs away team picked
  home: StatLine;
  away: StatLine;

  // Line size buckets
  lineShort:  StatLine & { range: string }; // 0–3.5
  lineMid:    StatLine & { range: string }; // 3.5–7
  lineBig:    StatLine & { range: string }; // 7+

  // Primetime vs regular
  primetime: StatLine; // THU, SNF, MNF
  regular:   StatLine; // SUN early/late, intl

  // Divisional vs non-divisional
  divisional:    StatLine;
  nonDivisional: StatLine;

  // Streaks
  currentStreak: number;
  currentStreakType: "W" | "L" | null;
  longestWinStreak: number;

  // MNF tiebreaker accuracy
  tbCount: number;
  tbAvgError: number | null;
};

type Pick = {
  game_id: string;
  picked_team: string | null;
  confidence: number | null;
  is_correct: boolean | null;
  points_earned: number | null;
  week: number;
};

type Game = {
  id: string;
  home_team: string;
  away_team: string;
  spread_home: number | null;
  time_slot: string;
  week: number;
};

type TiebreakerGuess = { guess: number; actual_total: number | null };

function sl(picks: number, wins: number): StatLine {
  return { picks, wins, winRate: picks > 0 ? wins / picks : 0 };
}

export function computeProfileStats(
  allPicks: Pick[],
  allGames: Game[],
  tbGuesses: TiebreakerGuess[],
): ProfileStats {
  const gameMap = new Map(allGames.map((g) => [g.id, g]));
  const graded = allPicks.filter((p) => p.is_correct !== null && p.picked_team);

  // ── Confidence calibration ──────────────────────────────────────
  const tiers = [
    { label: "Low",       range: "1–4",   min: 1,  max: 4  },
    { label: "Medium",    range: "5–8",   min: 5,  max: 8  },
    { label: "High",      range: "9–12",  min: 9,  max: 12 },
    { label: "Lock",      range: "13–16", min: 13, max: 16 },
  ];

  const confTiers = tiers.map(({ label, range, min, max }) => {
    const tier = graded.filter((p) => p.confidence !== null && p.confidence >= min && p.confidence <= max);
    const wins = tier.filter((p) => p.is_correct === true).length;
    return { label, range, picks: tier.length, wins, winRate: tier.length > 0 ? wins / tier.length : 0 };
  });

  // ── Fav/dog, home/away, line size ──────────────────────────────
  let favPicks = 0, favWins = 0, dogPicks = 0, dogWins = 0;
  let homePicks = 0, homeWins = 0, awayPicks = 0, awayWins = 0;
  let shortPicks = 0, shortWins = 0, midPicks = 0, midWins = 0, bigPicks = 0, bigWins = 0;

  for (const p of graded) {
    const game = gameMap.get(p.game_id);
    if (!game || !p.picked_team) continue;

    const pickedHome = p.picked_team === game.home_team;
    const win = p.is_correct === true;

    // Home/away
    if (pickedHome) { homePicks++; if (win) homeWins++; }
    else            { awayPicks++; if (win) awayWins++; }

    // Fav/dog & line size (requires spread)
    const spread = game.spread_home;
    if (spread == null) continue;

    // Fav: the team whose spread line is negative
    const pickedFav = (pickedHome && spread < 0) || (!pickedHome && spread > 0);
    if (pickedFav) { favPicks++; if (win) favWins++; }
    else           { dogPicks++; if (win) dogWins++; }

    // Line size
    const line = Math.abs(spread);
    if (line <= 3.5) {
      shortPicks++; if (win) shortWins++;
    } else if (line <= 7) {
      midPicks++; if (win) midWins++;
    } else {
      bigPicks++; if (win) bigWins++;
    }
  }

  // ── Primetime vs regular ────────────────────────────────────────
  const primeslots = new Set(["thursday", "sunday_night", "monday"]);
  let ptPicks = 0, ptWins = 0, regPicks = 0, regWins = 0;

  for (const p of graded) {
    const game = gameMap.get(p.game_id);
    if (!game) continue;
    const win = p.is_correct === true;
    if (primeslots.has(game.time_slot)) { ptPicks++; if (win) ptWins++; }
    else                                 { regPicks++; if (win) regWins++; }
  }

  // ── Divisional ──────────────────────────────────────────────────
  let divPicks = 0, divWins = 0, ndPicks = 0, ndWins = 0;

  for (const p of graded) {
    const game = gameMap.get(p.game_id);
    if (!game) continue;
    const win = p.is_correct === true;
    const isDivisional = NFL_DIVISIONS[game.home_team] === NFL_DIVISIONS[game.away_team];
    if (isDivisional) { divPicks++; if (win) divWins++; }
    else              { ndPicks++;  if (win) ndWins++;  }
  }

  // ── Streaks ─────────────────────────────────────────────────────
  const sorted = [...graded].sort((a, b) => {
    if (a.week !== b.week) return b.week - a.week;
    return 0;
  });

  let currentStreak = 0;
  let currentStreakType: "W" | "L" | null = null;
  if (sorted.length > 0) {
    currentStreakType = sorted[0].is_correct === true ? "W" : "L";
    for (const p of sorted) {
      const type = p.is_correct === true ? "W" : "L";
      if (type === currentStreakType) currentStreak++;
      else break;
    }
  }

  // Longest win streak (week order)
  const chrono = [...graded].sort((a, b) => a.week - b.week);
  let longest = 0, current = 0;
  for (const p of chrono) {
    if (p.is_correct === true) { current++; longest = Math.max(longest, current); }
    else current = 0;
  }

  // ── MNF tiebreaker accuracy ─────────────────────────────────────
  const gradedTb = tbGuesses.filter((t) => t.actual_total != null);
  const tbAvgError = gradedTb.length > 0
    ? gradedTb.reduce((sum, t) => sum + Math.abs(t.guess - t.actual_total!), 0) / gradedTb.length
    : null;

  return {
    confTiers,
    fav: sl(favPicks, favWins),
    dog: sl(dogPicks, dogWins),
    home: sl(homePicks, homeWins),
    away: sl(awayPicks, awayWins),
    lineShort: { range: "0–3.5", ...sl(shortPicks, shortWins) },
    lineMid:   { range: "3.5–7", ...sl(midPicks,   midWins)   },
    lineBig:   { range: "7+",    ...sl(bigPicks,   bigWins)   },
    primetime: sl(ptPicks, ptWins),
    regular:   sl(regPicks, regWins),
    divisional:    sl(divPicks, divWins),
    nonDivisional: sl(ndPicks, ndWins),
    currentStreak,
    currentStreakType,
    longestWinStreak: longest,
    tbCount: gradedTb.length,
    tbAvgError,
  };
}
