# Growth & Discovery Strategy — The Pickem Pool

**Date:** 2026-06-07  
**App:** thepickempool.com (repo: club943pickem)  
**Stack:** Next.js 14 App Router · Supabase · Tailwind · Vercel  

---

## Goal

Grow the user base through improved discovery. The app has solid features, SEO foundations, and monetization infrastructure in place. The bottleneck is that not enough people are finding the site. All four discovery channels — SEO/content, social sharing, in-app referral mechanics, and partnerships — are valid levers and will be pursued in sequence.

---

## Strategy: Three Pillars

### Sequencing

- **Pillar A (Viral Mechanics)** — July 2026. Highest immediate ROI; turns existing players into a distribution channel.
- **Pillar B (SEO + Tools)** — July–August, in parallel with A. Durable traffic that compounds over time.
- **Pillar C (Commissioner Acquisition)** — August–September, ramping before NFL kickoff. Targets the highest-leverage user.

### Prerequisites (activate now, June 2026)

These are already built — just need activation:

- **Resend setup:** Sign up at resend.com, verify `admin@thepickempool.com`, add `RESEND_API_KEY` to Vercel. Weekly digest cron fires automatically.
- **Affiliate URLs:** Apply to DraftKings/FanDuel on Impact.com, add tracking URLs to Vercel env vars to activate `AffiliateBanner` component.
- **AdSense:** Awaiting Google review — no action needed.

---

## Pillar A — Viral Mechanics

**Goal:** Turn every player into a referral vector. Shared cards use the actual app UI (dark theme, yellow accents, game rows) rendered via `@vercel/og` — not a custom marketing graphic.

### Features

#### 1. Shareable Pick Slip

- Route: `GET /share/picks/[token]` — public page with OG metadata
- Image: `app/share/picks/[token]/opengraph-image.tsx` using `@vercel/og` ImageResponse
- Renders: player name, week number, league format, all picks with confidence points and selected team highlighted in team color, submission count in footer
- Footer watermark: `thepickempool.com`
- Share trigger: "Share My Pick Slip" button on the picks page, appears after first pick is submitted
- Share targets: Web Share API (iOS/Android native share sheet) with fallback copy-to-clipboard; Twitter/X pre-filled tweet

#### 2. Weekly Result Card

- Route: `GET /share/results/[leagueCode]/[week]` — public page with OG metadata
- Image: `app/share/results/[leagueCode]/[week]/opengraph-image.tsx`
- Renders: league name, week number, top 5 standings with W-L record and points, current user row highlighted
- Footer watermark: `thepickempool.com` + `Join this pool →`
- Share trigger: "Share Standings" button in the standings/grid view, activated after week locks
- Commissioner can also share full leaderboard from the commissioner panel

#### 3. Commissioner Invite Flow

- Existing invite link gets a one-tap share button in the commissioner panel
- Pre-written message: `"Join my NFL pick'em pool on The Pickem Pool — free, no ads, and the best formats around. Join here: [invite link]"`
- Web Share API with copy fallback

#### 4. "Start Your Own" CTA

- Every shared card image includes a subtle footer: `thepickempool.com`
- The public `/share/picks/[token]` and `/share/results/[leagueCode]/[week]` pages include a "Start your own pool" CTA banner for non-authenticated visitors

### Token generation

- Pick slip tokens: `base64url(leagueCode + userId + week)` — no auth required to view
- Result tokens: `leagueCode + week` in the URL directly (standings are not private)
- Tokens are deterministic — no new DB table needed

---

## Pillar B — SEO + Tools

**Goal:** High-intent tool pages that rank for commercial keywords and convert visitors to signups. Run in parallel with Pillar A.

### Features

#### 1. Public Pick Consensus — `/picks/week-[n]`

**Quickest win in the entire roadmap.** Pick percentage data already exists in the DB (currently shown in-app per game). This just needs a public route.

- Page: `app/picks/week-[n]/page.tsx` — server-rendered, no auth
- Shows: each game matchup, away% and home% pick distribution across all TPP leagues for that week, total pick count
- SEO target: "who is everyone picking NFL Week 4" (~50k searches/week during season)
- Metadata: dynamic title `NFL Week [n] Pick'em Consensus | The Pickem Pool`, canonical URL
- Links to: "Run your own pool →" CTA at bottom

#### 2. Pool Payout Calculator — `/tools/payout-calculator`

- Client-side calculator: number of players (2–100) + entry fee → payout table
- Payout presets: winner-take-all, top 3 (60/30/10), top 3 with weekly prizes
- Custom split: commissioner can adjust percentages to define their own split
- Output: clear table of dollar amounts per place
- SEO target: "NFL pick'em pool payout calculator", "office pool payout structure"
- CTA: "Use these settings in your pool → Create League"

#### 3. Confidence Pool Scorer — `/tools/scorer`

- No-auth tool for people already in a pool run elsewhere
- Input: game-by-game picks + confidence points (manual entry)
- Output: total score, correct/incorrect breakdown
- SEO target: "confidence pool calculator", "confidence pool scorer"
- CTA: "Run your own confidence pool →"

#### 4. Seasonal Blog Content

Publish on this calendar to align with commissioner search intent:

| Month | Post | Keyword intent |
|-------|------|---------------|
| July | "How to set up an NFL office pool in 2026" | Commissioner setup |
| August | "NFL pick'em pool vs fantasy football: which is right for your group?" | High volume |
| September | "Best NFL pick'em pool strategies for 2026" | Season start |
| Weekly (in-season) | "NFL Week [n] picks and predictions" | Repeat traffic |

---

## Pillar C — Commissioner Acquisition

**Goal:** Commissioners are the highest-leverage users — one commissioner brings 10–20 players. Ramp up in August, fully active by September kickoff.

### Features

#### 1. League Templates — Create League flow

**Second-quickest win.** No new infrastructure — just pre-fills the existing create league form.

- Step 1 of create flow: choose a template (or "Custom")
- Templates:
  - **Office Pool** — Straight Up, 10–20 players, weekly winner payout
  - **Confidence ATS** (marked Popular) — Against the spread, confidence points, season-long winner
  - **Friend Group** — Pick 5 ATS, 4–8 players, casual format
- Selecting a template pre-fills all league settings; commissioner can still edit before creating
- No DB schema changes needed — templates are static config objects

#### 2. Commissioner Landing Page — `/start`

- Dedicated page for the person running the pool, not the player joining one
- Headline: "Run your NFL pick'em pool in 2 minutes."
- Subhead: "Free. No ads. ATS, Confidence, Pick 5, and more."
- Trust signals: "Free forever", "6 formats", "Auto-grading", "No setup fees"
- Single CTA: "Create Your League →" → flows into the create league flow with templates
- SEO target: "NFL pick'em pool app", "run an NFL office pool online"

#### 3. Branded Invite Emails — via Resend

Activates automatically once Resend is set up (Prerequisite above).

- When a commissioner invites players, emails send from `noreply@thepickempool.com`
- Email shows: league name, commissioner's message, "Join the Pool" CTA button
- Footer: "Powered by The Pickem Pool · thepickempool.com"
- Every player invite is a passive TPP ad to a non-user

#### 4. Community Presence

Manual/ongoing — not a code feature. Timed to August–September when "what pick'em software should I use?" questions peak.

- **Reddit:** r/nfl and r/fantasyfootball — respond to "office pool software" recommendation threads genuinely
- **Facebook Groups:** "NFL office pool", "sports betting pool" groups
- **Podcast sponsorships:** Small NFL/fantasy podcasts (10k–50k listeners) are affordable and reach the commissioner demographic directly

---

## Delivery Timeline

| Phase | Target | Deliverables |
|-------|--------|-------------|
| Now | June 2026 | Resend activation, affiliate URLs, monitor AdSense |
| Pillar A | July 2026 | Pick slip share, result card share, invite flow, "start your own" CTA |
| Pillar B | July–Aug 2026 | Public consensus page, payout calc, scorer, 4 blog posts |
| Pillar C | Aug–Sep 2026 | League templates, `/start` page, invite emails live, community push |
| Kickoff | Sep 2026 | All features live before Week 1 |

### Three quick wins to do first

1. **Public consensus picks page** — data already in DB, needs a public route and SEO metadata. ~1 day.
2. **League templates** — static config pre-filling existing form. No schema changes. ~half day.
3. **Resend setup** — cron already built. Just needs API key and domain verification. ~1 hour.

---

## Success Metrics

- **Pillar A:** Shared card impressions, new signups via `/share/*` referral path
- **Pillar B:** Organic search impressions and clicks for tool/consensus pages (Google Search Console)
- **Pillar C:** Commissioner signups via `/start`, league creation rate, invite email open rate
