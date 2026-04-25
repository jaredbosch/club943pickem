-- Add phone and venmo to league_members so commissioners can track
-- contact info and payment handles per league entry.

alter table public.league_members
  add column if not exists phone text,
  add column if not exists venmo text;
