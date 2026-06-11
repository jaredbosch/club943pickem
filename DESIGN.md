# Design System — thepickempool · "THE BOOK"

## Product Context
- **What this is:** Web app for running private NFL pick'em money leagues — confidence/ATS scoring, live spreads, commissioner tools, The Grid picks matrix.
- **Who it's for:** Commissioners and players in private money pools (real entry fees, real payouts).
- **Space/industry:** Sports pools / fantasy adjacent. Peers: ESPN, Yahoo, CBS, RunYourPool, Sleeper.
- **Project type:** Web app (data-dense "money surfaces") + marketing site + blog.

## The Memorable Thing
**Vegas-board energy.** "This feels like a sportsbook built for my friends."
Every design decision serves this. Money surfaces are dense, mono, and glowing;
reading surfaces are calm and roomy. Yellow means action. Amber means live.
Mono means numbers.

## Aesthetic Direction
- **Direction:** Industrial sportsbook brutalism (refinement of the existing brand — never replace it)
- **Decoration level:** Intentional — grid-paper background, hairline borders, LED glow on hero numbers ONLY
- **Mood:** The board at the book. Stakes, sweat, lights — but legible and fast.
- **Approved mockup:** `~/.gstack/projects/jaredbosch-club943pickem/designs/design-system-20260610/` (mobile picks page)

## Typography
- **Display/Hero:** Barlow Condensed 900 (page titles, scoreboard numerals) / 800 (card + slot headers) — it IS the brand voice. All-caps, tight line-height (0.95–1.0).
- **Body:** Instrument Sans — replaces Inter (near-identical metrics, more character). Sentence case, 1.55 line-height.
- **Data/Ticker:** JetBrains Mono with `font-variant-numeric: tabular-nums` — **STRICTLY numbers and micro-eyebrows**: spreads, odds %, money, kickoff times, 10–11px uppercase eyebrow labels. Mono is forbidden for body copy, nav, and buttons. If mono is everywhere, it's nowhere.
- **Code:** JetBrains Mono.
- **Loading:** Google Fonts via next/font (swap Inter import for Instrument Sans; Barlow Condensed and JetBrains Mono already loaded).
- **Scale (px):** 12 (ticker/eyebrow) · 13 (meta) · 15 (body) · 17 (lead) · 22 (card title) · 28 (section) · 40 (page title) · 56 (hero). Scoreboard numerals: 34–56 Barlow 900 tabular.

## Color
- **Approach:** Restrained — one accent + semantic states. Color is meaning, not decoration.
- **Core (dark, default):** `--bg #0a0a0b` · `--bg2 #131317` · `--bg3 #1c1c22` · `--line #2a2a33` · `--line2 #3a3a45` · `--ink #f5f5f7` · `--ink2 #a8a8b3` · `--ink3 #6a6a75`
- **Accent:** `--accent #ffcc00` (action: CTAs, current week, conf blocks, "you" markers) · `--accent2 #ffe066` (hover)
- **Pick-state semantics (complete set — use these, never raw colors):**
  - `--win #00d663` — graded correct
  - `--loss #ff3d4c` — graded wrong (also FINAL pills)
  - `--push #8a8a9a` — graded push/void
  - `--live #ffb01a` — **in progress. NEVER red.** Live ≠ wrong. Pulse dot + amber edge.
  - pending — dim `--accent` outline + "pick now" affordance, conf block dimmed (`--bg3`)
- **Card state edges:** 3px left border in the state color on game cards.
- **LED glow:** `text-shadow: 0 0 18px rgba(255,204,0,.35)` on hero scoreboard numbers only. Never on body text, never on more than ~3 numbers per screen.
- **Contrast rule:** `--ink3` only for ≥14px decorative/redundant text. Essential data uses `--ink2` minimum. Target 4.5:1 for all text under 18px.
- **Dark mode:** dark IS the default. Light theme exists (`[data-theme="light"]` in globals.css) — keep tokens in sync or hide the toggle.

## Spacing
- **Base unit:** 4px
- **Density — two modes:**
  - **Money surfaces** (picks, board, grid): compact — 44px minimum row height, 10–14px card padding, 6–10px gaps
  - **Reading surfaces** (marketing, blog, settings): spacious — 24–64px section rhythm, 680px max measure for prose
- **Touch floor:** 44px for every tappable element (week pills, conf chips, buttons, rows).
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **App shell:** ONE single-row header on every authenticated page: TPP logo block · league name + context subline · spacer · grid icon · overflow menu (⋯ holds Settings, Profile, Sign Out, theme). Sign Out never appears as a top-level header button. Save Picks lives ONLY in the sticky bottom bar.
- **Week rail:** horizontally scrollable pill row with right-edge fade; completed weeks dimmed/struck, current week solid yellow.
- **Picks desktop:** centered content + 320px right rail (confidence budget, unpicked count, submit state). No dead right-side void.
- **Reading content:** 680px max measure.
- **Grid (mobile):** player column ≤40% viewport; live week gets `--live` treatment, not zero-state.
- **Max content width:** 1100–1200px app, 680px prose.
- **Border radius:** 2px standard, 4px phone-frame/large cards. Square corners are the brand — never above 4px except pills (9999px on tiny status pills only).

## Motion
- **Approach:** minimal-functional + exactly 3 signature moments:
  1. **Chip slam** — pick selection: scale 1.04 → settle, ~150ms ease-out
  2. **Odometer tick** — score/points changes animate the number roll, ~250ms
  3. **Live pulse** — amber dot, 1.4s opacity loop on live games
- **Easing:** enter ease-out · exit ease-in · move ease-in-out
- **Duration:** micro 50–100ms · short 150–250ms · medium 250–400ms
- **Always honor `prefers-reduced-motion`** — pulse and odometer degrade to static.

## Anti-patterns (hard NOs)
- No purple, no gradients (except the single LED glow treatment), no glassmorphism
- No emoji as UI, no rounded-bubble cards, no mono body text
- Live state must never share color with loss state
- No new fonts beyond the three above

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-10 | Initial system created ("THE BOOK") | /design-consultation; grounded in Phase 1 audit (docs/design-audit-2026-06-10.md), memorable thing = Vegas-board energy |
| 2026-06-10 | Inter → Instrument Sans for body | De-genericize without changing metrics; display + mono unchanged |
| 2026-06-10 | New `--live #ffb01a` token | Live previously shared red with loss — Grid live-week read as broken |
| 2026-06-10 | Mono restricted to ticker/numbers | Mono-everywhere diluted the sportsbook signal |
