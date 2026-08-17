# Test league results — 2026 preseason week 1 (Aug 13–15)

Snapshot taken 2026-08-16 before reseeding the season-1998 test leagues onto
preseason week 2. Kept for reference: this is the slate used to verify the
full live pipeline (posted-time locking → live scores + clock → finals →
grading → standings → tiebreakers). All six formats passed independent
grading verification.

Slate: ESPN `seasontype=1&week=2&dates=2026`, 16 games, seeded under
`season_year = 1998`, `week = 18`.

> **Update 2026-08-16:** this slate was re-seeded at `week = 17` (to free
> week 18 for preseason week 2) with `MOCK_WEEK=17 PRESEASON_WEEK=2`. On that
> re-run Jared's picks are script-generated rather than the ones he entered by
> hand in the UI, so the live week-17 standings no longer match the table
> below. The table stays as the record of the hand-entered run; all six
> formats passed independent grading verification on the re-run too.

## Final standings (week 18 rows)

| League | Format | 1st | 2nd | 3rd |
|---|---|---|---|---|
| Club943 Test | ats_confidence | Mock Alpha — 74 pts (8) | boschtj — 50 (6) | Mock Bravo — 31 (5) |
| Test — ATS Only | ats | Mock Bravo — 9 (9) | boschtj — 7 (7) | Mock Alpha — 6 (6) |
| Test — Straight Up | straight_up | Mock Bravo — 9 (9) | boschtj / Mock Alpha — 6 (6), tied | — |
| Test — SU + Confidence | su_confidence | Mock Bravo — 68 (7) | Mock Alpha — 58 (8) | boschtj — 54 (6) |
| Test — Pick 5 SU | pick5_su | Mock Bravo — 3.5 (3) | boschtj — 3 (3) | Mock Alpha — 2 (2) |
| Test — Pick 5 ATS | pick5_ats | Mock Bravo / Mock Alpha — 2.5 (2), tied | — | boschtj — 1.5 (1) |

Parenthetical = correct picks. SU + Confidence is the useful sanity check:
Mock Bravo won with fewer correct picks (7) than Mock Alpha (8) because of
confidence weighting — the scoring model doing real work.

## Tiebreaker

Tiebreaker game DAL@SEA finished 17–7 (total 24). All `tiebreaker_guesses`
rows correctly graded `actual_total = 24`. Club943 Test guesses were 32, 49,
51 — a tie would have resolved to 32.

## Bugs this test week surfaced (all fixed unless noted)

- `lock_slots()` was never invoked by anything — picks never locked, so RLS
  hid leaguemates' picks on The Grid. Now wired into the sync-scores route.
- ESPN's `site.api.espn.com` 403s all Vercel egress (Akamai bot filter).
  Switched to `site.web.api.espn.com`.
- Vercel's Next Data Cache served cached supabase-js responses in the cron
  route, so `lock_slots` "succeeded" without ever reaching the database.
  Fixed with `cache: "no-store"` in `createAdminClient`.
- Grid winner labels were derived from picks, so a final game showed bare
  FINAL when nobody in the league had the winning side. Now derived from
  scores + locked spread.
- OPEN: `lock_slots()` step 3 locks `mnf_tiebreakers`, a dead table with zero
  rows. The live table is `tiebreaker_guesses`, which has no lock column;
  it is protected by game-status RLS rather than kickoff time.
