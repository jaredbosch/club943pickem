/**
 * Mock Week 1 dry run — EVALUATE.
 *
 * 1. Pulls real preseason week 1 scores from ESPN and applies them to the
 *    season-1998 mock games (status upgrade + scores, same rules as
 *    lib/espn/sync-scores).
 * 2. Runs the production grade_and_sync_standings RPC for each test league.
 * 3. Independently recomputes every pick's expected result in JS and diffs
 *    against what the DB graded — any mismatch is a bug in the grading path.
 * 4. Prints a markdown report (picks graded, standings, PASS/FAIL per league).
 *
 * Run: set -a; source .env.local; set +a; node scripts/mock-preseason-eval.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { LEAGUES, MOCK_SEASON, MOCK_WEEK, fetchPreseasonWk1 } from './mock-preseason-week.mjs';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SRK);

const ESPN_ABBR_MAP = { WAS: 'WSH', JAC: 'JAX' };
const norm = (a) => ESPN_ABBR_MAP[a] ?? a;

function espnStatus(name, state) {
  if (state === 'post' || name.includes('FINAL')) return 'final';
  if (state === 'in' || name === 'STATUS_HALFTIME' || name === 'STATUS_END_PERIOD') return 'in_progress';
  return null;
}

// Independent re-implementation of grading (mirrors grade_and_sync_standings)
function expected(pick, game, scoring) {
  const isAts = ['ats_confidence', 'ats', 'pick5_ats'].includes(scoring);
  const isConf = ['ats_confidence', 'su_confidence'].includes(scoring);
  const isPick5 = ['pick5_su', 'pick5_ats'].includes(scoring);
  const spread = game.locked_spread_home ?? game.spread_home;
  const margin = game.home_score - game.away_score;
  const push = isAts ? margin + Number(spread) === 0 : game.home_score === game.away_score;
  if (push) return { is_correct: null, points: isPick5 ? 0.5 : 0 };
  const winner = isAts
    ? (margin + Number(spread) > 0 ? game.home_team : game.away_team)
    : (margin > 0 ? game.home_team : game.away_team);
  const correct = pick.picked_team === winner;
  return { is_correct: correct, points: correct ? (isConf ? pick.confidence : 1) : 0 };
}

async function main() {
  const report = [];
  const log = (s) => { report.push(s); console.log(s); };
  log(`# Mock Week 1 evaluation — ${new Date().toISOString()}`);

  // 1. Sync real scores onto mock games
  const sb = await fetchPreseasonWk1();
  const { data: games } = await supabase.from('games')
    .select('*').eq('season_year', MOCK_SEASON);
  let finals = 0, live = 0, pending = 0;
  for (const e of sb.events ?? []) {
    const c = e.competitions[0];
    const home = norm(c.competitors.find(x => x.homeAway === 'home').team.abbreviation);
    const away = norm(c.competitors.find(x => x.homeAway === 'away').team.abbreviation);
    const g = games.find(x => x.home_team === home && x.away_team === away);
    if (!g) continue;
    const st = espnStatus(c.status.type.name, c.status.type.state);
    const hs = parseInt(c.competitors.find(x => x.homeAway === 'home').score ?? '', 10);
    const as = parseInt(c.competitors.find(x => x.homeAway === 'away').score ?? '', 10);
    const upd = {};
    if (!Number.isNaN(hs)) { upd.home_score = hs; g.home_score = hs; }
    if (!Number.isNaN(as)) { upd.away_score = as; g.away_score = as; }
    const order = ['scheduled', 'locked', 'in_progress', 'final'];
    if (st && order.indexOf(st) > order.indexOf(g.status)) { upd.status = st; g.status = st; }
    // Quarter + clock for the live UI (mirrors lib/espn/sync-scores)
    if (st === 'in_progress' || st === 'final') {
      upd.period = c.status.period ?? null;
      upd.display_clock = c.status.displayClock ?? null;
    }
    if (Object.keys(upd).length) await supabase.from('games').update(upd).eq('id', g.id);
    if (g.status === 'final') finals++; else if (g.status === 'in_progress') live++; else pending++;
  }
  log(`\nGames: **${finals} final**, ${live} in progress, ${pending} not started (of ${games.length}).`);
  if (finals === 0) { log('\nNothing to grade yet.'); return; }

  // 2 + 3. Grade each league via prod RPC, then verify independently
  let allPass = true;
  for (const lg of LEAGUES) {
    const { data: rpc, error: rpcErr } = await supabase.rpc('grade_and_sync_standings', {
      p_league_id: lg.id, p_season_year: MOCK_SEASON,
    });
    const { data: picks } = await supabase.from('picks')
      .select('user_id, picked_team, confidence, is_correct, points_earned, game_id')
      .eq('league_id', lg.id).eq('season_year', MOCK_SEASON);
    const mismatches = [];
    for (const p of picks ?? []) {
      const g = games.find(x => x.id === p.game_id);
      if (!g || g.status !== 'final' || g.home_score == null) continue;
      const exp = expected(p, g, lg.scoring);
      const gotPts = p.points_earned == null ? null : Number(p.points_earned);
      if (p.is_correct !== exp.is_correct || gotPts !== exp.points) {
        mismatches.push(`    - ${g.away_team}@${g.home_team} pick=${p.picked_team} conf=${p.confidence}: db(correct=${p.is_correct}, pts=${gotPts}) expected(correct=${exp.is_correct}, pts=${exp.points})`);
      }
    }
    const { data: standings } = await supabase.from('standings')
      .select('user_id, week, total_points, correct_picks, rank, users:user_id(display_name)')
      .eq('league_id', lg.id).eq('season_year', MOCK_SEASON).eq('week', MOCK_WEEK)
      .order('rank');
    const pass = mismatches.length === 0 && !rpcErr;
    if (!pass) allPass = false;
    log(`\n## ${lg.name} (${lg.scoring}) — ${pass ? '✅ PASS' : '❌ FAIL'}`);
    if (rpcErr) log(`  RPC error: ${rpcErr.message}`);
    else log(`  graded_picks=${rpc?.graded_picks ?? 0}${rpc?.weeks ? ` weeks=${JSON.stringify(rpc.weeks)}` : ''}`);
    for (const s of standings ?? []) {
      log(`  ${s.rank}. ${s.users?.display_name ?? s.user_id.slice(0, 8)} — ${s.total_points} pts, ${s.correct_picks} correct`);
    }
    if (mismatches.length) { log(`  ${mismatches.length} grading mismatch(es):`); mismatches.forEach(m => log(m)); }
  }

  log(`\n# Overall: ${allPass ? '✅ ALL FORMATS PASS' : '❌ MISMATCHES FOUND — see above'}`);
  log(pending + live > 0 ? '\n(Partial slate — re-run after all games are final.)' : '\n(Full slate graded.)');
}

main().catch(e => { console.error(e); process.exit(1); });
