-- Security hardening (2026-08-02, applied to prod via MCP apply_migration):
-- anon must not invoke SECURITY DEFINER RPCs; trigger/cron functions are not
-- callable by signed-in users; pin search_path on linter-flagged functions.

revoke execute on function public.create_league(text, integer, integer, integer, numeric, numeric) from anon;
revoke execute on function public.get_league_pick_summary(uuid) from anon;
revoke execute on function public.get_league_pick_summary(uuid, integer) from anon;
revoke execute on function public.handle_new_auth_user() from anon;
revoke execute on function public.is_league_commissioner(uuid) from anon;
revoke execute on function public.is_league_member(uuid) from anon;
revoke execute on function public.join_league_by_code(text) from anon;
revoke execute on function public.lock_slots() from anon;
revoke execute on function public.sync_tiebreaker_actuals(uuid) from anon;

revoke execute on function public.handle_new_auth_user() from authenticated;
revoke execute on function public.lock_slots() from authenticated;

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.gen_invite_code() set search_path = public, pg_temp;
alter function public.get_league_pick_summary(uuid) set search_path = public, pg_temp;
alter function public.get_league_pick_summary(uuid, integer) set search_path = public, pg_temp;
alter function public.grade_and_sync_standings(uuid, integer) set search_path = public, pg_temp;
