-- Fix league_posts body constraint to allow image-only posts (null body)
alter table public.league_posts
  drop constraint if exists league_posts_body_check,
  alter column body drop not null;

alter table public.league_posts
  add constraint league_posts_body_check
    check (body is null or char_length(body) between 1 and 1000),
  add constraint league_posts_content_required
    check (body is not null or image_url is not null);

-- Add bounds constraints on leagues numeric fields editable by commissioner
alter table public.leagues
  add constraint leagues_entry_fee_cents_range
    check (entry_fee_cents >= 0 and entry_fee_cents <= 10000000),
  add constraint leagues_max_players_range
    check (max_players >= 2 and max_players <= 500),
  add constraint leagues_weekly_pool_pct_range
    check (weekly_pool_pct >= 0 and weekly_pool_pct <= 1),
  add constraint leagues_season_pool_pct_range
    check (season_pool_pct >= 0 and season_pool_pct <= 1);
