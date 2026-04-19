# Club 943 Pick'em

NFL ATS confidence pick'em platform. See `nfl-pickem-product-spec.docx` for the
full product spec and `nfl-ats-pickem-sheet.html` for the pick sheet design
reference.

## Stack

- **Next.js 14** (App Router, React Server Components)
- **Tailwind CSS** with design tokens from §9.1 of the spec
- **Supabase** (`@supabase/ssr`) for auth + database + realtime
- **The Odds API** for live NFL ATS lines + scores
- **Vercel Cron** for the automation schedule (§8)

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — signed-out users go to
`/sign-in`; signed-in users land on `/leagues`.

### Required env vars

See `.env.local.example`:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (cron / admin routes)
- `ODDS_API_KEY` for The Odds API
- `CRON_SECRET` — bearer token required by `/api/cron/*`

### Database

Apply `supabase/migrations/0001_init.sql` via the Supabase SQL editor or CLI.
The migration creates all tables from §5 plus a trigger that mirrors
`auth.users` into `public.users`, so no extra webhook is needed for
sign-ups.

## Routes

| Route                         | Auth         | Purpose                                       |
| ----------------------------- | ------------ | --------------------------------------------- |
| `/`                           | —            | redirect: `/sign-in` or `/leagues`            |
| `/sign-in`, `/sign-up`        | public       | Supabase Auth (email + password)              |
| `/leagues`                    | protected    | List of your leagues                          |
| `/leagues/new`                | protected    | Create league → commissioner                  |
| `/leagues/join`               | protected    | Join by invite code                           |
| `/picks?league=…&week=…`      | protected    | Pick sheet, loads live games + your picks     |
| `/admin/[leagueId]`           | commissioner | Roster + payment toggle                       |
| `/api/leagues`                | user         | POST create                                   |
| `/api/leagues/join`           | user         | POST join                                     |
| `/api/leagues/:id/standings`  | member       | GET standings (?week=N, 0=season)             |
| `/api/leagues/:id/members`    | member       | GET roster                                    |
| `/api/picks`                  | user         | GET / POST picks for league+week              |
| `/api/tiebreaker`             | user         | POST MNF total prediction                     |
| `/api/admin/members/:id/paid` | commissioner | PATCH `{ is_paid }`                           |
| `/api/admin/payouts/:id/distribute` | commissioner | PATCH mark distributed                    |
| `/api/cron/sync-games`        | bearer       | Daily: upsert games + spreads                 |
| `/api/cron/lock-slots`        | bearer       | Every 5m: lock slots ≤ 5m before kickoff      |
| `/api/cron/score-games`       | bearer       | Every 5m: pull scores, grade picks, re-rank   |

`vercel.json` wires the cron schedules. All `/api/cron/*` routes require
`Authorization: Bearer $CRON_SECRET`.

## Structure

```
src/
├── app/
│   ├── admin/[leagueId]/          # commissioner panel
│   ├── api/
│   │   ├── admin/…                # paid toggle, payouts
│   │   ├── cron/                  # sync-games, lock-slots, score-games
│   │   ├── leagues/               # create, join, standings, members
│   │   ├── picks/                 # GET/POST picks
│   │   └── tiebreaker/            # MNF prediction
│   ├── leagues/                   # list, new, join pages
│   ├── picks/                     # live pick sheet (RSC → PickSheet)
│   ├── sign-in/, sign-up/         # Supabase Auth forms
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/pick-sheet/         # PickSheet, SlotGroup, GameRow, ConfidencePool
└── lib/
    ├── auth.ts                    # getUserId / requireUserId
    ├── cron-auth.ts               # bearer-token gate for /api/cron/*
    ├── db-types.ts                # row types mirroring the schema
    ├── format.ts                  # spread + countdown formatters
    ├── invite-code.ts             # 6-char unambiguous alphabet
    ├── nfl-week.ts                # season-year + week computation
    ├── odds-api.ts                # The Odds API client
    ├── scoring.ts                 # ATS grading
    ├── slots.ts                   # time-slot helpers + 5-min lock lead
    └── supabase/                  # client, server, admin
supabase/
└── migrations/0001_init.sql
```

## Phase 1 scope (per §12)

Delivered:

- Supabase Auth (sign-up / sign-in) + automatic user mirror trigger
- Invite-code league create & join
- Commissioner admin panel with per-member `is_paid` toggle
- Games sync + live spreads via The Odds API
- Slot locking at `kickoff - 5m`, including auto-fill of missing picks with
  the lowest remaining confidence (per §2.4) and MNF tiebreaker lock
- Per-game scoring (home/away/push) + weekly + season standings recompute
- Pick sheet driven by Supabase data for the authenticated member
- MNF tiebreaker prediction stored per (user, league, week)
- Vercel cron schedule

Still pending for Phase 1 polish: email/SMS reminders (Resend, Twilio),
weekly payout record generation, drag-and-drop confidence ranking (the
current UI uses numeric inputs with duplicate detection).
