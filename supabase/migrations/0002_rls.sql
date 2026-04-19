-- Row Level Security — Supabase Auth.
-- auth.uid() returns the signed-in user's UUID (= public.users.id).
-- service_role bypasses RLS for cron / trigger / webhook writes.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function is_member_of(target_league uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from league_members
    where league_id = target_league
      and user_id = auth.uid()
  );
$$;

create or replace function is_commissioner_of(target_league uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from league_members
    where league_id = target_league
      and user_id = auth.uid()
      and is_commissioner
  );
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table users enable row level security;
alter table leagues enable row level security;
alter table league_members enable row level security;
alter table games enable row level security;
alter table picks enable row level security;
alter table mnf_tiebreakers enable row level security;
alter table standings enable row level security;
alter table payouts enable row level security;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------

create policy "users_select_authenticated"
on users for select
to authenticated
using (true);

create policy "users_update_self"
on users for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Insert is handled by the on_auth_user_created trigger (service-definer);
-- delete cascades from auth.users on account removal.

-- ---------------------------------------------------------------------------
-- leagues
-- ---------------------------------------------------------------------------

create policy "leagues_select_members"
on leagues for select
to authenticated
using (is_member_of(id));

create policy "leagues_insert_authenticated"
on leagues for insert
to authenticated
with check (commissioner_id = auth.uid());

create policy "leagues_update_commissioner"
on leagues for update
to authenticated
using (is_commissioner_of(id))
with check (is_commissioner_of(id));

create policy "leagues_delete_commissioner"
on leagues for delete
to authenticated
using (is_commissioner_of(id));

-- ---------------------------------------------------------------------------
-- league_members
-- ---------------------------------------------------------------------------

create policy "league_members_select_same_league"
on league_members for select
to authenticated
using (is_member_of(league_id));

-- A user can add themselves to a league. is_commissioner must be false on
-- self-join; the commissioner row is created server-side with service role
-- during league creation.
create policy "league_members_insert_self"
on league_members for insert
to authenticated
with check (
  user_id = auth.uid()
  and is_commissioner = false
);

create policy "league_members_update_commissioner"
on league_members for update
to authenticated
using (is_commissioner_of(league_id))
with check (is_commissioner_of(league_id));

create policy "league_members_delete_self_or_commissioner"
on league_members for delete
to authenticated
using (
  user_id = auth.uid()
  or is_commissioner_of(league_id)
);

-- ---------------------------------------------------------------------------
-- games — read-only for authenticated users; writes via service role only.
-- ---------------------------------------------------------------------------

create policy "games_select_authenticated"
on games for select
to authenticated
using (true);

-- ---------------------------------------------------------------------------
-- picks
-- Once locked, picks become visible to fellow league members (for leaderboard).
-- Users can only write their own unlocked picks in leagues they belong to.
-- ---------------------------------------------------------------------------

create policy "picks_select_self_or_locked_league"
on picks for select
to authenticated
using (
  user_id = auth.uid()
  or (is_locked and is_member_of(league_id))
);

create policy "picks_insert_self"
on picks for insert
to authenticated
with check (
  user_id = auth.uid()
  and is_member_of(league_id)
  and is_locked = false
);

create policy "picks_update_self_unlocked"
on picks for update
to authenticated
using (user_id = auth.uid() and is_locked = false)
with check (user_id = auth.uid() and is_locked = false);

create policy "picks_delete_self_unlocked"
on picks for delete
to authenticated
using (user_id = auth.uid() and is_locked = false);

-- ---------------------------------------------------------------------------
-- mnf_tiebreakers — same pattern as picks.
-- ---------------------------------------------------------------------------

create policy "mnf_select_self_or_locked_league"
on mnf_tiebreakers for select
to authenticated
using (
  user_id = auth.uid()
  or (is_locked and is_member_of(league_id))
);

create policy "mnf_insert_self"
on mnf_tiebreakers for insert
to authenticated
with check (
  user_id = auth.uid()
  and is_member_of(league_id)
  and is_locked = false
);

create policy "mnf_update_self_unlocked"
on mnf_tiebreakers for update
to authenticated
using (user_id = auth.uid() and is_locked = false)
with check (user_id = auth.uid() and is_locked = false);

create policy "mnf_delete_self_unlocked"
on mnf_tiebreakers for delete
to authenticated
using (user_id = auth.uid() and is_locked = false);

-- ---------------------------------------------------------------------------
-- standings — read-only for league members; written by scoring cron.
-- ---------------------------------------------------------------------------

create policy "standings_select_members"
on standings for select
to authenticated
using (is_member_of(league_id));

-- ---------------------------------------------------------------------------
-- payouts — members see their league's payouts; commissioner toggles distribution.
-- ---------------------------------------------------------------------------

create policy "payouts_select_members"
on payouts for select
to authenticated
using (is_member_of(league_id));

create policy "payouts_update_commissioner"
on payouts for update
to authenticated
using (is_commissioner_of(league_id))
with check (is_commissioner_of(league_id));
