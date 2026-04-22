# Supabase

Schema and RLS policies for Club 943 Pick'em.

## Migrations

Files in `migrations/` are timestamped SQL scripts applied in filename order.

| File | Purpose |
| ---- | ------- |
| `20260420000001_initial_schema.sql` | Enums, tables, indexes, `updated_at` triggers, `auth.users` → `public.users` sync, `create_league` / `join_league_by_code` RPCs |
| `20260420000002_rls_policies.sql`   | Enables RLS on every table, plus `is_league_member` / `is_league_commissioner` helpers and per-table policies |
| `20260422000001_lock_slots.sql`     | `public.lock_slots()` — flips games/picks/MNF tiebreakers when kickoff is within 5 minutes (spec §2.3). Called by `/api/cron/lock-slots`. |

Tables follow spec §5.1. Notable deltas from the spec:

- `public.users.id` references `auth.users.id` directly (Clerk is gone; Supabase Auth is the source of truth).
- `picks.week` is denormalised so the `(user_id, league_id, week, confidence)` unique constraint is enforceable without a join.
- `payouts` has a `payout_week_matches_type` check: weekly payouts require a `week`, season payouts do not.
- `leagues.weekly_pool_pct + season_pool_pct = 1` is enforced by check constraint.

## Applying migrations

### Hosted Supabase

```bash
# Dashboard → SQL Editor → paste each file, or:
supabase db push   # requires supabase CLI linked to the project
```

### Local dev

```bash
supabase start                    # spins up local stack
supabase db reset                 # drops + re-applies all migrations
```

## RLS model

- **users** — any authenticated user can read (for display name / avatar); you can only update your own row.
- **leagues** — visible to members only. Any authenticated user can create a league (they must set themselves as `commissioner_id`), and only commissioners can update or delete.
- **league_members** — visible to other league members. Users can insert themselves (join) and delete themselves (leave); commissioners can update payment flags and remove members.
- **games** — read-only to authenticated users; writes are service-role only (odds sync, cron).
- **picks / mnf_tiebreakers** — own rows always visible; other league members' rows visible once `is_locked = true`. Insert/update/delete allowed on your own rows only while `is_locked = false`.
- **standings** — readable by league members; recomputed via service role.
- **payouts** — readable by league members; commissioners can flip `is_distributed`; all other writes service-role only.

Service-role clients (see `src/lib/supabase/admin.ts`) bypass RLS entirely, which is how cron and the odds-sync job will write `games`, `standings`, and `payouts`.

## RPCs

Both are `SECURITY DEFINER` so they can execute inside a single transaction without tripping RLS on intermediate rows.

### `public.create_league(name, season_year, entry_fee_cents?, max_players?, weekly_pool_pct?, season_pool_pct?) → uuid`

Creates a league with the caller as commissioner and inserts the matching `league_members` row. Defaults: $300 entry, 50 players, 36%/64% weekly/season split.

### `public.join_league_by_code(code text) → uuid`

Looks up a league by `invite_code` (status must be `open` or `active`) and inserts the caller into `league_members`. Raises on bad/closed codes. Case-insensitive.
