# club943pickem — thepickempool

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Dev notes
- `npm run dev` — port 3000 is often taken; Next falls back to 3001.
- Test data: `node scripts/seed-test-season.mjs` (needs `.env.local` sourced) seeds
  league `6V7A3F` "Club943 Test" with 25 fake users (password `SeedUser2026!!`,
  e.g. `matt.thompson.tpp@mailinator.com`), weeks 1–7 final, week 8 live.
  Safe to re-run; cleans its own data.
- Design audit (Phase 1, 2026-06-10): docs/design-audit-2026-06-10.md
