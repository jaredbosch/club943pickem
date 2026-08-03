-- Fix the auth_rls_initplan lints: bare auth.uid() in a policy is re-evaluated
-- per row; (select auth.uid()) is evaluated once per query. Semantics are
-- unchanged. Also merges the two permissive DELETE policies on post_comments
-- into one, and scopes tiebreaker_guesses / post_comments policies to
-- authenticated (they were created for public, wasting evaluation on anon).

-- users
drop policy if exists users_update_self on public.users;
create policy users_update_self
  on public.users for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- leagues
drop policy if exists leagues_insert_self_commissioner on public.leagues;
create policy leagues_insert_self_commissioner
  on public.leagues for insert
  to authenticated
  with check (commissioner_id = (select auth.uid()));

-- league_members
drop policy if exists league_members_insert_self on public.league_members;
create policy league_members_insert_self
  on public.league_members for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists league_members_delete_self_or_commissioner on public.league_members;
create policy league_members_delete_self_or_commissioner
  on public.league_members for delete
  to authenticated
  using (user_id = (select auth.uid()) or public.is_league_commissioner(league_id));

-- picks
drop policy if exists picks_select_own_or_locked_leaguemate on public.picks;
create policy picks_select_own_or_locked_leaguemate
  on public.picks for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (is_locked = true and public.is_league_member(league_id))
  );

drop policy if exists picks_insert_own_unlocked on public.picks;
create policy picks_insert_own_unlocked
  on public.picks for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and is_locked = false
    and public.is_league_member(league_id)
  );

drop policy if exists picks_update_own_unlocked on public.picks;
create policy picks_update_own_unlocked
  on public.picks for update
  to authenticated
  using (user_id = (select auth.uid()) and is_locked = false)
  with check (user_id = (select auth.uid()) and is_locked = false);

drop policy if exists picks_delete_own_unlocked on public.picks;
create policy picks_delete_own_unlocked
  on public.picks for delete
  to authenticated
  using (user_id = (select auth.uid()) and is_locked = false);

-- mnf_tiebreakers
drop policy if exists tiebreakers_select_own_or_locked_leaguemate on public.mnf_tiebreakers;
create policy tiebreakers_select_own_or_locked_leaguemate
  on public.mnf_tiebreakers for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (is_locked = true and public.is_league_member(league_id))
  );

drop policy if exists tiebreakers_insert_own_unlocked on public.mnf_tiebreakers;
create policy tiebreakers_insert_own_unlocked
  on public.mnf_tiebreakers for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and is_locked = false
    and public.is_league_member(league_id)
  );

drop policy if exists tiebreakers_update_own_unlocked on public.mnf_tiebreakers;
create policy tiebreakers_update_own_unlocked
  on public.mnf_tiebreakers for update
  to authenticated
  using (user_id = (select auth.uid()) and is_locked = false)
  with check (user_id = (select auth.uid()) and is_locked = false);

drop policy if exists tiebreakers_delete_own_unlocked on public.mnf_tiebreakers;
create policy tiebreakers_delete_own_unlocked
  on public.mnf_tiebreakers for delete
  to authenticated
  using (user_id = (select auth.uid()) and is_locked = false);

-- league_posts
drop policy if exists league_posts_insert on public.league_posts;
create policy league_posts_insert
  on public.league_posts for insert
  to authenticated
  with check (user_id = (select auth.uid()) and public.is_league_member(league_id));

drop policy if exists league_posts_update on public.league_posts;
create policy league_posts_update
  on public.league_posts for update
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.league_members lm
      where lm.league_id = league_posts.league_id
        and lm.user_id = (select auth.uid())
        and lm.is_commissioner = true
    )
  );

drop policy if exists league_posts_delete on public.league_posts;
create policy league_posts_delete
  on public.league_posts for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.league_members lm
      where lm.league_id = league_posts.league_id
        and lm.user_id = (select auth.uid())
        and lm.is_commissioner = true
    )
  );

-- tiebreaker_guesses
drop policy if exists tiebreaker_select on public.tiebreaker_guesses;
create policy tiebreaker_select
  on public.tiebreaker_guesses for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      public.is_league_member(league_id)
      and exists (
        select 1 from public.games g
        where g.id = tiebreaker_guesses.game_id
          and g.status in ('in_progress', 'final')
      )
    )
  );

drop policy if exists tiebreaker_insert on public.tiebreaker_guesses;
create policy tiebreaker_insert
  on public.tiebreaker_guesses for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_league_member(league_id)
    and exists (
      select 1 from public.games g
      where g.id = tiebreaker_guesses.game_id and g.status = 'scheduled'
    )
  );

drop policy if exists tiebreaker_update on public.tiebreaker_guesses;
create policy tiebreaker_update
  on public.tiebreaker_guesses for update
  to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.games g
      where g.id = tiebreaker_guesses.game_id and g.status = 'scheduled'
    )
  );

-- post_comments (also merge the two DELETE policies into one)
drop policy if exists "league members can view post comments" on public.post_comments;
create policy "league members can view post comments"
  on public.post_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.league_members lm
      where lm.league_id = post_comments.league_id
        and lm.user_id = (select auth.uid())
    )
  );

drop policy if exists "league members can post comments" on public.post_comments;
create policy "league members can post comments"
  on public.post_comments for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.league_members lm
      where lm.league_id = post_comments.league_id
        and lm.user_id = (select auth.uid())
    )
  );

drop policy if exists "users can delete own comments" on public.post_comments;
drop policy if exists "commissioners can delete any comment" on public.post_comments;
create policy post_comments_delete_own_or_commissioner
  on public.post_comments for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.league_members lm
      where lm.league_id = post_comments.league_id
        and lm.user_id = (select auth.uid())
        and lm.is_commissioner = true
    )
  );
