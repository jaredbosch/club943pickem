/**
 * Minimal client for The Odds API (§4.1).
 * Docs: https://the-odds-api.com/liveapi/guides/v4/
 */

const BASE = "https://api.the-odds-api.com/v4";
const SPORT = "americanfootball_nfl";

export type OddsApiGame = {
  id: string;
  commence_time: string; // ISO UTC
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price?: number; point?: number }>;
    }>;
  }>;
};

export type OddsApiScore = {
  id: string;
  completed: boolean;
  commence_time: string;
  home_team: string;
  away_team: string;
  scores: Array<{ name: string; score: string }> | null;
};

function apiKey(): string {
  const key = process.env.ODDS_API_KEY;
  if (!key) throw new Error("ODDS_API_KEY not configured");
  return key;
}

export async function fetchOdds(): Promise<OddsApiGame[]> {
  const url = new URL(`${BASE}/sports/${SPORT}/odds`);
  url.searchParams.set("apiKey", apiKey());
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "spreads");
  url.searchParams.set("oddsFormat", "american");
  url.searchParams.set("dateFormat", "iso");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`odds api ${res.status}: ${await res.text()}`);
  return (await res.json()) as OddsApiGame[];
}

export async function fetchScores(daysFrom = 3): Promise<OddsApiScore[]> {
  const url = new URL(`${BASE}/sports/${SPORT}/scores`);
  url.searchParams.set("apiKey", apiKey());
  url.searchParams.set("daysFrom", String(daysFrom));
  url.searchParams.set("dateFormat", "iso");

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`odds api ${res.status}: ${await res.text()}`);
  return (await res.json()) as OddsApiScore[];
}

/**
 * Picks the median home spread across all bookmakers using the `spreads` market.
 * Returns null if no bookmaker is quoting the game.
 */
export function medianHomeSpread(game: OddsApiGame): number | null {
  const points: number[] = [];
  for (const bm of game.bookmakers) {
    const spreads = bm.markets.find((m) => m.key === "spreads");
    if (!spreads) continue;
    const home = spreads.outcomes.find((o) => o.name === game.home_team);
    if (home?.point !== undefined) points.push(home.point);
  }
  if (points.length === 0) return null;
  points.sort((a, b) => a - b);
  const mid = Math.floor(points.length / 2);
  return points.length % 2 === 0
    ? (points[mid - 1] + points[mid]) / 2
    : points[mid];
}
