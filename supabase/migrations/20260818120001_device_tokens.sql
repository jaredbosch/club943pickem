-- Destination for the APNs device tokens the iOS client already requests,
-- registers for, and captures. Until this table exists it has nowhere to send
-- them.
--
-- This is the storage half of the notification suite only. The sender -- an
-- APNs .p8 key in the environment and a cron route that fans out -- is not
-- here: it needs an Apple Developer key that does not exist yet. Landing the
-- table first means tokens start accumulating now, so the sender has a
-- population to deliver to on the day it ships. The natural hook for it is the
-- existing lock-slots cron, which already knows which slots are about to
-- close, and get_league_pick_status gives it the per-user missing-pick count.

create table if not exists public.device_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users (id) on delete cascade,
  token       text not null,
  platform    text not null default 'ios',
  -- Debug builds get sandbox APNs tokens and TestFlight/App Store builds get
  -- production ones. Recording which avoids silently dropping every
  -- notification after a build channel change.
  environment text not null default 'production',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, token),
  constraint device_tokens_platform_check    check (platform in ('ios', 'android')),
  constraint device_tokens_environment_check check (environment in ('production', 'sandbox'))
);

create index if not exists device_tokens_user_idx on public.device_tokens (user_id);

drop trigger if exists device_tokens_set_updated_at on public.device_tokens;
create trigger device_tokens_set_updated_at
  before update on public.device_tokens
  for each row execute function public.set_updated_at();

alter table public.device_tokens enable row level security;

-- A device token is readable and writable only by the account it belongs to.
-- The sender runs as the service role, which bypasses RLS.
drop policy if exists device_tokens_own on public.device_tokens;
create policy device_tokens_own on public.device_tokens
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
