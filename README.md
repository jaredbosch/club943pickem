# Club 943 Pick'em

NFL ATS confidence pick'em platform. See `nfl-pickem-product-spec.docx` for the full
product spec and `nfl-ats-pickem-sheet.html` for the pick sheet design reference.

## Stack

- **Next.js 14** (App Router, React Server Components)
- **Tailwind CSS** with design tokens from §9.1 of the spec
- **Supabase Auth** (`@supabase/ssr`) for auth, database + realtime

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/picks`.

### Required env vars

See `.env.local.example`. You'll need:

- Supabase URL + anon key (+ service role key for cron / admin routes)
- Odds API key (§4.1) — not used yet, in place for Phase 1

## Routes

| Route              | Auth       | Status                                          |
| ------------------ | ---------- | ----------------------------------------------- |
| `/`                | public     | redirects to `/picks`                           |
| `/picks`           | protected  | Pick sheet — mirrors HTML mockup, Week 7 fixture |
| `/sign-in`         | public     | Supabase email/password sign-in                 |
| `/sign-up`         | public     | Supabase email/password sign-up                 |
| `/auth/callback`   | public     | Exchanges email confirmation code for session   |

Protected routes are enforced in `middleware.ts` via Supabase session check.

## Structure

```
src/
├── app/
│   ├── layout.tsx          # DM Sans
│   ├── globals.css         # Tailwind + pick-sheet component classes
│   ├── page.tsx            # redirect -> /picks
│   ├── picks/page.tsx      # /picks
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── components/
│   └── pick-sheet/         # PickSheet + sub-components
└── lib/
    └── supabase/
        ├── client.ts       # browser
        ├── server.ts       # RSC / route handlers (anon + cookie auth)
        └── admin.ts        # service-role (cron / webhooks only)

supabase/
├── README.md               # schema + RLS overview
└── migrations/             # timestamped SQL migrations (spec §5.1)
```

## Database

Schema lives in [`supabase/migrations/`](./supabase/README.md). Apply with
`supabase db push` (CLI) or paste each file into the Supabase dashboard SQL
Editor in filename order.

## Odds sync

`GET /api/cron/sync-games` pulls the current NFL slate from
[The Odds API](https://the-odds-api.com) and upserts it into `public.games`
via the service-role client. Authentication is `Authorization: Bearer
$CRON_SECRET` (Vercel Cron convention).

The schedule is declared in `vercel.json`. Default is once a day at 12:00
UTC — Vercel Hobby caps crons at daily. On Pro you can swap to something
like `0 */2 * * 4,5,6,0,1` (every two hours Thu–Mon ET) for live spread
updates. Each invocation is one Odds API request; the free tier is 500/month.

Test locally:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/sync-games
```

Returns `{ ok, fetched, upserted, skipped }`.

## Pick sheet

`/picks` renders `PickSheet` with Week 7 fixture data that mirrors the mockup
pixel-for-pixel (same slot groups, same games, same confidence chips, same
live / locked / open states). Styling lives in `globals.css` under the `ps-*`
class namespace so the React markup maps 1:1 to the HTML reference.

Open (unlocked) games are interactive — clicking the pick button toggles
between away and home team. Locked and live games are display-only.

Replace `src/components/pick-sheet/week7-data.ts` with a loader that pulls from
Supabase + the Odds API once the data pipeline is wired up (§8).

## Slot locking

`GET /api/cron/lock-slots` calls the `public.lock_slots()` SQL function, which
flips `games.status` to `locked` (snapshotting `spread_home` into
`locked_spread_home`), sets `picks.is_locked = true`, and locks any MNF
tiebreakers whose week has a Monday game at kickoff. The threshold is
`kickoff_time <= now() + 5 minutes` per spec §2.3.

Auth matches `sync-games` (`Authorization: Bearer $CRON_SECRET`). Scheduled
in `vercel.json` at `*/5 * * * *` — Vercel Hobby caps crons at daily, so
this cadence requires Pro. Each run is a single RPC call; no external API.

Returns `{ ok, games_locked, picks_locked, tiebreakers_locked }`.

## Next steps (Phase 1, per §12)

- ~~Supabase schema + RLS policies~~ (done, PR #4)
- ~~Game sync job against The Odds API~~ (done)
- ~~Slot-locking cron (5 min before kickoff, §2.3)~~ (done)
- League create / join via invite code (UI for the `create_league` / `join_league_by_code` RPCs)
- Commissioner admin panel (payment toggle, payout distribution)
- Auto-scoring + standings recompute
