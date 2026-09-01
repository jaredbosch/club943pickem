import type {
  KalshiCandlesticksResponse,
  KalshiMarket,
  KalshiMarketsResponse,
} from "./types";

const BASE_URL = "https://api.elections.kalshi.com/trade-api/v2";

// Current NFL game-winner series (verified against GET /series/KXNFLGAME:
// "Professional Football Game", scope: Game).
export const NFL_GAME_SERIES = "KXNFLGAME";

export class KalshiApiError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Kalshi API ${status}: ${body}`);
    this.name = "KalshiApiError";
  }
}

// Fetch every open NFL game-winner market, following the cursor until the
// API runs dry. Public endpoint — no auth.
export async function fetchNflGameMarkets(
  signal?: AbortSignal,
): Promise<KalshiMarket[]> {
  const markets: KalshiMarket[] = [];
  let cursor = "";

  do {
    const url = new URL(`${BASE_URL}/markets`);
    url.searchParams.set("series_ticker", NFL_GAME_SERIES);
    url.searchParams.set("status", "open");
    url.searchParams.set("limit", "200");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url, { cache: "no-store", signal });
    if (!res.ok) {
      throw new KalshiApiError(res.status, await res.text());
    }
    const page = (await res.json()) as KalshiMarketsResponse;
    markets.push(...page.markets);
    cursor = page.cursor;
  } while (cursor);

  return markets;
}

// Market-implied win probability in [0, 1]: bid/ask midpoint when a two-sided
// book exists, otherwise the last traded price. Null when the market has
// never traded and has no book.
export function extractWinProbability(market: KalshiMarket): number | null {
  const bid = Number(market.yes_bid_dollars);
  const ask = Number(market.yes_ask_dollars);
  if (bid > 0 && ask > 0 && ask < 1) return (bid + ask) / 2;
  const last = Number(market.last_price_dollars);
  return last > 0 ? last : null;
}

// Kalshi team code from a market ticker, e.g.
// KXNFLGAME-26SEP21NYGLAR-NYG → NYG. Null if the ticker isn't 3 segments.
export function marketTeamCode(market: KalshiMarket): string | null {
  const parts = market.ticker.split("-");
  return parts.length === 3 ? parts[2] : null;
}

const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};

// Game date (US Eastern, "YYYY-MM-DD") from an event ticker, e.g.
// KXNFLGAME-26SEP21NYGLAR → 2026-09-21.
export function eventGameDate(eventTicker: string): string | null {
  const m = /^KXNFLGAME-(\d{2})([A-Z]{3})(\d{2})/.exec(eventTicker);
  if (!m) return null;
  const month = MONTHS[m[2]];
  if (!month) return null;
  return `20${m[1]}-${String(month).padStart(2, "0")}-${m[3]}`;
}

// Kalshi's team codes differ from ours for two teams.
const KALSHI_TO_APP_ABBR: Record<string, string> = {
  JAC: "JAX",
  WAS: "WSH",
};

export function appTeamAbbr(kalshiCode: string): string {
  return KALSHI_TO_APP_ABBR[kalshiCode] ?? kalshiCode;
}

const APP_TO_KALSHI_ABBR: Record<string, string> = {
  JAX: "JAC",
  WSH: "WAS",
};

export function kalshiTeamCode(appAbbr: string): string {
  return APP_TO_KALSHI_ABBR[appAbbr] ?? appAbbr;
}

// All markets for one event (e.g. the game's winner markets, or the
// KXNFLSPREAD strike ladder). Uses /markets?event_ticker rather than the
// event's with_nested_markets flag — the latter intermittently returns an
// empty markets array (observed 2026-08-28).
export async function fetchEventMarkets(
  eventTicker: string,
  signal?: AbortSignal,
): Promise<KalshiMarket[]> {
  const url = new URL(`${BASE_URL}/markets`);
  url.searchParams.set("event_ticker", eventTicker);
  url.searchParams.set("limit", "100");
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) throw new KalshiApiError(res.status, await res.text());
  return ((await res.json()) as KalshiMarketsResponse).markets ?? [];
}

// Price history for one market. Interval is minutes: 1, 60, or 1440.
export async function fetchMarketCandlesticks(
  seriesTicker: string,
  marketTicker: string,
  startTs: number,
  endTs: number,
  intervalMinutes: 60 | 1440 = 60,
  signal?: AbortSignal,
): Promise<KalshiCandlesticksResponse["candlesticks"]> {
  const url = new URL(
    `${BASE_URL}/series/${seriesTicker}/markets/${marketTicker}/candlesticks`,
  );
  url.searchParams.set("start_ts", String(startTs));
  url.searchParams.set("end_ts", String(endTs));
  url.searchParams.set("period_interval", String(intervalMinutes));
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) throw new KalshiApiError(res.status, await res.text());
  return ((await res.json()) as KalshiCandlesticksResponse).candlesticks;
}

// The spread ladder for a game lives under KXNFLSPREAD with the same
// date+matchup suffix as the KXNFLGAME event.
export function spreadEventTicker(gameEventTicker: string): string {
  return gameEventTicker.replace(/^KXNFLGAME-/, "KXNFLSPREAD-");
}

// Spread strike from a ladder market ticker: KXNFLSPREAD-26SEP09NESEA-SEA4
// means "Seattle wins by over 3.5 points" → { team: "SEA", overPoints: 3.5 }.
export function spreadStrikeFromTicker(
  marketTicker: string,
): { team: string; overPoints: number } | null {
  const last = marketTicker.split("-")[2];
  const m = last ? /^([A-Z]+?)(\d+)$/.exec(last) : null;
  if (!m) return null;
  return { team: m[1], overPoints: Number(m[2]) - 0.5 };
}

// Public market page for an event, with the referral code appended when
// configured (NEXT_PUBLIC_KALSHI_REFERRAL_CODE).
export function kalshiMarketUrl(eventTicker: string, referralCode?: string): string {
  const base = `https://kalshi.com/markets/kxnflgame/pro-football-game/${eventTicker.toLowerCase()}`;
  return referralCode ? `${base}?referral=${encodeURIComponent(referralCode)}` : base;
}
