# Club 943 Pick'em

NFL ATS confidence pick'em platform. See `nfl-pickem-product-spec.docx` for the full
product spec and `nfl-ats-pickem-sheet.html` for the pick sheet design reference.

## Stack

- **Next.js 14** (App Router, React Server Components)
- **Tailwind CSS** with design tokens from §9.1 of the spec
- **Clerk** (`@clerk/nextjs` v6) for auth
- **Supabase** (`@supabase/ssr`) for database + realtime

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
- Supabase URL + anon key (+ service role key for cron / admin routes)
- Odds API key (§4.1) — not used yet, in place for Phase 1

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
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── components/
│   └── pick-sheet/         # PickSheet + sub-components
└── lib/
    └── supabase/
        ├── client.ts       # browser
        ├── server.ts       # RSC / route handlers (anon + cookie auth)
        └── admin.ts        # service-role (cron / webhooks only)
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

- Sync Clerk users into Supabase `users` table on sign-up webhook
- Game sync job against The Odds API
- Slot-locking cron (5 min before kickoff, §2.3)
- League create / join via invite code
- Commissioner admin panel (payment toggle, payout distribution)
- Auto-scoring + standings recompute
