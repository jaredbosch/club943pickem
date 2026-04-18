import type { Slot } from "./types";

/**
 * Fixture data mirroring nfl-ats-pickem-sheet.html.
 * Replace with live data from Supabase + Odds API once the pipeline is wired.
 */
export const week7Slots: Slot[] = [
  {
    id: "thursday",
    label: "thursday night",
    status: "locked",
    statusText: "locked",
    games: [
      {
        id: "den-no",
        away: { abbr: "DEN", record: "4-2", spread: "+3.5" },
        home: { abbr: "NO", record: "3-3", spread: "-3.5" },
        confidence: 16,
        pickedTeam: "DEN",
        result: "correct",
        pointsEarned: 16,
      },
    ],
  },
  {
    id: "intl",
    label: "international (london)",
    status: "locked",
    statusText: "locked",
    games: [
      {
        id: "jax-chi",
        away: { abbr: "JAX", record: "2-4", spread: "+6.5" },
        home: { abbr: "CHI", record: "3-3", spread: "-6.5" },
        confidence: 14,
        pickedTeam: "JAX",
        result: "incorrect",
        pointsEarned: 0,
      },
      {
        id: "nyj-ne",
        away: { abbr: "NYJ", record: "2-4", spread: "+2.5" },
        home: { abbr: "NE", record: "1-5", spread: "-2.5" },
        confidence: 15,
        result: "push",
        pointsEarned: 0,
      },
    ],
  },
  {
    id: "sunday-early",
    label: "sunday 1:00 PM ET",
    status: "live",
    statusText: "live — Q3 2:41",
    games: [
      {
        id: "buf-ten",
        away: { abbr: "BUF", record: "5-1", spread: "-7.0" },
        home: { abbr: "TEN", record: "1-5", spread: "+7.0" },
        confidence: 13,
        pickedTeam: "BUF",
        liveScore: "24-10",
      },
      {
        id: "kc-sf",
        away: { abbr: "KC", record: "5-1", spread: "-3.0" },
        home: { abbr: "SF", record: "3-3", spread: "+3.0" },
        confidence: 11,
        pickedTeam: "SF",
        liveScore: "14-17",
      },
      {
        id: "cin-cle",
        away: { abbr: "CIN", record: "2-4", spread: "+1.5" },
        home: { abbr: "CLE", record: "1-5", spread: "-1.5" },
        confidence: 8,
        pickedTeam: "CIN",
        liveScore: "10-7",
      },
      {
        id: "hou-gb",
        away: { abbr: "HOU", record: "5-1", spread: "-4.5" },
        home: { abbr: "GB", record: "4-2", spread: "+4.5" },
        confidence: 5,
        pickedTeam: "GB",
        liveScore: "13-21",
      },
      {
        id: "phi-nyg",
        away: { abbr: "PHI", record: "3-3", spread: "-2.0" },
        home: { abbr: "NYG", record: "2-4", spread: "+2.0" },
        confidence: 3,
        pickedTeam: "PHI",
        liveScore: "17-3",
      },
    ],
  },
  {
    id: "sunday-late",
    label: "sunday 4:05 PM ET",
    status: "open",
    statusText: "open",
    countdown: "locks in 1h 24m",
    games: [
      {
        id: "dal-det",
        away: { abbr: "DAL", record: "3-3", spread: "+3.0" },
        home: { abbr: "DET", record: "4-2", spread: "-3.0" },
        confidence: 12,
        pickedTeam: "DAL",
      },
      {
        id: "sea-atl",
        away: { abbr: "SEA", record: "4-2", spread: "-1.5" },
        home: { abbr: "ATL", record: "4-2", spread: "+1.5" },
        confidence: 9,
      },
      {
        id: "lar-lv",
        away: { abbr: "LAR", record: "2-4", spread: "+5.5" },
        home: { abbr: "LV", record: "2-4", spread: "-5.5" },
        confidence: 4,
        pickedTeam: "LAR",
      },
    ],
  },
  {
    id: "sunday-night",
    label: "sunday night",
    status: "open",
    statusText: "open",
    countdown: "locks in 5h 34m",
    games: [
      {
        id: "pit-bal",
        away: { abbr: "PIT", record: "4-2", spread: "+2.5" },
        home: { abbr: "BAL", record: "4-2", spread: "-2.5" },
        confidence: 10,
        pickedTeam: "PIT",
      },
    ],
  },
  {
    id: "monday",
    label: "monday night",
    status: "open",
    statusText: "open",
    countdown: "locks in 29h 10m",
    games: [
      {
        id: "tb-ari",
        away: { abbr: "TB", record: "3-3", spread: "-1.0" },
        home: { abbr: "ARI", record: "2-4", spread: "+1.0" },
        confidence: 7,
        pickedTeam: "ARI",
      },
      {
        id: "lac-was",
        away: { abbr: "LAC", record: "3-2", spread: "-3.5" },
        home: { abbr: "WAS", record: "4-2", spread: "+3.5" },
        confidence: 6,
      },
    ],
  },
];

export const confidenceValues = [
  16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
];
export const usedConfidence = new Set([16, 15, 14]);
