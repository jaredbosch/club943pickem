/**
 * Mock preseason dry run — SPREAD REFRESH.
 *
 * mock-preseason-week.mjs captures each game's spread once, at seed time, and
 * falls back to 0 when no line is posted yet. That is not a neutral default:
 * a 0 line makes every ATS test league grade as pick'em. This re-reads live
 * lines and updates spread_home / locked_spread_home in place for one mock
 * week. Non-destructive — it touches only those two columns, so picks, scores,
 * and standings survive. Re-run any time before kickoff to track line movement.
 *
 * Source: The Odds API, sport key `americanfootball_nfl_preseason`. Note that
 * production's sync-games cron asks for `americanfootball_nfl`, which is
 * REGULAR SEASON ONLY — preseason is a separate key it never requests, and it
 * could not use these rows anyway (it derives season_year from the real
 * kickoff, so it only ever writes 2026, never the 1998 mock season).
 * Consensus of ~9 sportsbooks; costs 1 credit per run against the 500/mo tier.
 *
 * Falls back to ESPN per-game when the Odds API has no match (or no API key).
 * ESPN carries a single DraftKings line and drops it entirely once a game is
 * final, so lines for a completed week are not recoverable from either source.
 *
 * Run: set -a; source .env.local; set +a; \
 *      MOCK_WEEK=18 PRESEASON_WEEK=3 node scripts/mock-preseason-spreads.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { LEAGUES, MOCK_SEASON, MOCK_WEEK, ESPN_PRESEASON_WEEK, fetchPreseasonSlate } from './mock-preseason-week.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SRK) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SRK);

// Mirrors src/lib/nfl/teams.ts (that file is TS; this script is plain .mjs).
const NFL_TEAM_ABBR = {
  'Arizona Cardinals': 'ARI', 'Atlanta Falcons': 'ATL', 'Baltimore Ravens': 'BAL',
  'Buffalo Bills': 'BUF', 'Carolina Panthers': 'CAR', 'Chicago Bears': 'CHI',
  'Cincinnati Bengals': 'CIN', 'Cleveland Browns': 'CLE', 'Dallas Cowboys': 'DAL',
  'Denver Broncos': 'DEN', 'Detroit Lions': 'DET', 'Green Bay Packers': 'GB',
  'Houston Texans': 'HOU', 'Indianapolis Colts': 'IND', 'Jacksonville Jaguars': 'JAX',
  'Kansas City Chiefs': 'KC', 'Las Vegas Raiders': 'LV', 'Los Angeles Chargers': 'LAC',
  'Los Angeles Rams': 'LAR', 'Miami Dolphins': 'MIA', 'Minnesota Vikings': 'MIN',
  'New England Patriots': 'NE', 'New Orleans Saints': 'NO', 'New York Giants': 'NYG',
  'New York Jets': 'NYJ', 'Philadelphia Eagles': 'PHI', 'Pittsburgh Steelers': 'PIT',
  'San Francisco 49ers': 'SF', 'Seattle Seahawks': 'SEA', 'Tampa Bay Buccaneers': 'TB',
  'Tennessee Titans': 'TEN', 'Washington Commanders': 'WSH',
};
const ESPN_ABBR_MAP = { WAS: 'WSH', JAC: 'JAX' };
const norm = (a) => ESPN_ABBR_MAP[a] ?? a;

// Home-team spread from the first bookmaker with a complete spreads market —
// same rule as extractHomeSpread() in src/lib/odds/client.ts.
function homeSpread(game) {
  for (const book of game.bookmakers ?? []) {
    const market = (book.markets ?? []).find(m => m.key === 'spreads');
    const home = (market?.outcomes ?? []).find(o => o.name === game.home_team);
    if (home?.point !== undefined) return { spread: home.point, book: book.title ?? book.key };
  }
  return null;
}

async function fetchOddsApiPreseason(apiKey) {
  const url = new URL('https://api.the-odds-api.com/v4/sports/americanfootball_nfl_preseason/odds');
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('regions', 'us');
  url.searchParams.set('markets', 'spreads');
  url.searchParams.set('oddsFormat', 'american');
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Odds API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const games = await res.json();
  return { games, remaining: res.headers.get('x-requests-remaining') };
}

async function main() {
  console.log(`── Spread refresh: season ${MOCK_SEASON} week ${MOCK_WEEK} ──`);

  const { data: games, error } = await supabase.from('games')
    .select('id, home_team, away_team, status, spread_home, locked_spread_home')
    .eq('season_year', MOCK_SEASON).eq('week', MOCK_WEEK);
  if (error) { console.error('games fetch:', error.message); process.exit(1); }
  if (!games?.length) { console.error(`No season-${MOCK_SEASON} week-${MOCK_WEEK} games.`); process.exit(1); }

  // Primary: The Odds API preseason key (multi-book consensus).
  const lines = new Map(); // "AWAY@HOME" -> { spread, source }
  const apiKey = process.env.ODDS_API_KEY;
  if (apiKey) {
    try {
      const { games: odds, remaining } = await fetchOddsApiPreseason(apiKey);
      for (const g of odds) {
        const home = NFL_TEAM_ABBR[g.home_team], away = NFL_TEAM_ABBR[g.away_team];
        if (!home || !away) { console.warn(`  ? unmapped team: ${g.away_team} @ ${g.home_team}`); continue; }
        const hs = homeSpread(g);
        if (hs) lines.set(`${away}@${home}`, { spread: hs.spread, source: hs.book });
      }
      console.log(`  Odds API: ${lines.size} lines from ${odds.length} preseason games (${remaining} credits left)`);
    } catch (e) {
      console.warn(`  Odds API failed (${e.message}) — falling back to ESPN`);
    }
  } else {
    console.warn('  No ODDS_API_KEY — using ESPN only');
  }

  // Fallback: ESPN's single DraftKings line, for anything still unmatched.
  if (lines.size < games.length) {
    try {
      const sb = await fetchPreseasonSlate();
      for (const e of sb.events ?? []) {
        const c = e.competitions[0];
        const home = norm(c.competitors.find(x => x.homeAway === 'home').team.abbreviation);
        const away = norm(c.competitors.find(x => x.homeAway === 'away').team.abbreviation);
        const spread = (c.odds ?? [])[0]?.spread;
        if (spread != null && !lines.has(`${away}@${home}`)) {
          lines.set(`${away}@${home}`, { spread, source: 'ESPN' });
        }
      }
      console.log(`  ESPN (preseason week ${ESPN_PRESEASON_WEEK}): ${lines.size} total lines after fallback`);
    } catch (e) {
      console.warn(`  ESPN fallback failed: ${e.message}`);
    }
  }

  let updated = 0, unchanged = 0, missing = 0;
  for (const g of games) {
    const hit = lines.get(`${g.away_team}@${g.home_team}`);
    if (!hit) {
      console.log(`  ${g.away_team}@${g.home_team}: no line${g.status === 'final' ? ' (final — gone for good)' : ' posted yet'}`);
      missing++;
      continue;
    }
    if (Number(g.locked_spread_home) === Number(hit.spread) && Number(g.spread_home) === Number(hit.spread)) {
      unchanged++;
      continue;
    }
    const { error: uErr } = await supabase.from('games')
      .update({ spread_home: hit.spread, locked_spread_home: hit.spread }).eq('id', g.id);
    if (uErr) { console.error(`  ${g.away_team}@${g.home_team} update:`, uErr.message); process.exit(1); }
    console.log(`  ${g.away_team}@${g.home_team}: ${g.locked_spread_home} → ${hit.spread}  (${hit.source})`);
    updated++;
  }

  console.log(`\n${updated} updated, ${unchanged} already current, ${missing} without a line.`);
  if (updated && games.some(g => g.status === 'final')) {
    console.log('Some games are already final — re-run mock-preseason-eval.mjs to regrade against the new lines.');
  }
  if (missing) {
    const ats = LEAGUES.filter(l => l.scoring.includes('ats')).length;
    console.log(`A 0 spread grades as pick'em in the ${ats} ATS leagues (of ${LEAGUES.length}).`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
