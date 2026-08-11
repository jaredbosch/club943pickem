-- Per-week uniqueness on picks and tiebreaker_guesses ignored season_year,
-- so a league renewing next season would collide with (picks) or silently
-- overwrite (tiebreakers) the prior season's rows. Denormalize season_year
-- onto both tables (kept in sync from games via trigger) and scope the
-- unique constraints to it.

alter table public.picks add column if not exists season_year integer;
alter table public.tiebreaker_guesses add column if not exists season_year integer;

update public.picks p
set season_year = g.season_year
from public.games g
where g.id = p.game_id and p.season_year is null;

update public.tiebreaker_guesses t
set season_year = g.season_year
from public.games g
where g.id = t.game_id and t.season_year is null;

create or replace function public.set_season_year_from_game()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.season_year is null
     or (tg_op = 'UPDATE' and new.game_id is distinct from old.game_id) then
    select season_year into new.season_year from public.games where id = new.game_id;
  end if;
  return new;
end;
$$;

-- trigger-only function; keep it out of the PostgREST RPC surface
revoke execute on function public.set_season_year_from_game() from public, anon, authenticated;

drop trigger if exists set_picks_season_year on public.picks;
create trigger set_picks_season_year
  before insert or update of game_id on public.picks
  for each row execute function public.set_season_year_from_game();

drop trigger if exists set_tiebreaker_season_year on public.tiebreaker_guesses;
create trigger set_tiebreaker_season_year
  before insert or update of game_id on public.tiebreaker_guesses
  for each row execute function public.set_season_year_from_game();

alter table public.picks alter column season_year set not null;
alter table public.tiebreaker_guesses alter column season_year set not null;

-- picks: no app code upserts against the old constraint, safe to swap now
alter table public.picks
  drop constraint if exists picks_user_id_league_id_week_confidence_key;
alter table public.picks
  add constraint picks_user_league_season_week_confidence_key
  unique (user_id, league_id, season_year, week, confidence);

-- tiebreaker_guesses: the deployed app upserts ON CONFLICT (user_id, league_id, week),
-- so the old constraint must survive until the new client is live. Dropped in
-- 20260810120001_drop_seasonless_tiebreaker_unique.
alter table public.tiebreaker_guesses
  add constraint tiebreaker_user_league_season_week_key
  unique (user_id, league_id, season_year, week);
