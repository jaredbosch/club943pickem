/**
 * Mock preseason dry run — SPREAD REFRESH.
 *
 * ESPN posts DraftKings lines only a few days before kickoff, and drops them
 * again once a game is final. mock-preseason-week.mjs captures the spread once,
 * at seed time, so a slate seeded early lands with spread_home = 0 — which
 * silently turns every ATS league into a straight-up league.
 *
 * This re-reads the live ESPN odds and updates spread_home / locked_spread_home
 * in place for one mock week. Non-destructive: it touches only those two
 * columns, so picks, scores, and standings survive. Re-run any time before
 * kickoff to pick up line movement.
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

const ESPN_ABBR_MAP = { WAS: 'WSH', JAC: 'JAX' };
const norm = (a) => ESPN_ABBR_MAP[a] ?? a;

async function main() {
  console.log(`── Spread refresh: season ${MOCK_SEASON} week ${MOCK_WEEK} ← ESPN preseason week ${ESPN_PRESEASON_WEEK} ──`);

  const sb = await fetchPreseasonSlate();
  const { data: games, error } = await supabase.from('games')
    .select('id, home_team, away_team, status, spread_home, locked_spread_home')
    .eq('season_year', MOCK_SEASON).eq('week', MOCK_WEEK);
  if (error) { console.error('games fetch:', error.message); process.exit(1); }
  if (!games?.length) { console.error(`No season-${MOCK_SEASON} week-${MOCK_WEEK} games.`); process.exit(1); }

  let updated = 0, unchanged = 0, noOdds = 0;
  for (const e of sb.events ?? []) {
    const c = e.competitions[0];
    const home = norm(c.competitors.find(x => x.homeAway === 'home').team.abbreviation);
    const away = norm(c.competitors.find(x => x.homeAway === 'away').team.abbreviation);
    const g = games.find(x => x.home_team === home && x.away_team === away);
    if (!g) continue;

    const spread = (c.odds ?? [])[0]?.spread;
    if (spread == null) {
      // ESPN drops odds once a game is final — nothing to recover there.
      console.log(`  ${away}@${home}: no ESPN odds${g.status === 'final' ? ' (final — line is gone for good)' : ' yet'}`);
      noOdds++;
      continue;
    }
    if (Number(g.locked_spread_home) === Number(spread) && Number(g.spread_home) === Number(spread)) {
      unchanged++;
      continue;
    }
    const { error: uErr } = await supabase.from('games')
      .update({ spread_home: spread, locked_spread_home: spread }).eq('id', g.id);
    if (uErr) { console.error(`  ${away}@${home} update:`, uErr.message); process.exit(1); }
    console.log(`  ${away}@${home}: ${g.locked_spread_home} → ${spread}`);
    updated++;
  }

  console.log(`\n${updated} updated, ${unchanged} already current, ${noOdds} without ESPN odds.`);
  if (updated && games.some(g => g.status === 'final')) {
    console.log('Some games are already final — re-run mock-preseason-eval.mjs to regrade against the new lines.');
  }
  if (noOdds) {
    console.log(`Note: leagues graded ATS treat a 0 spread as pick'em (${LEAGUES.filter(l => l.scoring.includes('ats')).length} of ${LEAGUES.length} test leagues).`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
