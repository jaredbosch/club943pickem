/**
 * Seed 25 fake users + 8 weeks of simulated season data into the real 2026 schedule.
 * Safe to re-run — cleans its own data first.
 * Run: node scripts/seed-test-season.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://nmbadqaogfksyjwzrfmr.supabase.co';
const SRK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tYmFkcWFvZ2Zrc3lqd3pyZm1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjYwNTI1MywiZXhwIjoyMDkyMTgxMjUzfQ.bksusQ-b3SrahA9LgCjbCrqNWS48UC7U2_PqtubDZw0';
const LEAGUE_ID = 'b30e4adb-6737-421e-be83-08675e9adb99';
const REAL_USER_ID = '99810dab-0770-4d84-8c19-1f5713bd89c7';
const SEASON_YEAR = 2026;
const SEED_WEEKS = [1, 2, 3, 4, 5, 6, 7]; // fully simulated (final)
const LIVE_WEEK = 8;                        // locked, no results yet

const supabase = createClient(SUPABASE_URL, SRK);

// ─── Deterministic RNG (seeded) ─────────────────────────────────────────────
function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

// ─── Player profiles ─────────────────────────────────────────────────────────
const PLAYERS = [
  { name: 'Matt Thompson',    email: 'matt.thompson.tpp@mailinator.com',    correct: 0.72, complete: 1.00, conf: 'high',   paid: true,  phone: '6025551001', venmo: 'mattt' },
  { name: 'Jake Miller',      email: 'jake.miller.tpp@mailinator.com',      correct: 0.68, complete: 1.00, conf: 'flat',   paid: true,  phone: '6025551002', venmo: 'jakemills' },
  { name: 'Sarah Chen',       email: 'sarah.chen.tpp@mailinator.com',       correct: 0.65, complete: 0.95, conf: 'high',   paid: true,  phone: '6025551003', venmo: 'schen' },
  { name: 'Mike Rodriguez',   email: 'mike.rodriguez.tpp@mailinator.com',   correct: 0.60, complete: 1.00, conf: 'random', paid: true,  phone: '6025551004', venmo: 'mrodriguez' },
  { name: 'Chris Anderson',   email: 'chris.anderson.tpp@mailinator.com',   correct: 0.58, complete: 0.85, conf: 'random', paid: true,  phone: '6025551005', venmo: 'canderson' },
  { name: 'Ashley Williams',  email: 'ashley.williams.tpp@mailinator.com',  correct: 0.55, complete: 0.90, conf: 'low',    paid: true,  phone: '6025551006', venmo: 'awilliams' },
  { name: 'Kevin Johnson',    email: 'kevin.johnson.tpp@mailinator.com',    correct: 0.52, complete: 1.00, conf: 'random', paid: true,  phone: '6025551007', venmo: 'kjohnson' },
  { name: 'Rachel Davis',     email: 'rachel.davis.tpp@mailinator.com',     correct: 0.70, complete: 0.95, conf: 'flat',   paid: true,  phone: '6025551008', venmo: 'rdavis' },
  { name: 'Tyler Brown',      email: 'tyler.brown.tpp@mailinator.com',      correct: 0.48, complete: 0.80, conf: 'random', paid: true,  phone: '6025551009', venmo: 'tbrown' },
  { name: 'Amanda Martinez',  email: 'amanda.martinez.tpp@mailinator.com',  correct: 0.58, complete: 1.00, conf: 'high',   paid: true,  phone: '6025551010', venmo: 'amartinez' },
  { name: 'Brandon Wilson',   email: 'brandon.wilson.tpp@mailinator.com',   correct: 0.62, complete: 0.90, conf: 'random', paid: true,  phone: '6025551011', venmo: 'bwilson' },
  { name: 'Megan Taylor',     email: 'megan.taylor.tpp@mailinator.com',     correct: 0.45, complete: 0.75, conf: 'random', paid: false, phone: '6025551012', venmo: '' },
  { name: 'Derek Garcia',     email: 'derek.garcia.tpp@mailinator.com',     correct: 0.55, complete: 0.95, conf: 'high',   paid: true,  phone: '6025551013', venmo: 'dgarcia' },
  { name: 'Lauren Jones',     email: 'lauren.jones.tpp@mailinator.com',     correct: 0.60, complete: 1.00, conf: 'flat',   paid: true,  phone: '6025551014', venmo: 'ljones' },
  { name: 'Travis Moore',     email: 'travis.moore.tpp@mailinator.com',     correct: 0.50, complete: 0.65, conf: 'random', paid: false, phone: '6025551015', venmo: '' },  // ghost
  { name: 'Nicole Harris',    email: 'nicole.harris.tpp@mailinator.com',    correct: 0.65, complete: 0.95, conf: 'random', paid: true,  phone: '6025551016', venmo: 'nharris' },
  { name: 'Ryan Jackson',     email: 'ryan.jackson.tpp@mailinator.com',     correct: 0.42, complete: 0.85, conf: 'random', paid: false, phone: '6025551017', venmo: '' },
  { name: 'Stephanie White',  email: 'stephanie.white.tpp@mailinator.com',  correct: 0.58, complete: 1.00, conf: 'flat',   paid: true,  phone: '6025551018', venmo: 'swhite' },
  { name: 'Jason Lee',        email: 'jason.lee.tpp@mailinator.com',        correct: 0.68, complete: 0.95, conf: 'high',   paid: true,  phone: '6025551019', venmo: 'jlee' },
  { name: 'Courtney Clark',   email: 'courtney.clark.tpp@mailinator.com',   correct: 0.52, complete: 0.80, conf: 'low',    paid: false, phone: '6025551020', venmo: '' },
  { name: 'Andrew Lewis',     email: 'andrew.lewis.tpp@mailinator.com',     correct: 0.60, complete: 1.00, conf: 'random', paid: true,  phone: '6025551021', venmo: 'alewis' },
  { name: 'Brittany Robinson',email: 'brittany.robinson.tpp@mailinator.com',correct: 0.48, complete: 0.75, conf: 'random', paid: false, phone: '6025551022', venmo: '' },
  { name: 'Sean Walker',      email: 'sean.walker.tpp@mailinator.com',      correct: 0.55, complete: 0.90, conf: 'flat',   paid: true,  phone: '6025551023', venmo: 'swalker' },
  { name: 'Danielle Hall',    email: 'danielle.hall.tpp@mailinator.com',    correct: 0.62, complete: 0.95, conf: 'random', paid: true,  phone: '6025551024', venmo: 'dhall' },
  { name: 'Kyle Young',       email: 'kyle.young.tpp@mailinator.com',       correct: 0.58, complete: 0.85, conf: 'high',   paid: false, phone: '6025551025', venmo: '' },
];

// ─── League posts ─────────────────────────────────────────────────────────────
const POSTS = [
  { playerIdx: 0, body: '📌 Welcome to Club 943 Pick\'em 2026! Rules: pick ATS with confidence 1-16. All picks due by kickoff. $300 to weekly winner, remainder to season champ. Let\'s go! 💰', pinned: true, daysAgo: 60 },
  { playerIdx: 1, body: 'Week 1 picks in. NE covering in Seattle? Bold move by whoever took that 😂', pinned: false, daysAgo: 4 },
  { playerIdx: 3, body: 'Somebody really put 16 on DAL -4.5 at home week 1 lmao. Bravery or stupidity?', pinned: false, daysAgo: 4 },
  { playerIdx: 7, body: 'That Seahawks opener on a Wednesday night is such a weird flex by the NFL', pinned: false, daysAgo: 5 },
  { playerIdx: 2, body: 'Anyone else stressing about the Melbourne game time? 8:35pm ET Thursday but it\'s Friday morning in Australia 🤷', pinned: false, daysAgo: 5 },
  { playerIdx: 5, body: 'Week 2 results: Matt T running away with it early. Someone stop him 🔥', pinned: false, daysAgo: 3 },
  { playerIdx: 10, body: 'Jake quit picking with your heart bro. The Lions are NOT an 8 point favorite', pinned: false, daysAgo: 3 },
  { playerIdx: 0, body: 'PSA: Reminder that picks LOCK at kickoff not when the first game starts. International games lock early. Don\'t miss them!', pinned: false, daysAgo: 2 },
  { playerIdx: 14, body: 'Sorry guys forgot to put in week 4 picks 😭 life got busy', pinned: false, daysAgo: 2 },
  { playerIdx: 4, body: 'Travis same excuse every year lol', pinned: false, daysAgo: 2 },
  { playerIdx: 8, body: 'Week 5 was brutal. How did KC not cover at home??? I had them at 15 🤬', pinned: false, daysAgo: 1 },
  { playerIdx: 1, body: 'Week 5 pool results are in! Sarah C and Matt T tied at top. This is a two horse race fr', pinned: false, daysAgo: 1 },
  { playerIdx: 6, body: 'Pay up people!! Still 5 people haven\'t paid their entry. You know who you are 👀', pinned: false, daysAgo: 1 },
  { playerIdx: 9, body: 'Week 6 locks: Anyone else fading the Pats? They look rough', pinned: false, daysAgo: 0 },
  { playerIdx: 15, body: 'This Thursday night game is going to be a nightmare to pick. Both teams are inconsistent', pinned: false, daysAgo: 0 },
];

const COMMENTS = [
  { postIdx: 1, playerIdx: 5, body: 'Right?? That game is going to be a sweat for sure', daysAgo: 4 },
  { postIdx: 1, playerIdx: 2, body: 'I actually like NE +3.5 there, Seattle hasn\'t looked great at home', daysAgo: 4 },
  { postIdx: 2, playerIdx: 8, body: 'That was me. No ragrets', daysAgo: 4 },
  { postIdx: 2, playerIdx: 0, body: 'Bold strategy Cotton, let\'s see if it pays off', daysAgo: 4 },
  { postIdx: 5, playerIdx: 0, body: 'Week is still young. Don\'t count anyone out', daysAgo: 3 },
  { postIdx: 5, playerIdx: 7, body: 'His confidence distribution is insane. Putting 16s on the right games', daysAgo: 3 },
  { postIdx: 6, playerIdx: 1, body: 'My heart says Lions, my wallet says fade them 😅', daysAgo: 3 },
  { postIdx: 8, playerIdx: 14, body: 'Thanks for the reminder! Got them in', daysAgo: 2 },
  { postIdx: 9, playerIdx: 9, body: 'Travis its literally the same thing every year 💀', daysAgo: 2 },
  { postIdx: 10, playerIdx: 3, body: 'Same. Had that game at 14 confidence. Hurt.', daysAgo: 1 },
  { postIdx: 10, playerIdx: 7, body: 'I faded them thankfully. Took the points on the road', daysAgo: 1 },
  { postIdx: 12, playerIdx: 11, body: 'Sending payment now!!', daysAgo: 1 },
  { postIdx: 12, playerIdx: 14, body: 'Just Venmo\'d you', daysAgo: 1 },
  { postIdx: 13, playerIdx: 3, body: 'Hard fade on NE. They\'ve been embarrassing', daysAgo: 0 },
  { postIdx: 13, playerIdx: 0, body: 'Never fade them with enough points though. Brady curse lives on', daysAgo: 0 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashSeed(str) {
  let hash = 0;
  for (const c of str) hash = (hash * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return hash;
}

function generateScore(gameId, spread_home) {
  const rng = seededRng(hashSeed(gameId));
  const homeBase = 17 + Math.floor(rng() * 18); // 17-34
  const awayBase = 17 + Math.floor(rng() * 18);
  // Apply mild favorite bias
  const diff = Math.abs(spread_home);
  const favoriteBonus = diff > 3 ? Math.floor(rng() * 4) + 1 : 0;
  const home_score = spread_home < 0
    ? homeBase + favoriteBonus
    : homeBase;
  const away_score = spread_home > 0
    ? awayBase + favoriteBonus
    : awayBase;
  return { home_score, away_score };
}

function homeCovers(home_score, away_score, spread_home) {
  // Home covers if (home - away) > -spread_home
  return (home_score - away_score) > -spread_home;
}

function assignConfidence(totalGames, style, used, rng) {
  const available = Array.from({ length: totalGames }, (_, i) => i + 1)
    .filter(n => !used.has(n));
  if (!available.length) return null;

  let sorted;
  switch (style) {
    case 'high':   sorted = [...available].sort((a, b) => b - a); break;
    case 'low':    sorted = [...available].sort((a, b) => a - b); break;
    case 'flat': {
      const mid = Math.ceil(totalGames / 2);
      sorted = [...available].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
      break;
    }
    default: {
      sorted = [...available].sort(() => rng() - 0.5);
    }
  }
  return sorted[0];
}

async function createAuthUser(email, name) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'apikey': SRK,
      'Authorization': `Bearer ${SRK}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      email_confirm: true,
      password: 'SeedUser2026!!',
      user_metadata: { display_name: name },
    }),
  });
  const data = await res.json();
  if (data.id) return data.id;
  // Already exists — fetch by email
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: { 'apikey': SRK, 'Authorization': `Bearer ${SRK}` },
  });
  const list = await listRes.json();
  return list.users?.[0]?.id ?? null;
}

async function deleteAuthUser(id) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: 'DELETE',
    headers: { 'apikey': SRK, 'Authorization': `Bearer ${SRK}` },
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Club 943 Pick\'em Season Seed ===\n');

  // ── 1. Clean previous seed data ──────────────────────────────────────────
  console.log('Cleaning previous seed data…');

  const { data: existingMembers } = await supabase
    .from('league_members')
    .select('user_id')
    .eq('league_id', LEAGUE_ID)
    .neq('user_id', REAL_USER_ID);

  const seedUserIds = (existingMembers ?? []).map(m => m.user_id);

  // Always clear real user's old standings (stale test data)
  await supabase.from('standings').delete()
    .eq('user_id', REAL_USER_ID).eq('league_id', LEAGUE_ID).eq('season_year', SEASON_YEAR);

  if (seedUserIds.length) {
    await supabase.from('post_comments').delete().in('user_id', seedUserIds);
    await supabase.from('league_posts').delete().in('user_id', seedUserIds);
    await supabase.from('tiebreaker_guesses').delete().in('user_id', seedUserIds);
    await supabase.from('picks').delete().in('user_id', seedUserIds);
    await supabase.from('standings').delete().in('user_id', seedUserIds);
    await supabase.from('league_members').delete().in('user_id', seedUserIds);
    await supabase.from('league_posts').delete().eq('is_pinned', true).eq('league_id', LEAGUE_ID);

    for (const id of seedUserIds) {
      await deleteAuthUser(id);
      await new Promise(r => setTimeout(r, 80));
    }
  }

  // Also clean old game scores we may have set
  await supabase.from('games')
    .update({ home_score: null, away_score: null, status: 'scheduled' })
    .eq('season_year', SEASON_YEAR)
    .in('week', [...SEED_WEEKS, LIVE_WEEK]);

  console.log('  done.\n');

  // ── 2. Create 25 auth users ───────────────────────────────────────────────
  console.log('Creating 25 fake users…');
  const userIds = [];

  for (const p of PLAYERS) {
    const id = await createAuthUser(p.email, p.name);
    if (!id) { console.error(`  Failed to create ${p.name}`); process.exit(1); }
    userIds.push(id);
    process.stdout.write(`  ${p.name} → ${id.slice(0, 8)}\n`);
    await new Promise(r => setTimeout(r, 120));
  }

  // Update display_name (trigger may set it from metadata, but ensure it)
  for (let i = 0; i < PLAYERS.length; i++) {
    await supabase.from('users').update({ display_name: PLAYERS[i].name }).eq('id', userIds[i]);
  }
  console.log('  done.\n');

  // ── 3. League members ────────────────────────────────────────────────────
  console.log('Adding league members…');
  const memberRows = PLAYERS.map((p, i) => ({
    league_id: LEAGUE_ID,
    user_id: userIds[i],
    is_commissioner: false,
    is_paid: p.paid,
    paid_at: p.paid ? new Date(Date.now() - Math.random() * 30 * 86400000).toISOString() : null,
    phone: p.phone,
    venmo: p.venmo || null,
    joined_at: new Date(Date.now() - Math.random() * 45 * 86400000).toISOString(),
  }));
  const { error: memberErr } = await supabase.from('league_members').insert(memberRows);
  if (memberErr) { console.error('Member insert failed:', memberErr.message); process.exit(1); }
  console.log(`  ${memberRows.length} members added.\n`);

  // ── 4. Fetch real games ──────────────────────────────────────────────────
  console.log('Fetching games…');
  const allWeeks = [...SEED_WEEKS, LIVE_WEEK];
  const { data: games } = await supabase
    .from('games')
    .select('id, week, home_team, away_team, spread_home, locked_spread_home, time_slot')
    .eq('season_year', SEASON_YEAR)
    .in('week', allWeeks)
    .order('kickoff_time', { ascending: true });

  const gamesByWeek = {};
  for (const g of games) {
    if (!gamesByWeek[g.week]) gamesByWeek[g.week] = [];
    gamesByWeek[g.week].push(g);
  }

  console.log(`  ${games.length} games across weeks ${allWeeks.join(', ')}.\n`);

  // ── 5. Set game scores for final weeks ───────────────────────────────────
  console.log('Setting game scores for weeks 1-7…');
  const gameResults = {}; // gameId → { home_score, away_score, homeCovers }

  for (const week of SEED_WEEKS) {
    const weekGames = gamesByWeek[week] ?? [];
    const updates = weekGames.map(g => {
      const spread = g.locked_spread_home ?? g.spread_home ?? 0;
      const { home_score, away_score } = generateScore(g.id, spread);
      const covered = homeCovers(home_score, away_score, spread);
      gameResults[g.id] = { home_score, away_score, homeCovers: covered };
      return { id: g.id, home_score, away_score, status: 'final' };
    });
    for (const u of updates) {
      await supabase.from('games').update({ home_score: u.home_score, away_score: u.away_score, status: 'status' })
        .eq('id', u.id);
    }
    // Batch update status separately (simpler)
    await supabase.from('games').update({ status: 'final' })
      .eq('season_year', SEASON_YEAR).eq('week', week);
    // Set individual scores
    for (const u of updates) {
      await supabase.from('games').update({ home_score: u.home_score, away_score: u.away_score })
        .eq('id', u.id);
    }
    process.stdout.write(`  Week ${week}: ${weekGames.length} games set to final\n`);
  }

  // Week 8: lock games but no scores
  await supabase.from('games').update({ status: 'locked' })
    .eq('season_year', SEASON_YEAR).eq('week', LIVE_WEEK);
  console.log(`  Week ${LIVE_WEEK}: locked (no scores yet)\n`);

  // ── 6. Generate picks ────────────────────────────────────────────────────
  console.log('Generating picks…');
  const allPickRows = [];
  const weeklyPoints = {}; // userId → week → { pts, correct }

  for (let ui = 0; ui < PLAYERS.length; ui++) {
    const player = PLAYERS[ui];
    const userId = userIds[ui];
    const rng = seededRng(hashSeed(userId + 'picks'));
    weeklyPoints[userId] = {};

    for (const week of allWeeks) {
      const weekGames = gamesByWeek[week] ?? [];
      const isFinal = SEED_WEEKS.includes(week);
      const usedConf = new Set();
      const weekTotal = { pts: 0, correct: 0 };

      // Ghost behavior: some players skip whole weeks
      if (player.complete < 0.80 && rng() > player.complete * 1.3) {
        weeklyPoints[userId][week] = weekTotal;
        continue;
      }

      for (const game of weekGames) {
        // Skip game based on completion rate
        if (rng() > player.complete) continue;

        const spread = game.locked_spread_home ?? game.spread_home ?? 0;
        const result = gameResults[game.id];

        // Determine which team to pick
        let pickedTeam;
        if (isFinal && result) {
          const correctTeam = result.homeCovers ? game.home_team : game.away_team;
          const wrongTeam   = result.homeCovers ? game.away_team : game.home_team;
          pickedTeam = rng() < player.correct ? correctTeam : wrongTeam;
        } else {
          // Future/locked: pick randomly
          pickedTeam = rng() < 0.5 ? game.home_team : game.away_team;
        }

        // Assign confidence
        const conf = rng() < 0.90  // 10% chance of no confidence
          ? assignConfidence(weekGames.length, player.conf, usedConf, rng)
          : null;
        if (conf !== null) usedConf.add(conf);

        // Grade pick
        let isCorrect = null;
        let pointsEarned = null;
        if (isFinal && result) {
          const pickedHome = pickedTeam === game.home_team;
          isCorrect = pickedHome === result.homeCovers;
          pointsEarned = isCorrect ? (conf ?? 0) : 0;
          if (isCorrect) { weekTotal.pts += pointsEarned; weekTotal.correct++; }
        }

        allPickRows.push({
          user_id: userId,
          league_id: LEAGUE_ID,
          game_id: game.id,
          week,
          picked_team: pickedTeam,
          confidence: conf,
          // Final week games are locked; live week games are also locked (kicked off)
          is_locked: true,
          is_correct: isCorrect,
          points_earned: pointsEarned,
        });
      }

      weeklyPoints[userId][week] = weekTotal;
    }
  }

  // Batch insert picks in chunks
  const CHUNK = 200;
  for (let i = 0; i < allPickRows.length; i += CHUNK) {
    const { error } = await supabase.from('picks').insert(allPickRows.slice(i, i + CHUNK));
    if (error) { console.error('Pick insert error:', error.message); process.exit(1); }
  }
  console.log(`  ${allPickRows.length} picks inserted.\n`);

  // ── 7. Compute standings ─────────────────────────────────────────────────
  console.log('Computing standings…');
  const standingRows = [];

  // Week-by-week standings
  for (const week of SEED_WEEKS) {
    const weekScores = PLAYERS.map((_, ui) => ({
      userId: userIds[ui],
      pts: weeklyPoints[userIds[ui]]?.[week]?.pts ?? 0,
      correct: weeklyPoints[userIds[ui]]?.[week]?.correct ?? 0,
    })).sort((a, b) => b.pts - a.pts);

    weekScores.forEach((s, idx) => {
      standingRows.push({
        user_id: s.userId,
        league_id: LEAGUE_ID,
        week,
        season_year: SEASON_YEAR,
        total_points: s.pts,
        correct_picks: s.correct,
        rank: idx + 1,
      });
    });
  }

  // Season totals (week = 0)
  const seasonScores = PLAYERS.map((_, ui) => {
    const uid = userIds[ui];
    const totalPts = SEED_WEEKS.reduce((sum, w) => sum + (weeklyPoints[uid]?.[w]?.pts ?? 0), 0);
    const totalCorrect = SEED_WEEKS.reduce((sum, w) => sum + (weeklyPoints[uid]?.[w]?.correct ?? 0), 0);
    return { userId: uid, pts: totalPts, correct: totalCorrect };
  }).sort((a, b) => b.pts - a.pts);

  seasonScores.forEach((s, idx) => {
    standingRows.push({
      user_id: s.userId,
      league_id: LEAGUE_ID,
      week: 0,
      season_year: SEASON_YEAR,
      total_points: s.pts,
      correct_picks: s.correct,
      rank: idx + 1,
    });
  });

  const { error: standErr } = await supabase.from('standings').insert(standingRows);
  if (standErr) { console.error('Standings error:', standErr.message); process.exit(1); }
  console.log(`  ${standingRows.length} standing rows inserted.\n`);

  // ── 8. Tiebreaker guesses ────────────────────────────────────────────────
  console.log('Inserting tiebreaker guesses…');
  const tbRows = [];

  for (const week of SEED_WEEKS) {
    const mnfGame = (gamesByWeek[week] ?? []).find(g => g.time_slot === 'monday');
    if (!mnfGame) continue;
    const actual = gameResults[mnfGame.id]
      ? gameResults[mnfGame.id].home_score + gameResults[mnfGame.id].away_score
      : null;

    for (let ui = 0; ui < PLAYERS.length; ui++) {
      if (Math.random() < 0.15) continue; // 15% skip tiebreaker
      const rng = seededRng(hashSeed(userIds[ui] + week + 'tb'));
      const guess = 38 + Math.floor(rng() * 28); // 38-65
      tbRows.push({
        user_id: userIds[ui],
        league_id: LEAGUE_ID,
        game_id: mnfGame.id,
        week,
        guess,
        actual_total: actual,
      });
    }
  }

  if (tbRows.length) {
    const { error: tbErr } = await supabase.from('tiebreaker_guesses').insert(tbRows);
    if (tbErr) { console.error('Tiebreaker error:', tbErr.message); process.exit(1); }
  }
  console.log(`  ${tbRows.length} tiebreaker guesses inserted.\n`);

  // ── 9. League posts + comments ────────────────────────────────────────────
  console.log('Seeding league posts…');
  const postIds = [];

  for (const p of POSTS) {
    const createdAt = new Date(Date.now() - p.daysAgo * 86400000).toISOString();
    const { data, error } = await supabase.from('league_posts').insert({
      league_id: LEAGUE_ID,
      user_id: userIds[p.playerIdx],
      body: p.body,
      is_pinned: p.pinned,
      created_at: createdAt,
      updated_at: createdAt,
    }).select('id').single();
    if (error) { console.error('Post error:', error.message); }
    else postIds.push(data.id);
    await new Promise(r => setTimeout(r, 30));
  }

  const commentRows = COMMENTS.map(c => ({
    post_id: postIds[c.postIdx],
    league_id: LEAGUE_ID,
    user_id: userIds[c.playerIdx],
    body: c.body,
    created_at: new Date(Date.now() - c.daysAgo * 86400000).toISOString(),
  })).filter(c => c.post_id);

  if (commentRows.length) {
    await supabase.from('post_comments').insert(commentRows);
  }
  console.log(`  ${postIds.length} posts, ${commentRows.length} comments.\n`);

  // ── 10. Summary ──────────────────────────────────────────────────────────
  console.log('=== Seed complete! ===');
  console.log(`Users: 25 fake + 1 real = 26 total`);
  console.log(`Paid: ${PLAYERS.filter(p => p.paid).length}/25 fake users`);
  console.log(`Picks: ${allPickRows.length} rows (weeks 1-8)`);
  console.log(`Standings: ${standingRows.length} rows (weeks 1-7 + season)`);
  console.log(`Tiebreakers: ${tbRows.length}`);
  console.log(`Posts: ${postIds.length} | Comments: ${commentRows.length}`);
  console.log('\nTop 5 season standings:');
  seasonScores.slice(0, 5).forEach((s, i) => {
    const name = PLAYERS[userIds.indexOf(s.userId)]?.name ?? 'Unknown';
    console.log(`  ${i + 1}. ${name} — ${s.pts} pts (${s.correct} correct)`);
  });
}

main().catch(e => { console.error(e); process.exit(1); });
