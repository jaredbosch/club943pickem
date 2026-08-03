-- Fix: invite codes failed for every league (reported 2026-08-02).
-- create_league leaves leagues.status at its 'draft' default and nothing in
-- the app ever transitions it, but join_league_by_code only matches
-- status in ('open', 'active') — so every invite code raised
-- "Invalid invite code". Leagues are joinable from the moment they're created.

alter table public.leagues alter column status set default 'open';

update public.leagues set status = 'open' where status = 'draft';

-- Enforce the commissioner's Lock Registration toggle at the join boundary:
-- the support FAQ promises the invite code stops working once registration is
-- locked, but the RPC never checked it. Existing members still resolve the
-- league so a re-join stays a no-op.
create or replace function public.join_league_by_code(_code text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  _league_id uuid;
  _locked boolean;
  _uid uuid := auth.uid();
begin
  if _uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select id, registration_locked into _league_id, _locked
  from public.leagues
  where invite_code = upper(_code)
    and status in ('open', 'active');

  if _league_id is null then
    raise exception 'Invalid invite code' using errcode = 'P0002';
  end if;

  if _locked and not exists (
    select 1 from public.league_members
    where league_id = _league_id and user_id = _uid
  ) then
    raise exception 'Registration for this league is locked' using errcode = 'P0001';
  end if;

  insert into public.league_members (league_id, user_id)
  values (_league_id, _uid)
  on conflict (league_id, user_id) do nothing;

  return _league_id;
end;
$$;
