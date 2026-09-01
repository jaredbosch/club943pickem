-- Key/value markers for background sync jobs (e.g. last Odds API refresh).
-- RLS enabled with no policies: only the service-role admin client touches it.
create table if not exists public.sync_state (
  key text primary key,
  synced_at timestamptz not null default now()
);

alter table public.sync_state enable row level security;
