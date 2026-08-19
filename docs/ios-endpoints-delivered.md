# iOS server endpoints — as delivered

Response to `club943pickem-ios/docs/server-endpoints.md`. Everything below is
live in this repo and verified against a local instance seeded with all six
scoring formats. Read the **Deviations** section before wiring the client: three
things differ from what the spec assumed, and two of them change the decode.

## Product decisions

| Question | Decision |
|---|---|
| Consensus scope / visibility | **Global, always visible.** Aggregated across every league, so there is no leak and no reason to withhold it before lock. |
| Confidence tiers | **Quartiles of the range actually used**, computed server-side; label and range come back as strings. |
| CLEAR vs COVERING | **CLEAR removed.** Only `covering` / `on_the_number` / `not_covering`. |
| Live rank | **Included.** |

## What shipped

`supabase/migrations/20260818120000_ios_endpoints.sql`

```sql
get_game_consensus(p_season_year int, p_week int)
  -> table(game_id uuid, away_pct int, home_pct int, total int)     -- min 3 picks

get_league_pick_status(p_league_id uuid, p_season_year int, p_week int)
  -> table(user_id uuid, picks_made int, picks_required int)        -- commissioner only

get_live_week(p_league_id uuid, p_season_year int, p_week int)
  -> jsonb                                                          -- see shape below

set_pick_confidence(p_league_id uuid, p_game_id uuid, p_value int)
  -> void                                                           -- null clears

get_team_records(p_season_year int)
  -> table(team text, wins int, losses int, ties int)
```

`supabase/migrations/20260818120001_device_tokens.sql` — `public.device_tokens`,
RLS-scoped to the owning account. Upsert on `(user_id, token)`.

`src/app/api/profile-stats/route.ts` —
`GET /api/profile-stats?league=<uuid>&season=<year>[&user=<uuid>]`, bearer token
in `Authorization`. Returns the `ProfileStats` object plus `trusted` and
`blindSpots`.

### `get_live_week` shape

```json
{
  "games": [{ "game_id": "...", "cover_state": "covering",
              "cover_margin": 3.0, "confidence": 4, "live_points": 4 }],
  "banked_points": 3, "live_points": 7.0, "projected_points": 10.0,
  "banked_rank": 1, "live_rank": 1, "rank_delta": 0, "league_size": 3
}
```

`rank_delta` is positive when the player has moved **up** on live points.

## Deviations from the spec — these affect the client

1. **`get_live_week` returns one `jsonb` object, not a row set.** Banked points
   and live rank are per-user scalars; as columns they would repeat on every
   game row, and a player with no in-progress games would get zero rows and lose
   them entirely. Decode the object above rather than an array.

2. **There is no `clear` cover state.** `SweatPayload` should treat the enum as
   three cases. The spec's `margin >= 8` was the one invented number in the
   document and it is gone rather than guessed at.

3. **Consensus is global and takes no league id.** The call is
   `get_game_consensus(p_season_year, p_week)`. The design's "league consensus"
   label should read as the whole pool.

Smaller notes:

- **Cover state respects the scoring format.** Straight-up leagues
  (`straight_up`, `su_confidence`, `pick5_su`) are judged on the scoreboard, not
  the spread — the spec's draft applied the line unconditionally. Likewise
  `live_points` is the confidence value only in confidence formats; everything
  else stakes 1.0, and a Pick 5 push stakes 0.5, matching
  `grade_and_sync_standings`.
- **`set_pick_confidence` raises instead of failing silently.** `403` with
  `"this pick is locked; its game has already started"` when the target is
  locked, and `"confidence N is committed to a game that has already started"`
  when the value you are stealing is spent. `204` on success.
- **`picks.confidence` and `picks.picked_team` are nullable** and
  `points_earned` is `numeric` — the spec's SQL assumed otherwise.

## Fixed along the way

`get_league_pick_summary` had two overloads, `(uuid)` and `(uuid, integer)`,
which is what made the PostgREST call ambiguous. The one-argument form is
dropped. The surviving function was also `security definer` with **no membership
check**, so any authenticated user could read any league's per-user pick
summary; it now checks `is_league_member`. The web dashboard is the only caller
and always passed both arguments, so nothing there changes.

The web picks page now reads consensus from `get_game_consensus` instead of
counting picks itself with a service-role client, so the two platforms cannot
show different numbers.

## Not done

**The APNs sender.** The table is in place so tokens accumulate from now, but
sending needs a `.p8` key from the Apple Developer account, which does not exist
yet. When it does, the hook is the existing `lock-slots` cron — it already knows
which slots are closing, and `get_league_pick_status` gives it the per-user
missing-pick count.
