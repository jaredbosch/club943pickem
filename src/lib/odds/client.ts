import type { OddsApiGame } from "./types";

const BASE_URL = "https://api.the-odds-api.com/v4";

export class OddsApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Odds API ${status}: ${body}`);
    this.name = "OddsApiError";
  }
}

export async function fetchNflOdds(
  apiKey: string,
  signal?: AbortSignal,
): Promise<OddsApiGame[]> {
  const url = new URL(`${BASE_URL}/sports/americanfootball_nfl/odds`);
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "spreads");
  url.searchParams.set("oddsFormat", "american");

  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) {
    throw new OddsApiError(res.status, await res.text());
  }
  return (await res.json()) as OddsApiGame[];
}

// Pick the spread point from the home-team outcome of the first bookmaker
// that has a complete spreads market. Returns null if no spread is posted yet.
export function extractHomeSpread(game: OddsApiGame): number | null {
  for (const book of game.bookmakers) {
    const market = book.markets.find((m) => m.key === "spreads");
    if (!market) continue;
    const home = market.outcomes.find((o) => o.name === game.home_team);
    if (home?.point !== undefined) return home.point;
  }
  return null;
}
