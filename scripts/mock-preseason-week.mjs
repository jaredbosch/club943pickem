/**
 * Mock Week 1 dry run — SETUP.
 *
 * Seeds the 6 test-format leagues with the real 2026 preseason week 1 slate
 * (ESPN seasontype=1 week=2) under season_year 1998, so nothing collides with
 * the real 2026 season, real leagues, or the score-sync cron (which only
 * touches the current regular season). Creates 2 mock users and picks for all
 * 3 members (Jared + 2 mocks) in every league, per that league's format.
 *
 * Companion: mock-preseason-eval.mjs pulls real finals, grades, verifies.
 * Idempotent — cleans its own 1998-season data first. Safe on prod by design:
 * it only writes season-1998 games and rows scoped to the 6 test league ids.
 *
 * Run: set -a; source .env.local; set +a; node scripts/mock-preseason-week.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SRK) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SRK);

export const MOCK_SEASON = 1998;
export const MOCK_WEEK = 18; // nflWeek() clamps a past season to 18, so the UI lands here
const JARED = '99810dab-0770-4d84-8c19-1f5713bd89c7';

export const LEAGUES = [
  { id: 'b30e4adb-6737-421e-be83-08675e9adb99', name: 'Club943 Test',          scoring: 'ats_confidence' },
  { id: '2cca433f-f03e-4674-b3ab-e2b0793d1af5', name: 'Test — ATS Only',       scoring: 'ats' },
  { id: 'b29c3f4a-7072-44c0-864a-19885a6f8152', name: 'Test — Straight Up',    scoring: 'straight_up' },
  { id: 'd202b52b-d1eb-4a39-9ee5-8bc2b76b8268', name: 'Test — SU + Confidence', scoring: 'su_confidence' },
  { id: '068f4a02-7e3c-4768-a42d-5a88de66d77d', name: 'Test — Pick 5 SU',      scoring: 'pick5_su' },
  { id: 'b6fdbbe0-65e7-4cf8-9f8d-0e735b477f1d', name: 'Test — Pick 5 ATS',     scoring: 'pick5_ats' },
];

const MOCK_USERS = [
  { email: 'mock.alpha.tpp@mailinator.com', name: 'Mock Alpha' },
  { email: 'mock.bravo.tpp@mailinator.com', name: 'Mock Bravo' },
];

const ESPN_ABBR_MAP = { WAS: 'WSH', JAC: 'JAX' };
const norm = (a) => ESPN_ABBR_MAP[a] ?? a;

function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
function hashSeed(str) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return h;
}

export async function fetchPreseasonWk1() {
  const url = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=1&week=2&dates=2026';
  const res = await fetch(url, { headers: { 'User-Agent': 'thepickempool/1.0' } });
  if (!res.ok) throw new Error(`ESPN ${res.status}`);
  return res.json();
}

// Map real kickoff to our time_slot enum. The latest game gets 'monday' so it
// serves as the tiebreaker ("MNF") game in confidence formats.
// Uses EASTERN day/hour (mirrors src/lib/nfl/time-slot.ts) — the old UTC
// version pushed Thu 8:00PM ET games (= Fri 00:00 UTC) into sunday_early.
function timeSlot(dateIso, isLast) {
  if (isLast) return 'monday';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'short', hour: '2-digit', hour12: false,
  }).formatToParts(new Date(dateIso));
  const day = parts.find(p => p.type === 'weekday')?.value;
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10) % 24;
  if (day === 'Thu') return 'thursday';
  if (day === 'Fri' || day === 'Sat') return hour < 19 ? 'sunday_early' : 'sunday_late';
  if (day === 'Sun') {
    if (hour < 12) return 'intl';
    if (hour < 16) return 'sunday_early';
    if (hour < 20) return 'sunday_late';
    return 'sunday_night';
  }
  return 'monday';
}

async function main() {
  console.log('── Mock Week 1 setup (season 1998) ──');

  // 1. Clean previous mock data
  await supabase.from('standings').delete().eq('season_year', MOCK_SEASON)
    .in('league_id', LEAGUES.map(l => l.id));
  await supabase.from('games').delete().eq('season_year', MOCK_SEASON); // cascades picks/tiebreakers

  // 2. ESPN slate
  const sb = await fetchPreseasonWk1();
  const events = (sb.events ?? []).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (events.length === 0) { console.error('No preseason events from ESPN'); process.exit(1); }
  const lastId = events[events.length - 1].id;

  const gameRows = events.map(e => {
    const c = e.competitions[0];
    const home = c.competitors.find(x => x.homeAway === 'home');
    const away = c.competitors.find(x => x.homeAway === 'away');
    const spread = (c.odds ?? [])[0]?.spread ?? 0; // ESPN spread = home-team line
    return {
      external_id: `mock1998-${e.id}`,
      week: MOCK_WEEK,
      season_year: MOCK_SEASON,
      home_team: norm(home.team.abbreviation),
      away_team: norm(away.team.abbreviation),
      kickoff_time: e.date,
      time_slot: timeSlot(e.date, e.id === lastId),
      spread_home: spread,
      locked_spread_home: spread,
      status: 'scheduled',
    };
  });
  const { data: games, error: gErr } = await supabase.from('games').insert(gameRows)
    .select('id, home_team, away_team, time_slot, locked_spread_home');
  if (gErr) { console.error('games insert:', gErr.message); process.exit(1); }
  console.log(`  ${games.length} mock games inserted`);
  const mnf = games.find(g => g.time_slot === 'monday');

  // 3. Mock users (idempotent)
  const memberIds = [JARED];
  const { data: page } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const mu of MOCK_USERS) {
    let existing = page?.users?.find(u => u.email === mu.email);
    if (!existing) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: mu.email, password: 'MockUser2026!!', email_confirm: true,
        user_metadata: { display_name: mu.name },
      });
      if (error) { console.error(`create ${mu.email}:`, error.message); process.exit(1); }
      existing = data.user;
    }
    await supabase.from('users').update({ display_name: mu.name }).eq('id', existing.id);
    memberIds.push(existing.id);
    console.log(`  user ${mu.name} → ${existing.id.slice(0, 8)}`);
  }

  // 4. Memberships
  for (const lg of LEAGUES) {
    for (const uid of memberIds) {
      const { data: m } = await supabase.from('league_members').select('id')
        .eq('league_id', lg.id).eq('user_id', uid).maybeSingle();
      if (!m) await supabase.from('league_members').insert({
        league_id: lg.id, user_id: uid, is_paid: true, is_commissioner: uid === JARED,
      });
    }
  }
  console.log(`  memberships ensured (${memberIds.length} per league)`);

  // 5. Picks per league/format + tiebreakers on the "monday" game
  const n = games.length;
  for (const lg of LEAGUES) {
    const isPick5 = lg.scoring.startsWith('pick5');
    const isConf = lg.scoring.endsWith('confidence');
    for (const uid of memberIds) {
      if (uid === JARED) continue; // Jared enters his own picks through the UI
      const rng = seededRng(hashSeed(`${lg.id}:${uid}`));
      const slate = isPick5
        ? games.slice().sort(() => rng() - 0.5).slice(0, 5)
        : games;
      const confs = isConf
        ? Array.from({ length: n }, (_, i) => i + 1).sort(() => rng() - 0.5)
        : [];
      const rows = slate.map((g, i) => ({
        user_id: uid, league_id: lg.id, game_id: g.id, week: MOCK_WEEK,
        picked_team: rng() < 0.5 ? g.home_team : g.away_team,
        confidence: isConf ? confs[i] : null,
        is_locked: false,
      }));
      const { error } = await supabase.from('picks').insert(rows);
      if (error) { console.error(`picks ${lg.name}/${uid.slice(0, 8)}:`, error.message); process.exit(1); }
      if (isConf && mnf) {
        await supabase.from('tiebreaker_guesses').insert({
          user_id: uid, league_id: lg.id, game_id: mnf.id, week: MOCK_WEEK,
          guess: 25 + Math.floor(rng() * 30),
        });
      }
    }
    console.log(`  ${lg.name}: picks for ${memberIds.length} users (${isPick5 ? '5 games each' : 'full slate'}${isConf ? ' + confidence + tiebreaker' : ''})`);
  }

  console.log('\nDone. Run scripts/mock-preseason-eval.mjs after games to grade + verify.');
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isMain) main().catch(e => { console.error(e); process.exit(1); });
