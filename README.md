# Handoff: thepickempool — NFL Pick'em League Interface

## Overview
A modern, flashy NFL Pick'em league web app positioned as a premium alternative to Yahoo / CBS Sports. Covers four core screens: a live **Dashboard** with standings & team stats, a **Make Picks** flow, a **Weekly Grid** showing all players' picks at a glance, and an individual **Player Profile**. Gamified, broadcast-style visual language (ESPN/arcade leaderboard vibe). Supports ~40-player leagues. Fully responsive target (designs here are desktop-scale; mobile adaptation follows the same system).

## About the Design Files
The HTML/JSX files in this bundle are **design references** — prototypes built in React + inline Babel for quick iteration in a design tool. They are NOT production code. The task is to **recreate these designs in your target codebase's environment** (Next.js, Remix, SwiftUI, whatever the real app uses), using its established patterns — component library, state management, routing, data fetching. If no environment exists yet, **Next.js 14 (App Router) + Tailwind + TanStack Query** is a solid default for this product.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, iconography, interactions. Recreate pixel-accurately where reasonable. Exact design tokens and sizing live below.

## File Layout in this Bundle
```
design_handoff_pickem/
├── README.md                          ← this file
├── Pickem HiFi.html                   ← entry: canvas showing all 5 artboards
├── design-canvas.jsx                  ← canvas framing component (not part of the product)
└── hifi/
    ├── pp-system.jsx                  ← design tokens + shared primitives (source of truth)
    ├── pp-dashboard.jsx               ← Dashboard screen
    ├── pp-picks.jsx                   ← Make Picks A (split card) + B (confidence ladder)
    ├── pp-grid.jsx                    ← Weekly Grid heatmap
    └── pp-profile.jsx                 ← Player Profile
```

The `design-canvas.jsx` + `Pickem HiFi.html` are presentation scaffolding only. The actual screens to implement are the components in `hifi/`.

## Design Tokens (from `hifi/pp-system.jsx` — source of truth)

### Color — Dark (default)
| Token      | Value      | Usage |
|------------|------------|-------|
| `--bg`     | `#0a0a0b`  | Page background |
| `--bg2`    | `#131317`  | Card / header fill |
| `--bg3`    | `#1c1c22`  | Nested fill, inputs, sub-cells |
| `--line`   | `#2a2a33`  | Default border / divider |
| `--line2`  | `#3a3a45`  | Emphasized border |
| `--ink`    | `#f5f5f7`  | Primary text |
| `--ink2`   | `#a8a8b3`  | Secondary text |
| `--ink3`   | `#6a6a75`  | Tertiary / meta text |
| `--accent` | `#ffcc00`  | Primary CTA, live highlights, rank #1 |
| `--accent2`| `#ffe066`  | Accent hover / highlight glow |
| `--good`   | `#00d663`  | Win / correct / positive delta |
| `--bad`    | `#ff3d4c`  | Loss / wrong / negative delta / LIVE |
| `--warn`   | `#ff8c1a`  | Deadlines, upsets |
| `--live`   | `#ff3d4c`  | Live-game indicator |

### Color — Light
| Token      | Value      |
|------------|------------|
| `--bg`     | `#fafaf7`  |
| `--bg2`    | `#ffffff`  |
| `--bg3`    | `#f0f0ec`  |
| `--line`   | `#e4e4de`  |
| `--line2`  | `#c8c8c0`  |
| `--ink`    | `#0a0a0b`  |
| `--ink2`   | `#4a4a52`  |
| `--ink3`   | `#8a8a92`  |
| `--accent` | `#ffcc00`  |
| `--good`   | `#00a84f`  |
| `--bad`    | `#e0293a`  |
| `--warn`   | `#e07d15`  |

Implement as a `data-theme="dark|light"` attribute on `<html>` or a root `<ThemeProvider>`. Both modes must be equally polished.

### Typography — Google Fonts
```
Barlow Condensed  400,500,600,700,800,900   — display (caps, scores, big numbers)
Inter             400,500,600,700,800       — body / UI
JetBrains Mono    400,500,600,700           — tags, times, stats (tabular)
```

**Type classes used in the designs:**
- `.disp` → Barlow Condensed 800, `letter-spacing: -0.01em`, `line-height: 0.95`, UPPERCASE
- `.disp-900` → Barlow Condensed 900, `letter-spacing: -0.015em`, `line-height: 0.9`, UPPERCASE (hero numbers, screen titles)
- `.mono` → JetBrains Mono with `font-feature-settings: 'zero' 1`
- `.tag` → JetBrains Mono 500 / 10px / `letter-spacing: 0.1em` / uppercase / `color: var(--ink3)` (micro-labels)
- `.num` → Barlow Condensed 800, `font-variant-numeric: tabular-nums` (aligned numerical columns)

Root body also uses `font-feature-settings: 'ss01', 'cv11'` on Inter.

### Spacing & Radii
- Card radius: **4px**
- Chip / button radius: **3px**
- Card padding: **14–18px** typical; hero sections **22–28px**
- Section gutters: **14–24px**
- Grid-background: 24px × 24px faint line grid on `.pp-gridbg` surfaces

### Component Primitives
- `.pp-card` — `bg2`, 1px `line` border, 4px radius
- `.pp-chip` — small inline pill, 10px mono, `0.06em` letter-spacing, 3×7px pad. Variants: `.solid` (inverted), `.accent` (yellow/black), `.good`, `.bad`, `.live`
- `.pp-btn` — display font, 8×14 pad, 3px radius. Variants: `.primary` (accent fill), `.ghost` (transparent)
- `.pp-navlink` — top-nav link, underline on `.active` using accent
- `.pp-live-dot` — 7px red circle with `pp-pulse` 1.4s infinite animation
- `.pp-ticker-track` — `pp-scroll` keyframe: `translateX(0)` → `translateX(-50%)` over 50s, linear, infinite
- `.pp-hero-grad` — radial gradient overlay: top-left accent glow + bottom-right red glow on `bg2`

### Team Colors
`NFL` object in `pp-system.jsx` has primary/secondary for all 32 teams. Each team uses a `linear-gradient(145deg, primary, color-mix(in oklab, primary 70%, #000))` logo badge with inset shadow for a "jersey patch" feel. Team logos are **abbreviation-in-colored-square** placeholders — in production, swap for official team logo SVGs (license required).

---

## Screens

### 1. Dashboard (`pp-dashboard.jsx` → `DashboardHi`)
**Purpose:** League HQ. At-a-glance standings, live game ticker, top/bottom performers, team stats, activity feed.

**Layout:** 1400 × 1000 desktop canvas. Column structure:
1. **Top nav** (shared `PPNav` — logo, season/week chip, nav links, right-side status chip)
2. **Live game ticker strip** — horizontally scrolling, infinite. Each ticker item: team abbreviations, score, clock, live dot if in-progress. Use `pp-ticker-track` animation.
3. **Hero row** — three zones:
   - **Podium** (left): 1st place in gold with accent fill + 2nd/3rd smaller. Display avatar initials, name, points, weekly delta.
   - **Your rank card** (center): current user's position, gap to #1, streak indicator
   - **Week KPIs** (right): avg score, highest-scoring player this week, upset count
4. **Standings table** (main, ~60% width) — 40-player scrollable list. Columns: rank, rank-delta arrows (`RankDelta` component), player avatar+name, W-L, ATS, last-5 form (tiny team-color squares), points, trend sparkline (`Sparkline` component). Alternating row background `bg2`/`transparent`. First row highlighted with `accent` left border + 10% accent tint.
5. **Right sidebar** (~40% width):
   - **Hot/Cold teams** — two columns, team logo + pick % + outcome rate
   - **League activity feed** — recent events ("Jerry Jones locked picks", "Upset! NYJ over BUF", etc) with time-ago stamps

**Interactions:** Ticker auto-scrolls. Rank arrows animate in on live-score updates (spec: 300ms ease). Hovering a standings row reveals a "View profile →" affordance.

---

### 2. Make Picks — Confidence Ladder (`pp-picks.jsx` → `MakePicksHiB`) — **PRIMARY**
**Purpose:** Confidence-pool picking. User picks a winner per game AND assigns 1–16 confidence points.

**Layout:** 760 × 1080 canvas (portrait, roughly iPad-width).
1. **Nav** with "X/8 LOCKED" chip
2. **Hero**: Week label · "LOCK IT IN" display title · right-aligned countdown to deadline in warn color (`2D 4H`) with sub-line showing exact time
3. **Confidence budget strip**: 16 small squares numbered 1–16. Used confidences fill with `accent`, unused are `bg3`. Gives a visual budget of which confidence values are still available.
4. **Pick rows** (stack, one per matchup). Each row is a three-column grid:
   - **Left rail** (68px): big confidence number in `disp-900` 38px. Cell tinted `accent` when confidence ≥ 13 (high-confidence tier).
   - **Center**: two-row block:
     - Meta strip (bg3): time, network chip, spread, O/U, consensus `X% of league picked Y`, PRIME/LOCKED badges
     - Teams: two sides separated by "@". When a side is picked, it gets a horizontal gradient tint in that team's primary color, a left-edge color bar, and the team name brightens to `ink`.
   - **Right rail** (~70px): ▲ / ▼ rank-confidence buttons with "RANK" label

5. **Footer**: Tiebreaker input (MNF total points), auto-pick button, primary "Lock picks ↗" button

**Interactions:**
- Clicking a team side selects it; re-clicks a different side swaps the pick
- Dragging rows (optional, post-MVP) to reorder assigns confidence 16 → 1 top-to-bottom
- ▲/▼ adjust a row's confidence, swapping with the adjacent row's value
- Locked games (past deadline) dim to 0.65 opacity, show green final-score chip, and become non-interactive

**State:** `{ matchupId: { pickedTeam: 'BUF', confidence: 16, locked: false } }` per user per week.

---

### 3. Make Picks — Split Card (`pp-picks.jsx` → `MakePicksHiA`) — SECONDARY
**Purpose:** Straight-up picking (no confidence). Use for survivor or simple pools.

**Layout:** Same 760×1080 canvas. Simpler row layout:
- Each matchup is a card with a thin meta bar (time, net, spread, O/U, locked status)
- Two large team sides (18×20 pad), min-height 90px, split by a centered circular "@" badge
- **Picked side floods** in `linear-gradient(90deg, primary, color-mix(in oklab, primary 60%, #000))` with white text
- Picked side shows a white ✓ badge + "PICKED" label in the top corner
- Bottom of card: league consensus bar showing the % split between the two teams

Progress bar in the hero tracks `picked / total`.

---

### 4. Weekly Grid (`pp-grid.jsx` → `WeeklyGridHi`)
**Purpose:** See everyone's picks for the week side-by-side. Sort by points.

**Layout:** 1400 × 1000. Wide horizontally-scrolling table.
- **Left freeze column** (320px, `position: sticky; left:0`): rank, player avatar, name, mini points-bar, total points.
- **Right scroll area**: one column per game (52px wide). Headers show both team logos + "@", matchup abbr, status (`SUN 1P` / `MNF` / `Q3 14-10` live / `31-14` final).
- **Body**: each cell is a **52×52 filled square** of the picker's chosen team color:
  - **Pending**: 30% tint of team color on `bg2`
  - **Live**: full team-color gradient + `accent` border + blinking live dot
  - **Win (final)**: full team-color gradient with inset shadow + ✓ in corner
  - **Loss (final)**: 35% desaturated team tint + ✗ mark in `bad` color
- Empty cell (no pick): dashed border on `bg3`

- **Consensus footer row**: for each game, show the most-picked team's logo + pick % across the league

**Sort default:** by points descending. Also filterable by week (← Wk 7 / Wk 8 / Wk 9 → buttons).

---

### 5. Profile (`pp-profile.jsx` → `ProfileHi`)
**Purpose:** Individual player's season history, stats, tendencies.

**Layout:** 1400 × 1000, two columns below a hero:
1. **Hero**: large avatar tile + name + handle/tenure line + badge chips (streak, champion rings, originals)
2. **5-column KPI strip**: Season pts, Win rate, Current rank, Gap to 1st (warn), Best week (good)
3. **Left column:**
   - **Weekly Performance chart**: bar chart, one bar per week. Color tiers: ≥11 good, ≥8 accent, else bad. Subtle horizontal grid rules.
   - **Pick History** list: week · logo · team name + "vs opp" · confidence progress bar · result chip (✓ WON +conf / ✗ LOST / ◌ PENDING)
4. **Right column:**
   - **Advanced stats grid** (2×3): ATS record, vs favorites, vs underdogs, avg confidence, career pct, longest streak
   - **Tendencies**: two-column panel — "Most Trusted" (good, green bars) vs "Blind Spots" (bad, red bars). Each entry: team logo + name + win-rate bar + fraction + pct.

---

## Interactions & Behavior (System-wide)

### Live Updates
- Live game cards / ticker items should refresh every **15s** during live windows (Thu 8p, Sun 1p/4p/8p, Mon 8p ET).
- Rank-delta arrows (`RankDelta`) should animate (e.g. brief yellow flash) when a rank changes.
- `.pp-live-dot` pulses at 1.4s infinite via `pp-pulse` keyframes.

### Picks Flow
- **Pending picks**: dashed outline, gray.
- **Submitted but game not started**: solid pick styling, still editable up to deadline.
- **Locked (past deadline)**: 0.65 opacity, non-interactive, show `🔒 {finalScore} +{conf}` chip on win.
- Autosave every 10s; show "autosave on · last 12s ago" in footer.

### Theme Toggle
Dark is default. Expose a light/dark toggle (usually in header user menu or global settings). Both modes share the same token keys — light mode just swaps the values. Implement once, apply everywhere.

### Animations
| Element | Keyframe | Duration | Easing |
|---------|----------|----------|--------|
| Live dot | `pp-pulse` (opacity+scale) | 1.4s | infinite |
| Score ticker | `pp-scroll` (translateX 0 → -50%) | 50s | linear infinite |
| Number count-up | transition on values | 300ms | ease |
| Rank arrow flash | background flash yellow | 600ms | ease-out |
| Team-side hover on picks | opacity / brightness lift | 150ms | ease |

### Responsive
- Dashboard & Grid: horizontal scroll under ~1100px; sidebar stacks below main at ~900px.
- Make Picks (760 canvas): works as-is on tablet; on mobile, collapse the meta strip into two rows and shrink confidence rail to 52px.
- Grid: on mobile, sticky left column shrinks to rank + avatar only; tap a player row to open their picks in a sheet.

---

## State Management

Recommended stores:
- **`leagueStore`**: league config, week, members, settings
- **`picksStore`**: `{ week: { userId: { gameId: { pick, confidence, locked } } } }`
- **`scoresStore`**: live scores keyed by game ID; poll every 15s during live windows
- **`standingsStore`**: derived from scores + picks; memoize

Server-driven data (via your data layer — tRPC / REST / GraphQL):
- `GET /api/league/:id/standings?week=8`
- `GET /api/league/:id/picks?week=8` (grid view)
- `GET /api/week/:week/games` (schedule + live scores; WebSocket/SSE for live)
- `GET /api/user/:id/profile`
- `POST /api/picks` (bulk upsert, validated server-side against deadline)

Server enforces lock deadline — client should never trust local lock state alone.

---

## Assets
- **Fonts**: Google Fonts — Barlow Condensed, Inter, JetBrains Mono (already referenced via `@import url('https://fonts.googleapis.com/...')` in `pp-system.jsx`).
- **Team logos**: Current designs use **abbreviation-in-colored-square placeholders** (`TeamLogo` component). For production, license real NFL team logos (SportsDataIO, ESPN API, or direct licensing) and swap the `TeamLogo` component's inner render to use SVG. Preserve the same sizing and gradient background treatment.
- **No other image assets** — all visuals are code/SVG/CSS.

---

## Files to Reference
- `hifi/pp-system.jsx` — **read this first**. All tokens, type classes, NFL colors, shared components (`TeamLogo`, `PPNav`, `Sparkline`, `RankDelta`).
- `hifi/pp-dashboard.jsx` — Dashboard layout
- `hifi/pp-picks.jsx` — both pick flows (B is primary)
- `hifi/pp-grid.jsx` — Weekly grid
- `hifi/pp-profile.jsx` — Player profile
- `Pickem HiFi.html` — open in a browser to see all screens rendered on a single canvas (pan/zoom, click any artboard to focus)

## Implementation Suggestions
1. Start by porting `pp-system.jsx` — its tokens should become your CSS variables (or Tailwind theme extension), its utility classes become your equivalent design-system primitives.
2. Build `TeamLogo`, `PPNav`, `Sparkline`, `RankDelta`, `Chip`, `Button` as reusable components.
3. Build screens in this order: **Make Picks (B)** → **Dashboard** → **Weekly Grid** → **Profile** → **Make Picks (A)**. Picks is the core action; everything else displays its consequences.
4. Add live-score WebSocket/SSE last — stub with `setInterval` polling initially.
