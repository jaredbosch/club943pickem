-- users_select_authenticated is USING (true) so display names and avatars
-- resolve across leagues — but that also exposed every account's email to any
-- signed-in user. Remove the email column from the anon/authenticated grants;
-- the app reads the signed-in user's own email from the auth session instead.
-- Service role (admin dashboard, crons) is unaffected.

revoke select on table public.users from anon;
revoke select on table public.users from authenticated;
grant select (id, display_name, avatar_url, created_at, updated_at)
  on table public.users to authenticated;
