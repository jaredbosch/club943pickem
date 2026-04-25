// Sample Week 7 grid data — shown during off-season or when DB has no games.
// Mirrors week7-data.ts games so both screens are consistent.

export type SampleGame = {
  id: string;
  away: string;
  home: string;
  status: string;
  timeSlot: string;
  kickoffTime: string;
  awayScore?: number | null;
  homeScore?: number | null;
  atsWinner?: string | null;
  homeSpread?: number | null;
};

export type SamplePlayer = {
  userId: string;
  displayName: string;
  weekPoints: number;
  weekCorrect: number;
  rank: number | null;
  isCurrentUser: boolean;
  picks: Record<string, { pickedTeam: string; isCorrect: boolean | null; confidence: number | null }>;
};

export const sampleGames: SampleGame[] = [
  { id: "den-no",   away: "DEN", home: "NO",  status: "final",  timeSlot: "thursday",     kickoffTime: "2025-10-16T20:15:00Z", awayScore: 31, homeScore: 10, atsWinner: "DEN", homeSpread: 8.5  },
  { id: "jax-chi",  away: "JAX", home: "CHI", status: "final",  timeSlot: "intl",         kickoffTime: "2025-10-19T13:00:00Z", awayScore: 16, homeScore: 35, atsWinner: "CHI", homeSpread: -6.5 },
  { id: "nyj-ne",   away: "NYJ", home: "NE",  status: "final",  timeSlot: "intl",         kickoffTime: "2025-10-19T09:30:00Z", awayScore: 24, homeScore: 17, atsWinner: null,  homeSpread: 1.5  },
  { id: "buf-ten",  away: "BUF", home: "TEN", status: "live",   timeSlot: "sunday_early", kickoffTime: "2025-10-19T17:00:00Z" },
  { id: "kc-sf",    away: "KC",  home: "SF",  status: "live",   timeSlot: "sunday_early", kickoffTime: "2025-10-19T17:00:00Z" },
  { id: "cin-cle",  away: "CIN", home: "CLE", status: "live",   timeSlot: "sunday_early", kickoffTime: "2025-10-19T17:00:00Z" },
  { id: "hou-gb",   away: "HOU", home: "GB",  status: "live",   timeSlot: "sunday_early", kickoffTime: "2025-10-19T17:00:00Z" },
  { id: "phi-nyg",  away: "PHI", home: "NYG", status: "live",   timeSlot: "sunday_early", kickoffTime: "2025-10-19T17:00:00Z" },
  { id: "dal-det",  away: "DAL", home: "DET", status: "pending",timeSlot: "sunday_late",  kickoffTime: "2025-10-19T20:05:00Z" },
  { id: "sea-atl",  away: "SEA", home: "ATL", status: "pending",timeSlot: "sunday_late",  kickoffTime: "2025-10-19T20:25:00Z" },
  { id: "lar-lv",   away: "LAR", home: "LV",  status: "pending",timeSlot: "sunday_late",  kickoffTime: "2025-10-19T20:25:00Z" },
  { id: "pit-bal",  away: "PIT", home: "BAL", status: "pending",timeSlot: "sunday_night", kickoffTime: "2025-10-19T20:20:00Z" },
  { id: "tb-ari",   away: "TB",  home: "ARI", status: "pending",timeSlot: "monday",       kickoffTime: "2025-10-20T00:15:00Z" },
  { id: "lac-was",  away: "LAC", home: "WAS", status: "pending",timeSlot: "monday",       kickoffTime: "2025-10-20T00:15:00Z" },
];

// Locked/final games: DEN won (correct), CHI won (JAX lost), push on NYJ/NE
// Live games: pending result (isCorrect null)
export const samplePlayers: SamplePlayer[] = [
  {
    userId: "sample-1", displayName: "Matty Ice", weekPoints: 29, weekCorrect: 2, rank: 1, isCurrentUser: false,
    picks: {
      "den-no":  { pickedTeam: "DEN", isCorrect: true,  confidence: 14 },
      "jax-chi": { pickedTeam: "CHI", isCorrect: true,  confidence: 15 },
      "nyj-ne":  { pickedTeam: "NYJ", isCorrect: null,  confidence: 16 },
      "buf-ten": { pickedTeam: "BUF", isCorrect: null,  confidence: 13 },
      "kc-sf":   { pickedTeam: "KC",  isCorrect: null,  confidence: 11 },
      "cin-cle": { pickedTeam: "CLE", isCorrect: null,  confidence: 8  },
      "hou-gb":  { pickedTeam: "HOU", isCorrect: null,  confidence: 12 },
      "phi-nyg": { pickedTeam: "PHI", isCorrect: null,  confidence: 9  },
      "dal-det": { pickedTeam: "DET", isCorrect: null,  confidence: 10 },
      "sea-atl": { pickedTeam: "SEA", isCorrect: null,  confidence: 7  },
      "lar-lv":  { pickedTeam: "LV",  isCorrect: null,  confidence: 3  },
      "pit-bal": { pickedTeam: "BAL", isCorrect: null,  confidence: 5  },
      "tb-ari":  { pickedTeam: "TB",  isCorrect: null,  confidence: 6  },
      "lac-was": { pickedTeam: "LAC", isCorrect: null,  confidence: 4  },
    },
  },
  {
    userId: "sample-2", displayName: "Big Ray", weekPoints: 16, weekCorrect: 1, rank: 2, isCurrentUser: false,
    picks: {
      "den-no":  { pickedTeam: "DEN", isCorrect: true,  confidence: 16 },
      "jax-chi": { pickedTeam: "JAX", isCorrect: false, confidence: 14 },
      "nyj-ne":  { pickedTeam: "NE",  isCorrect: null,  confidence: 11 },
      "buf-ten": { pickedTeam: "BUF", isCorrect: null,  confidence: 13 },
      "kc-sf":   { pickedTeam: "SF",  isCorrect: null,  confidence: 9  },
      "cin-cle": { pickedTeam: "CIN", isCorrect: null,  confidence: 7  },
      "hou-gb":  { pickedTeam: "GB",  isCorrect: null,  confidence: 6  },
      "phi-nyg": { pickedTeam: "PHI", isCorrect: null,  confidence: 12 },
      "dal-det": { pickedTeam: "DET", isCorrect: null,  confidence: 10 },
      "sea-atl": { pickedTeam: "ATL", isCorrect: null,  confidence: 5  },
      "lar-lv":  { pickedTeam: "LV",  isCorrect: null,  confidence: 8  },
      "pit-bal": { pickedTeam: "BAL", isCorrect: null,  confidence: 15 },
      "tb-ari":  { pickedTeam: "TB",  isCorrect: null,  confidence: 3  },
      "lac-was": { pickedTeam: "LAC", isCorrect: null,  confidence: 4  },
    },
  },
  {
    userId: "sample-3", displayName: "Kayla B", weekPoints: 15, weekCorrect: 1, rank: 3, isCurrentUser: false,
    picks: {
      "den-no":  { pickedTeam: "NO",  isCorrect: false, confidence: 13 },
      "jax-chi": { pickedTeam: "CHI", isCorrect: true,  confidence: 15 },
      "nyj-ne":  { pickedTeam: "NE",  isCorrect: null,  confidence: 9  },
      "buf-ten": { pickedTeam: "BUF", isCorrect: null,  confidence: 16 },
      "kc-sf":   { pickedTeam: "KC",  isCorrect: null,  confidence: 14 },
      "cin-cle": { pickedTeam: "CIN", isCorrect: null,  confidence: 10 },
      "hou-gb":  { pickedTeam: "HOU", isCorrect: null,  confidence: 12 },
      "phi-nyg": { pickedTeam: "PHI", isCorrect: null,  confidence: 8  },
      "dal-det": { pickedTeam: "DAL", isCorrect: null,  confidence: 4  },
      "sea-atl": { pickedTeam: "SEA", isCorrect: null,  confidence: 7  },
      "lar-lv":  { pickedTeam: "LAR", isCorrect: null,  confidence: 2  },
      "pit-bal": { pickedTeam: "PIT", isCorrect: null,  confidence: 5  },
      "tb-ari":  { pickedTeam: "ARI", isCorrect: null,  confidence: 6  },
      "lac-was": { pickedTeam: "LAC", isCorrect: null,  confidence: 11 },
    },
  },
  {
    userId: "sample-4", displayName: "T-Bone", weekPoints: 14, weekCorrect: 1, rank: 4, isCurrentUser: false,
    picks: {
      "den-no":  { pickedTeam: "DEN", isCorrect: true,  confidence: 14 },
      "jax-chi": { pickedTeam: "JAX", isCorrect: false, confidence: 10 },
      "nyj-ne":  { pickedTeam: "NYJ", isCorrect: null,  confidence: 7  },
      "buf-ten": { pickedTeam: "TEN", isCorrect: null,  confidence: 3  },
      "kc-sf":   { pickedTeam: "KC",  isCorrect: null,  confidence: 16 },
      "cin-cle": { pickedTeam: "CLE", isCorrect: null,  confidence: 9  },
      "hou-gb":  { pickedTeam: "GB",  isCorrect: null,  confidence: 6  },
      "phi-nyg": { pickedTeam: "NYG", isCorrect: null,  confidence: 2  },
      "dal-det": { pickedTeam: "DET", isCorrect: null,  confidence: 13 },
      "sea-atl": { pickedTeam: "ATL", isCorrect: null,  confidence: 8  },
      "lar-lv":  { pickedTeam: "LV",  isCorrect: null,  confidence: 15 },
      "pit-bal": { pickedTeam: "BAL", isCorrect: null,  confidence: 12 },
      "tb-ari":  { pickedTeam: "TB",  isCorrect: null,  confidence: 11 },
      "lac-was": { pickedTeam: "WAS", isCorrect: null,  confidence: 5  },
    },
  },
  {
    userId: "sample-5", displayName: "Sully", weekPoints: 0, weekCorrect: 0, rank: 5, isCurrentUser: false,
    picks: {
      "den-no":  { pickedTeam: "NO",  isCorrect: false, confidence: 8  },
      "jax-chi": { pickedTeam: "JAX", isCorrect: false, confidence: 6  },
      "nyj-ne":  { pickedTeam: "NYJ", isCorrect: null,  confidence: 11 },
      "buf-ten": { pickedTeam: "BUF", isCorrect: null,  confidence: 15 },
      "kc-sf":   { pickedTeam: "SF",  isCorrect: null,  confidence: 16 },
      "cin-cle": { pickedTeam: "CIN", isCorrect: null,  confidence: 5  },
      "hou-gb":  { pickedTeam: "HOU", isCorrect: null,  confidence: 14 },
      "phi-nyg": { pickedTeam: "PHI", isCorrect: null,  confidence: 12 },
      "dal-det": { pickedTeam: "DET", isCorrect: null,  confidence: 13 },
      "sea-atl": { pickedTeam: "SEA", isCorrect: null,  confidence: 9  },
      "lar-lv":  { pickedTeam: "LAR", isCorrect: null,  confidence: 4  },
      "pit-bal": { pickedTeam: "PIT", isCorrect: null,  confidence: 7  },
      "tb-ari":  { pickedTeam: "ARI", isCorrect: null,  confidence: 3  },
      "lac-was": { pickedTeam: "LAC", isCorrect: null,  confidence: 10 },
    },
  },
];
