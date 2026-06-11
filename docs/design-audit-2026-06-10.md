# Design Audit — Phase 1 (2026-06-10)

Audited at 390px and 1440px via headless browser against seeded test data
(league `6V7A3F` "Club943 Test", 26 players, weeks 1–7 final, week 8 live).
Screenshots: `/tmp/audit/*.png`. Logged in as seed user `matt.thompson.tpp@mailinator.com`.

## What's already strong (do not lose this)

- The brand has a real point of view: black/yellow brutalist, condensed display
  type, monospace tags, grid-paper background. Not AI-slop.
- The Grid (picks matrix with team-color cells) is a genuinely distinctive surface.
- Sticky bottom save bar on picks ("16 of 16 picks submitted" + Save) is the right pattern.
- Team-color pick blocks, FINAL/pts result pills, $-paid markers, "YOU" chip all read well.
- vs-pages and formats page are structurally solid marketing surfaces.

## Ranked findings (worst × highest-traffic first)

### 1. Picks page — mobile chrome is the weakest part of the core flow
- Header stacks two rows: logo + league chip + "Settings ← Standings", then a
  second row with a huge yellow **Save Picks** + **Sign Out** + theme toggle.
  Save Picks is duplicated (header AND sticky footer). Sign Out occupies prime
  mobile real estate on the most-used screen.
- CONF chip strip (16 15 14 …) runs off the right viewport edge with no
  scroll affordance or fade; unclear what it even is at a glance.
- Week selector (1–18 squares) also clips at viewport edge (~16 visible).
  Touch targets ~28px, below 44px.
- Nav patterns are inconsistent page-to-page: picks header differs from board
  header (text-link row "The Grid My Profile Settings" appears only on board).

### 2. Picks page — desktop wastes half the screen
Content column hugs the left ~60%; large dead black void on the right.
Opportunity: persistent right rail (confidence budget remaining, unpicked games,
submit state, line-movement notes) or center the column.

### 3. The Board — bottom half decays
- "Rankings over time" bump chart is 26 rainbow lines of spaghetti; right-edge
  name labels overlap into an unreadable smear. Needs: highlight-on-tap/hover,
  top-5 + "you" emphasized, everyone else gray, or drop the chart on mobile.
- Weekly results matrix: dim gray numbers on black, very low contrast, no
  visible hover/focus state, columns unlabeled on mobile scroll.
- Mobile hero stat block ("YOUR RANK #1 / LEAGUE LEADER 583 / PLAYERS 25")
  has awkward asymmetric two-then-one column rhythm.

### 4. The Grid — mobile first impression fails
- Rank/player column eats ~60% of viewport width; only ~2 game columns visible.
- Live week shows every player at **0 pts** with mostly-empty cells — reads as
  broken rather than "week in progress". Needs a live-week state treatment.
- Legend (correct/wrong/live/pending) is tiny; header team chips clip.

### 5. Landing page — black voids
- Demo `<video>` has no `poster`, so a 6.4MB mp4 paints as a giant black box
  until loaded (confirmed in headless capture; will hit slow connections too).
- Mobile full-page capture shows large empty black bands in "Up and running in
  three steps" and "Everything you need to run the pool right" — content
  appears dependent on scroll-triggered reveal; verify there's a no-JS/reduced-
  motion fallback and that sections don't render empty.
- AdSense iframes inject into the marketing landing; on localhost they render
  as dead space — verify placement on prod doesn't break the hero rhythm.

### 6. Blog — long-form readability is mediocre
- Index: a wall of near-identical dark cards, no dates/read-time hierarchy
  visible at a glance, no featured post.
- Post page: all-caps yellow mono section headers + small gray body on black is
  fatiguing for 2,000-word articles. Needs a reading-optimized type scale
  (larger body, more line-height, ~680px measure), TOC for long posts.

### 7. Auth — no recovery path
Sign-in has no "Forgot password?" link. Error message ("Invalid login
credentials") renders in small red mono — fine, but recovery is a dead end.
(Found while testing: login works; success-state styling is fine.)

### 8. Polish layer (cross-cutting)
- React hydration mismatch warning on every page from the theme-init
  `<script dangerouslySetInnerHTML>` in RootLayout — needs
  `suppressHydrationWarning`.
- `.tag` mono labels (dim gray on black) likely fail 4.5:1 contrast in several
  places (52%/48% odds text, column headers, section eyebrows).
- Theme toggle (sun icon) exists in the app header — verify the light theme is
  actually finished; if not, hide the toggle.
- Settings page is clean but has no save feedback/toast and is visually flat
  vs. the brand.

## Suggested implementation order (Phase 3)
1. Mobile app chrome: one consistent header across board/picks/grid; demote
   Sign Out; de-duplicate Save Picks; fix conf-strip + week-selector overflow.
2. Picks desktop layout (right rail or centered column).
3. Board: bump chart redesign + matrix contrast.
4. Grid mobile: column sizing + live-week state.
5. Landing: video poster + reveal fallbacks.
6. Blog typography pass.
7. Forgot-password + polish layer items.
