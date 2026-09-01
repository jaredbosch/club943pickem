// Shape of the Kalshi Trade API v2 responses we consume, trimmed to the
// fields the sync uses.
//
// Docs: https://docs.kalshi.com/ (public endpoints, no auth required)
//
// NFL game winners live under the series KXNFLGAME ("Professional Football
// Game"). Each game is one event (KXNFLGAME-26SEP21NYGLAR) holding one binary
// market per team; the market ticker's last segment is Kalshi's team code
// (KXNFLGAME-26SEP21NYGLAR-NYG). Prices are dollar strings in [0, 1].

export type KalshiMarket = {
  ticker: string;
  event_ticker: string;
  status: string;
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  last_price_dollars: string;
  yes_sub_title?: string;
};

export type KalshiMarketsResponse = {
  markets: KalshiMarket[];
  cursor: string;
};

// GET /series/{series}/markets/{ticker}/candlesticks — trimmed.
export type KalshiCandlestick = {
  end_period_ts: number;
  price: {
    close_dollars: string;
    mean_dollars: string;
  };
};

export type KalshiCandlesticksResponse = {
  candlesticks: KalshiCandlestick[];
};

// Compact shapes served by our /api/kalshi/game/[ticker] proxy route.
export type KalshiSpreadStrike = {
  team: string; // Kalshi team code, e.g. "SEA"
  overPoints: number; // wins by over N.5 points
  prob: number; // 0–1
};

export type KalshiGamePanelData = {
  event: string;
  home: { code: string; prob: number | null };
  away: { code: string; prob: number | null };
  history: { ts: number; homeProb: number }[];
  spread: KalshiSpreadStrike[];
};
