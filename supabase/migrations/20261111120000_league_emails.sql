-- Commissioner → league email.
--
-- 1. league_members.email_opt_out — per-league unsubscribe. Set only by the
--    signed unsubscribe link (service role); a commissioner can't flip it back
--    for someone through the normal member-update policy.
-- 2. league_emails — log of every send. Powers the "recent sends" list in the
--    Commissioner panel and the per-league rate limit.

alter table public.league_members
  add column if not exists email_opt_out boolean not null default false;

-- league_members_update_commissioner lets a commissioner update any column on
-- their members' rows. Keep email_opt_out out of reach for API roles.
create or replace function public.guard_league_member_email_opt_out()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.email_opt_out is distinct from old.email_opt_out
     and current_user in ('authenticated', 'anon') then
    new.email_opt_out := old.email_opt_out;
  end if;
  return new;
end;
$$;

revoke all on function public.guard_league_member_email_opt_out() from public, anon, authenticated;

drop trigger if exists league_members_guard_email_opt_out on public.league_members;
create trigger league_members_guard_email_opt_out
  before update on public.league_members
  for each row execute function public.guard_league_member_email_opt_out();

create table if not exists public.league_emails (
  id              uuid primary key default gen_random_uuid(),
  league_id       uuid not null references public.leagues (id) on delete cascade,
  sender_id       uuid references public.users (id) on delete set null,
  audience        text not null check (audience in ('all', 'unpaid', 'unpicked')),
  subject         text not null check (char_length(subject) between 1 and 150),
  body            text not null check (char_length(body) between 1 and 5000),
  recipient_count int  not null default 0 check (recipient_count >= 0),
  created_at      timestamptz not null default now()
);

create index if not exists league_emails_league_created_idx
  on public.league_emails (league_id, created_at desc);
create index if not exists league_emails_sender_idx
  on public.league_emails (sender_id);

-- Reads: the league's commissioners. Writes: service role only (the send
-- route), so there are deliberately no insert/update/delete policies.
alter table public.league_emails enable row level security;

drop policy if exists league_emails_select_commissioner on public.league_emails;
create policy league_emails_select_commissioner
  on public.league_emails for select
  to authenticated
  using (public.is_league_commissioner(league_id));
