import { NextResponse, type NextRequest } from "next/server";
import {
  NFL_GAME_SERIES,
  extractWinProbability,
  fetchEventMarkets,
  fetchMarketCandlesticks,
  marketTeamCode,
  spreadEventTicker,
  spreadStrikeFromTicker,
} from "@/lib/kalshi/client";
import type { KalshiGamePanelData, KalshiSpreadStrike } from "@/lib/kalshi/types";

export const runtime = "nodejs";

// Read-only proxy for the Kalshi market panel. Kalshi's API rejects
// cross-origin browser requests, so the panel fetches through us. Only the
// two whitelisted ticker shapes below ever reach Kalshi.
const TICKER_RE = /^KXNFLGAME-[A-Z0-9]{5,24}$/;
const CODE_RE = /^[A-Z]{2,3}$/;

const HISTORY_DAYS = 7;

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();
  const homeCode = (request.nextUrl.searchParams.get("home") ?? "").toUpperCase();
  if (!TICKER_RE.test(ticker) || !CODE_RE.test(homeCode)) {
    return NextResponse.json({ error: "bad ticker" }, { status: 400 });
  }

  try {
    const [gameMarkets, spreadMarkets] = await Promise.all([
      fetchEventMarkets(ticker),
      // A missing spread ladder (e.g. preseason) shouldn't sink the panel.
      fetchEventMarkets(spreadEventTicker(ticker)).catch(() => []),
    ]);

    const byCode = new Map(
      gameMarkets.map((m) => [marketTeamCode(m), m] as const),
    );
    const homeMarket = byCode.get(homeCode) ?? null;
    const awayEntry = [...byCode.entries()].find(([c]) => c !== homeCode);
    if (!homeMarket || !awayEntry) {
      return NextResponse.json({ error: "market not found" }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    const history = await fetchMarketCandlesticks(
      NFL_GAME_SERIES,
      homeMarket.ticker,
      now - HISTORY_DAYS * 86_400,
      now,
      60,
    ).catch(() => []);

    const spread: KalshiSpreadStrike[] = spreadMarkets.flatMap((m) => {
      const strike = spreadStrikeFromTicker(m.ticker);
      const prob = extractWinProbability(m);
      return strike && prob !== null
        ? [{ team: strike.team, overPoints: strike.overPoints, prob }]
        : [];
    });

    const body: KalshiGamePanelData = {
      event: ticker,
      home: { code: homeCode, prob: extractWinProbability(homeMarket) },
      away: { code: awayEntry[0] ?? "", prob: extractWinProbability(awayEntry[1]) },
      history: history.flatMap((c) => {
        const close = Number(c.price?.close_dollars);
        return close > 0
          ? [{ ts: c.end_period_ts, homeProb: close }]
          : [];
      }),
      spread,
    };

    return NextResponse.json(body, {
      headers: {
        // One minute of CDN freshness matches the sync cadence; keep Kalshi
        // out of the per-click hot path.
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
