# Live-score fallback paths (tested 2026-08-14, during 3 live preseason games)

Primary source is ESPN (`site.web.api.espn.com`, see `src/lib/espn/client.ts`).
This doc records tested alternatives in case ESPN blocks/changes that endpoint
mid-season. All tests below were run against live games (DEN@ATL, TB@NYJ,
MIA@WSH) and verified score-accurate against each other.

## Tier 1 — same-vendor host swap (no code-shape changes)

**`https://cdn.espn.com/core/nfl/scoreboard?xhr=1`** — HTTP 200, ~0.2s.
Same event objects, nested under `content.sbData.events` instead of top-level
`events`. If the current host starts 403ing (like `site.api.espn.com` already
does), point the client here and unwrap `content.sbData`. Five-minute fix.

## Tier 2 — The Odds API scores endpoint (key already in prod)

**`GET https://api.the-odds-api.com/v4/sports/americanfootball_nfl/scores/?apiKey=$ODDS_API_KEY`**
(preseason uses sport key `americanfootball_nfl_preseason`).

- Tested live: all 3 in-progress games returned with correct scores;
  `last_update` was 6 seconds old at time of test. Completed games carry
  `completed: true` + final scores — enough to grade picks.
- Limitations: totals only — no quarter/clock, so the live grid clock would
  degrade. Winner/push grading unaffected.
- Credit math: scores call costs 1 credit (2 with `daysFrom=N` for recent
  finals). Free tier = 500 credits/month, shared with spread fetches.
  2-min live polling (~2,300 calls/mo in season) does NOT fit free —
  usable as-is for grading-only (poll each game window once at end), or
  upgrade to the $30/mo tier (20K credits) for full live polling.

## Tier 3 — new signup required (untested beyond pricing)

- **Sports Odds (RapidAPI, walterqian16)** — free 500K req/month hard limit,
  scores+odds updated every 5 min. Listing 4 years stale; smoke-test before
  trusting. Needs Start Free Plan click on the user's RapidAPI account.
- **PropSports NFL API ($19/mo, RapidAPI)** — 500K req/month, live scores +
  spreads + injuries, sub-100ms edge. Best paid option if ESPN dies for good.

## Dead ends (tested, do not revisit)

- **Free Livescore API (RapidAPI, Creativesdev)** — advertises "NFL live
  scores, 500K free/month" but exposes exactly one endpoint
  (`livescore-get-search`) returning team/stage metadata only. Confirmed via
  playground endpoint list, 19 endpoint-name probes (all 404), and a live-game
  team search containing zero score data.
- **`site.api.espn.com`** — 403 (Akamai). Already migrated off (commit 87a7471).
- All other RapidAPI "NFL scores" free tiers — hard-capped at 20–1,000
  requests/month; below the ~2,300/mo needed. Full survey in session notes
  2026-08-14.
