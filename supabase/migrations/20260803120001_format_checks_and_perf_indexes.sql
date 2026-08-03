-- Constrain the format columns to known values, and add the league-leading /
-- FK-covering indexes flagged by the performance advisors. picks(league_id,
-- week) is the important one: grading and league pick sheets filter by league
-- and previously had no league-leading index (seq scan per league).

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'leagues_scoring_type_check') then
    alter table public.leagues add constraint leagues_scoring_type_check
      check (scoring_type in ('ats_confidence','ats','straight_up','su_confidence','pick5_su','pick5_ats'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'leagues_weekly_pot_type_check') then
    alter table public.leagues add constraint leagues_weekly_pot_type_check
      check (weekly_pot_type in ('percentage','fixed'));
  end if;
end $$;

create index if not exists picks_league_week_idx on public.picks (league_id, week);
create index if not exists tiebreaker_guesses_league_idx on public.tiebreaker_guesses (league_id);
create index if not exists tiebreaker_guesses_game_idx on public.tiebreaker_guesses (game_id);
create index if not exists post_comments_post_idx on public.post_comments (post_id);
create index if not exists post_comments_league_idx on public.post_comments (league_id);
create index if not exists post_comments_user_idx on public.post_comments (user_id);
create index if not exists league_posts_user_idx on public.league_posts (user_id);
