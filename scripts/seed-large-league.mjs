/**
 * Seed a big league to exercise PostgREST's 1000-row response cap.
 *
 * Creates N fake players (default 70) in league `BIGLGE` "Big League Test",
 * plus a full synthetic season (default 18 weeks × 16 games) in season
 * 2099 — a year no real schedule uses, so the real games table is never
 * touched. Weeks 1..N-1 are final and graded; the last week is locked with
 * no results. Every player picks every game with a confidence 1-16, so:
 *
 *   one Grid week        = players × 16 picks     (70 → 1,120 rows)
 *   dashboard weekly rows = players × final weeks (70 → 1,190 rows)
 *
 * — both past the cap. The viewer `bigleague.01@example.com` (password
 * `SeedUser2026!!`) is commissioner; they're also in a 3-player league
 * `SMLLGE` so /home lists both leagues instead of redirecting.
 *
 * Usage (LOCAL/BRANCH DATABASES ONLY):
 *   node scripts/seed-large-league.mjs [--players=70] [--weeks=18] [--clean]
 *
 * Safe to re-run; cleans its own data first. --clean only cleans.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SRK) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

// ── PRODUCTION GUARD ─────────────────────────────────────────────────────────
// 70+ fake accounts and a fake season have no business in production. No
// override flag: point SUPABASE_URL at a local or branch database.
const PROD_PROJECT_REF = 'nmbadqaogfksyjwzrfmr';
if (SUPABASE_URL.includes(PROD_PROJECT_REF)) {
  console.error(
    `\n🛑 REFUSING TO RUN: SUPABASE_URL points at the PRODUCTION project (${PROD_PROJECT_REF}).\n` +
    'Point SUPABASE_URL at a local/branch database instead.\n'
  );
  process.exit(1);
}

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? parseInt(hit.split('=')[1], 10) : fallback;
};
const N_PLAYERS = arg('players', 70);
const N_WEEKS = arg('weeks', 18);
const CLEAN_ONLY = process.argv.includes('--clean');

const SEASON_YEAR = 2099;
const BIG_CODE = 'BIGLGE';
const SMALL_CODE = 'SMLLGE';
const EMAIL = (i) => `bigleague.${String(i + 1).padStart(2, '0')}@example.com`;
const PASSWORD = 'SeedUser2026!!';
const GAMES_PER_WEEK = 16;
const CHUNK = 500;

const TEAMS = [
  'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
  'LV', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'PHI', 'PIT', 'SF', 'SEA', 'TB', 'TEN', 'WAS',
];
const FIRST = ['Alex', 'Blake', 'Casey', 'Drew', 'Emery', 'Finley', 'Gray', 'Harper', 'Indy', 'Jordan', 'Kai', 'Logan', 'Morgan', 'Noel'];
const LAST = ['Archer', 'Brooks', 'Carter', 'Dalton', 'Ellis', 'Foster', 'Garcia', 'Hayes', 'Irwin', 'Jensen', 'Keller', 'Lopez'];

const supabase = createClient(SUPABASE_URL, SRK, { auth: { persistSession: false } });

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function shuffle(arr, r) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function must(res, what) {
  if (res.error) {
    console.error(`${what} failed:`, res.error.message);
    process.exit(1);
  }
  return res.data;
}

async function insertChunked(table, rows) {
  for (let i = 0; i < rows.length; i += CHUNK) {
    must(await supabase.from(table).insert(rows.slice(i, i + CHUNK)), `${table} insert`);
  }
}

// Week 1 Tuesday 05:00 UTC, matching src/lib/nfl/week.ts.
function seasonStart(year) {
  const sep1 = new Date(Date.UTC(year, 8, 1));
  const tue = new Date(sep1);
  tue.setUTCDate(1 + ((1 - sep1.getUTCDay() + 7) % 7) + 1);
  tue.setUTCHours(5, 0, 0, 0);
  return tue;
}

// Circle-method round robin: 16 distinct matchups per week.
function weekPairings(week) {
  const rest = TEAMS.slice(1);
  const k = (week - 1) % rest.length;
  const rotated = [...rest.slice(k), ...rest.slice(0, k)];
  const ring = [TEAMS[0], ...rotated];
  const pairs = [];
  for (let i = 0; i < GAMES_PER_WEEK; i++) {
    const a = ring[i];
    const b = ring[ring.length - 1 - i];
    pairs.push((week + i) % 2 ? { away: a, home: b } : { away: b, home: a });
  }
  return pairs;
}

const SLOTS = [
  ['thursday', 3, 0], // [time_slot, days after Tuesday, UTC hour]
  ...Array.from({ length: 9 }, () => ['sunday_early', 5, 17]),
  ...Array.from({ length: 4 }, () => ['sunday_late', 5, 20]),
  ['sunday_night', 6, 0],
  ['monday', 7, 0],
];

async function listSeedAuthUsers() {
  const found = [];
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    found.push(...data.users.filter((u) => /^bigleague\.\d+@example\.com$/.test(u.email ?? '')));
    if (data.users.length < 1000) return found;
  }
}

async function clean() {
  console.log('Cleaning previous big-league seed…');
  // Leagues cascade to members, picks, standings and tiebreaker guesses.
  must(await supabase.from('leagues').delete().in('invite_code', [BIG_CODE, SMALL_CODE]), 'league delete');
  must(await supabase.from('games').delete().eq('season_year', SEASON_YEAR), 'games delete');
  for (const u of await listSeedAuthUsers()) {
    const { error } = await supabase.auth.admin.deleteUser(u.id);
    if (error) console.error(`  could not delete ${u.email}: ${error.message}`);
  }
  console.log('  done.\n');
}

async function main() {
  console.log(`=== Big league seed: ${N_PLAYERS} players × ${N_WEEKS} weeks (season ${SEASON_YEAR}) ===\n`);
  await clean();
  if (CLEAN_ONLY) return;

  // ── Users ──────────────────────────────────────────────────────────────────
  console.log(`Creating ${N_PLAYERS} users…`);
  const userIds = [];
  for (let i = 0; i < N_PLAYERS; i++) {
    const name = `${FIRST[i % FIRST.length]} ${LAST[Math.floor(i / FIRST.length) % LAST.length]} ${i + 1}`;
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL(i),
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: name },
    });
    if (error) { console.error(`  ${EMAIL(i)}: ${error.message}`); process.exit(1); }
    userIds.push(data.user.id);
    must(await supabase.from('users').update({ display_name: name }).eq('id', data.user.id), 'display_name');
  }
  console.log('  done.\n');

  // ── Leagues + members ──────────────────────────────────────────────────────
  const big = must(await supabase.from('leagues').insert({
    name: 'Big League Test', invite_code: BIG_CODE, commissioner_id: userIds[0],
    season_year: SEASON_YEAR, status: 'active', scoring_type: 'ats_confidence', max_players: 150,
  }).select('id').single(), 'big league');
  const small = must(await supabase.from('leagues').insert({
    name: 'Small League Test', invite_code: SMALL_CODE, commissioner_id: userIds[0],
    season_year: SEASON_YEAR, status: 'active', scoring_type: 'ats_confidence', max_players: 10,
  }).select('id').single(), 'small league');

  await insertChunked('league_members', [
    ...userIds.map((user_id, i) => ({ league_id: big.id, user_id, is_commissioner: i === 0, is_paid: i % 4 !== 0 })),
    ...userIds.slice(0, 3).map((user_id, i) => ({ league_id: small.id, user_id, is_commissioner: i === 0, is_paid: true })),
  ]);
  console.log(`Leagues: ${BIG_CODE} (${N_PLAYERS} members), ${SMALL_CODE} (3 members)\n`);

  // ── Games ──────────────────────────────────────────────────────────────────
  const start = seasonStart(SEASON_YEAR);
  const gameRows = [];
  for (let week = 1; week <= N_WEEKS; week++) {
    const final = week < N_WEEKS;
    const r = rng(week * 7919);
    weekPairings(week).forEach(({ away, home }, i) => {
      const [slot, dayOffset, hour] = SLOTS[i];
      const kickoff = new Date(start.getTime() + ((week - 1) * 7 + dayOffset) * 86400000);
      kickoff.setUTCHours(hour, 0, 0, 0);
      const spread = (Math.floor(r() * 10) + 0.5) * (r() < 0.5 ? 1 : -1); // half points: no pushes
      gameRows.push({
        season_year: SEASON_YEAR, week, home_team: home, away_team: away,
        kickoff_time: kickoff.toISOString(), time_slot: slot,
        spread_home: spread, locked_spread_home: spread,
        status: final ? 'final' : 'locked',
        home_score: final ? 10 + Math.floor(r() * 25) : null,
        away_score: final ? 10 + Math.floor(r() * 25) : null,
      });
    });
  }
  const games = [];
  for (let i = 0; i < gameRows.length; i += CHUNK) {
    games.push(...must(await supabase.from('games').insert(gameRows.slice(i, i + CHUNK)).select('*'), 'games insert'));
  }
  console.log(`Games: ${games.length} (${N_WEEKS - 1} final weeks + 1 locked)\n`);

  // ── Picks, standings, tiebreakers ──────────────────────────────────────────
  const byWeek = new Map();
  for (const g of games) byWeek.set(g.week, [...(byWeek.get(g.week) ?? []), g]);

  const picks = [];
  const tiebreakers = [];
  const weekly = new Map(); // `${userId}:${week}` → { pts, correct }
  userIds.forEach((userId, ui) => {
    const r = rng(ui * 104729 + 17);
    for (const [week, wGames] of byWeek) {
      const confs = shuffle(Array.from({ length: wGames.length }, (_, i) => i + 1), r);
      const tally = { pts: 0, correct: 0 };
      wGames.forEach((g, gi) => {
        const picked = r() < 0.5 ? g.home_team : g.away_team;
        let isCorrect = null;
        let points = null;
        if (g.status === 'final') {
          const margin = g.home_score - g.away_score + Number(g.locked_spread_home);
          const winner = margin > 0 ? g.home_team : margin < 0 ? g.away_team : null;
          isCorrect = winner === null ? null : picked === winner;
          points = isCorrect ? confs[gi] : 0;
          if (isCorrect) { tally.pts += points; tally.correct++; }
        }
        picks.push({
          user_id: userId, league_id: big.id, game_id: g.id, week,
          picked_team: picked, confidence: confs[gi], is_locked: true,
          is_correct: isCorrect, points_earned: points,
        });
      });
      weekly.set(`${userId}:${week}`, tally);
      const mnf = wGames.find((g) => g.time_slot === 'monday');
      if (mnf) {
        tiebreakers.push({
          user_id: userId, league_id: big.id, game_id: mnf.id, week, guess: 30 + Math.floor(r() * 40),
          actual_total: mnf.status === 'final' ? mnf.home_score + mnf.away_score : null,
        });
      }
    }
  });
  await insertChunked('picks', picks);
  await insertChunked('tiebreaker_guesses', tiebreakers);

  // Competition ranking: ties share a rank, the next rank skips.
  const ranked = (scores) => {
    const sorted = [...scores].sort((a, b) => b.pts - a.pts);
    let rank = 0;
    return sorted.map((s, i) => {
      if (i === 0 || sorted[i - 1].pts !== s.pts) rank = i + 1;
      return { ...s, rank };
    });
  };
  const standings = [];
  const finalWeeks = [...byWeek.keys()].filter((w) => w < N_WEEKS);
  for (const week of finalWeeks) {
    for (const s of ranked(userIds.map((userId) => ({ userId, ...weekly.get(`${userId}:${week}`) })))) {
      standings.push({ user_id: s.userId, league_id: big.id, week, season_year: SEASON_YEAR,
        total_points: s.pts, correct_picks: s.correct, rank: s.rank });
    }
  }
  const season = userIds.map((userId) => finalWeeks.reduce((acc, w) => {
    const t = weekly.get(`${userId}:${w}`);
    return { userId, pts: acc.pts + t.pts, correct: acc.correct + t.correct };
  }, { userId, pts: 0, correct: 0 }));
  for (const s of ranked(season)) {
    standings.push({ user_id: s.userId, league_id: big.id, week: 0, season_year: SEASON_YEAR,
      total_points: s.pts, correct_picks: s.correct, rank: s.rank });
  }
  await insertChunked('standings', standings);

  console.log('=== Seed complete ===');
  console.log(`Picks:        ${picks.length} (${N_PLAYERS * GAMES_PER_WEEK} per week)`);
  console.log(`Standings:    ${standings.length} (${N_PLAYERS * finalWeeks.length} weekly rows)`);
  console.log(`Tiebreakers:  ${tiebreakers.length}`);
  console.log(`\nSign in as ${EMAIL(0)} / ${PASSWORD}`);
  console.log(`Grid:      /league/${BIG_CODE}/grid?week=${N_WEEKS}`);
  console.log(`Dashboard: /league/${BIG_CODE}/dashboard`);
}

main().catch((e) => { console.error(e); process.exit(1); });
