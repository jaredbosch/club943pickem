# Club 943 Pick'em

NFL ATS confidence pick'em platform. See `nfl-pickem-product-spec.docx` for the full
product spec and `nfl-ats-pickem-sheet.html` for the pick sheet design reference.

## Stack

- **Next.js 14** (App Router, React Server Components)
- **Tailwind CSS** with design tokens from §9.1 of the spec
- **Supabase** for auth (email/password), database, and realtime. RLS policies
  resolve the signed-in user via `auth.uid()`; cookies are managed via
  `@supabase/ssr`.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/picks`.

### Required env vars

See `.env.local.example`. You'll need:

- Supabase URL + anon key (public)
- Supabase service role key (server-only, for cron / admin routes)
- Odds API key (§4.1) — not used yet, in place for Phase 1

### Database setup

SQL lives under `supabase/`:

- `supabase/migrations/0001_init.sql` — tables, enums, constraints, indexes
  (spec §5); `public.users` is keyed off `auth.users(id)` and populated by the
  `on_auth_user_created` trigger at sign-up time
- `supabase/migrations/0002_rls.sql` — RLS policies keyed off `auth.uid()`
- `supabase/seed.sql` — Week 7 2026 game fixture (idempotent on `external_id`)

Apply with the Supabase CLI (`supabase db push`) or paste each file into the SQL
editor in order.

## Routes

| Route              | Auth       | Notes                                          |
| ------------------ | ---------- | ----------------------------------------------- |
| `/`                | public     | redirects to `/picks`                           |
| `/picks`           | protected  | Pick sheet — Week 7 fixture                     |
| `/sign-in`         | public     | Email + password form                           |
| `/sign-up`         | public     | Email + password form                           |
| `/auth/callback`   | public     | Handles confirmation / magic-link redirects     |
| `/auth/sign-out`   | protected  | POST to sign out and redirect to `/sign-in`     |

Protected routes are enforced in `middleware.ts`, which also refreshes the
Supabase session cookie on every request.

## Structure

```
src/
├── app/
│   ├── layout.tsx          # DM Sans + tailwind body
│   ├── globals.css         # Tailwind + pick-sheet component classes
│   ├── page.tsx            # redirect -> /picks
│   ├── picks/page.tsx      # /picks
│   ├── sign-in/page.tsx    # email/password sign in
│   ├── sign-up/page.tsx    # email/password sign up
│   └── auth/
│       ├── actions.ts      # server actions: signIn, signUp, signOut
│       ├── callback/route.ts
│       └── sign-out/route.ts
├── components/
│   └── pick-sheet/         # PickSheet + sub-components
└── lib/
    └── supabase/
        ├── client.ts       # createClient() for browser
        ├── server.ts       # createClient() for RSC / route handlers
        └── admin.ts        # service-role (cron / admin routes only)

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

- Game sync job against The Odds API
- Slot-locking cron (5 min before kickoff, §2.3)
- League create / join via invite code
- Commissioner admin panel (payment toggle, payout distribution)
- Auto-scoring + standings recompute
- Swap `week7-data.ts` fixture for a live loader over `games`/`picks`
