create table public.league_posts (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index league_posts_league_created_idx
  on public.league_posts (league_id, created_at desc);

create trigger league_posts_set_updated_at
  before update on public.league_posts
  for each row execute function public.set_updated_at();

alter table public.league_posts enable row level security;

-- Any league member can read posts
create policy league_posts_select
  on public.league_posts for select
  to authenticated
  using (public.is_league_member(league_id));

-- Any league member can post
create policy league_posts_insert
  on public.league_posts for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.is_league_member(league_id)
  );

-- Members can edit/delete their own posts; commissioner can pin/unpin any post
create policy league_posts_update
  on public.league_posts for update
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.league_members
      where league_id = league_posts.league_id
        and user_id = auth.uid()
        and is_commissioner = true
    )
  );

create policy league_posts_delete
  on public.league_posts for delete
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.league_members
      where league_id = league_posts.league_id
        and user_id = auth.uid()
        and is_commissioner = true
    )
  );
