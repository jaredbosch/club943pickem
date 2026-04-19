# Club 943 Pick'em

NFL ATS confidence pick'em platform. See `nfl-pickem-product-spec.docx` for the full
product spec and `nfl-ats-pickem-sheet.html` for the pick sheet design reference.

## Stack

- **Next.js 14** (App Router, React Server Components)
- **Tailwind CSS** with design tokens from §9.1 of the spec
- **Clerk** (`@clerk/nextjs` v6) for auth
- **Supabase** for database + realtime, with Clerk JWTs forwarded via third-party
  auth (RLS policies resolve the Clerk user ID from `auth.jwt()->>'sub'`)

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/picks`.

### Required env vars

See `.env.local.example`. You'll need:

- Clerk publishable + secret keys
- `CLERK_WEBHOOK_SECRET` (Svix signing secret for the `/api/webhooks/clerk` endpoint)
- Supabase URL + anon key (+ service role key for cron / admin routes)
- Odds API key (§4.1) — not used yet, in place for Phase 1

### Database setup

SQL lives under `supabase/`:

- `supabase/migrations/0001_init.sql` — tables, enums, constraints, indexes (spec §5)
- `supabase/migrations/0002_rls.sql` — RLS policies keyed off Clerk JWT `sub`
- `supabase/seed.sql` — Week 7 2026 game fixture (idempotent on `external_id`)

Apply with the Supabase CLI (`supabase db push`) or paste each file into the SQL
editor in order. Third-party auth integration required: enable Clerk as a trusted
issuer in **Supabase → Authentication → Third Party Auth**, and enable the
Supabase integration in **Clerk dashboard → Integrations**. No JWT template
needed — the default Clerk session token carries `sub = clerk user id`, which is
exactly `users.id` in this schema.

### Clerk user sync

`POST /api/webhooks/clerk` verifies the Svix signature and upserts into
`users` on `user.created` / `user.updated`, and deletes on `user.deleted`.
Configure in Clerk dashboard → Webhooks with URL
`https://<host>/api/webhooks/clerk` and events
`user.created, user.updated, user.deleted`.

## Routes

| Route              | Auth       | Status                                          |
| ------------------ | ---------- | ----------------------------------------------- |
| `/`                | public     | redirects to `/picks`                           |
| `/picks`           | protected  | Pick sheet — mirrors HTML mockup, Week 7 fixture |
| `/sign-in`         | public     | Clerk sign-in                                   |
| `/sign-up`         | public     | Clerk sign-up                                   |

Protected routes are enforced in `middleware.ts` via `createRouteMatcher`.

## Structure

```
src/
├── app/
│   ├── layout.tsx          # ClerkProvider + DM Sans
│   ├── globals.css         # Tailwind + pick-sheet component classes
│   ├── page.tsx            # redirect -> /picks
│   ├── picks/page.tsx      # /picks
│   ├── api/webhooks/clerk/ # Clerk -> users table sync
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── components/
│   └── pick-sheet/         # PickSheet + sub-components
└── lib/
    └── supabase/
        ├── client.ts       # useSupabaseClient() hook (Clerk JWT)
        ├── server.ts       # createServerSupabaseClient() (Clerk JWT)
        └── admin.ts        # service-role (cron / webhooks only)

supabase/
├── migrations/             # apply in order via `supabase db push`
└── seed.sql                # Week 7 fixture
```

## Pick sheet

`/picks` renders `PickSheet` with Week 7 fixture data that mirrors the mockup
pixel-for-pixel (same slot groups, same games, same confidence chips, same
live / locked / open states). Styling lives in `globals.css` under the `ps-*`
class namespace so the React markup maps 1:1 to the HTML reference.

Open (unlocked) games are interactive — clicking the pick button toggles
between away and home team. Locked and live games are display-only.

Replace `src/components/pick-sheet/week7-data.ts` with a loader that pulls from
Supabase + the Odds API once the data pipeline is wired up (§8).

## Next steps (Phase 1, per §12)

- ~~Sync Clerk users into Supabase `users` table on sign-up webhook~~ (done)
- Game sync job against The Odds API
- Slot-locking cron (5 min before kickoff, §2.3)
- League create / join via invite code
- Commissioner admin panel (payment toggle, payout distribution)
- Auto-scoring + standings recompute
- Swap `week7-data.ts` fixture for a live loader over `games`/`picks`
