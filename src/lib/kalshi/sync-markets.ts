import type { SupabaseClient } from "@supabase/supabase-js";
import {
  appTeamAbbr,
  eventGameDate,
  extractWinProbability,
  fetchNflGameMarkets,
  marketTeamCode,
} from "./client";
import type { KalshiMarket } from "./types";

export type KalshiSyncStats = {
  fetched: number;
  events: number;
  matched: number;
  updated: number;
  skipped: { event: string; reason: string }[];
};

// ET calendar date for a kickoff timestamp — Kalshi event tickers carry the
// game's Eastern date, so both sides of the match use the same convention.
function etDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

// Pull open Kalshi NFL game markets and cache the home team's win
// probability + event ticker on our games rows. Matching key: both team
// abbreviations plus the game's ET date. Games Kalshi doesn't list (or that
// we don't carry, e.g. preseason) are left untouched.
export async function syncKalshiMarkets(
  supabase: SupabaseClient,
): Promise<KalshiSyncStats> {
  const markets = await fetchNflGameMarkets();
  const stats: KalshiSyncStats = {
    fetched: markets.length,
    events: 0,
    matched: 0,
    updated: 0,
    skipped: [],
  };

  // Group the per-team binary markets by their game event.
  const byEvent = new Map<string, KalshiMarket[]>();
  for (const m of markets) {
    if (!byEvent.has(m.event_ticker)) byEvent.set(m.event_ticker, []);
    byEvent.get(m.event_ticker)!.push(m);
  }
  stats.events = byEvent.size;
  if (byEvent.size === 0) return stats;

  // One window query instead of a lookup per event. Kalshi lists games a few
  // weeks out; 45 days covers everything it currently posts.
  const now = Date.now();
  const from = new Date(now - 36 * 3600_000).toISOString();
  const to = new Date(now + 45 * 86_400_000).toISOString();
  const { data: games, error } = await supabase
    .from("games")
    .select("id, home_team, away_team, kickoff_time, kalshi_prob, kalshi_ticker")
    .gte("kickoff_time", from)
    .lte("kickoff_time", to);
  if (error) {
    stats.skipped.push({ event: "*", reason: error.message });
    return stats;
  }

  // date + both teams (order-independent) → game row
  const gameKey = (date: string, a: string, b: string) =>
    `${date}:${[a, b].sort().join("-")}`;
  const gamesByKey = new Map(
    (games ?? []).map((g) => [
      gameKey(etDate(g.kickoff_time), g.home_team, g.away_team),
      g,
    ]),
  );

  for (const [eventTicker, eventMarkets] of byEvent) {
    const date = eventGameDate(eventTicker);
    if (!date) {
      stats.skipped.push({ event: eventTicker, reason: "unparseable event ticker" });
      continue;
    }

    // team abbr (our convention) → win probability
    const probs = new Map<string, number>();
    for (const m of eventMarkets) {
      const code = marketTeamCode(m);
      const prob = extractWinProbability(m);
      if (code && prob !== null) probs.set(appTeamAbbr(code), prob);
    }
    if (probs.size === 0) {
      stats.skipped.push({ event: eventTicker, reason: "no priced markets" });
      continue;
    }

    const teams = [...probs.keys()];
    // The ticker's date is ET; a game can still land on the neighboring
    // calendar day in edge cases, so try ±1 day before giving up.
    let game = null;
    for (const offset of [0, 1, -1]) {
      const d = new Date(`${date}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() + offset);
      game = gamesByKey.get(gameKey(d.toISOString().slice(0, 10), teams[0], teams[1] ?? teams[0]));
      if (game) break;
    }
    if (!game) continue; // not a game we carry (e.g. preseason)
    stats.matched++;

    // Home probability directly if priced; otherwise the away complement.
    const homeProb = probs.get(game.home_team)
      ?? (probs.has(game.away_team) ? 1 - probs.get(game.away_team)! : null);
    if (homeProb === null) {
      stats.skipped.push({ event: eventTicker, reason: "no market for either team" });
      continue;
    }

    const rounded = Math.round(homeProb * 1000) / 1000;
    if (game.kalshi_ticker === eventTicker && Number(game.kalshi_prob) === rounded) {
      continue; // unchanged — skip the write
    }

    const { error: updErr } = await supabase
      .from("games")
      .update({
        kalshi_prob: rounded,
        kalshi_ticker: eventTicker,
        kalshi_updated_at: new Date().toISOString(),
      })
      .eq("id", game.id);
    if (updErr) {
      stats.skipped.push({ event: eventTicker, reason: updErr.message });
      continue;
    }
    stats.updated++;
  }

  return stats;
}
