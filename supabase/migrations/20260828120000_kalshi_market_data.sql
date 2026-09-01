-- Kalshi market-data cache. kalshi_prob is the market-implied probability
-- (0–1) that the HOME team wins, mirroring spread_home's home-centric
-- convention. kalshi_ticker is the Kalshi event ticker (one event per game,
-- e.g. KXNFLGAME-26SEP21NYGLAR) used to deep-link to the market page.
alter table public.games
  add column if not exists kalshi_prob numeric(4,3)
    check (kalshi_prob is null or (kalshi_prob >= 0 and kalshi_prob <= 1)),
  add column if not exists kalshi_ticker text,
  add column if not exists kalshi_updated_at timestamptz;
