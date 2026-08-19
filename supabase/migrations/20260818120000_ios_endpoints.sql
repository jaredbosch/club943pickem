-- Server-side endpoints for the native iOS app.
-- Spec: club943pickem-ios/docs/server-endpoints.md
--
-- Each function here exists because the client cannot produce the answer:
-- either RLS correctly hides the input rows (consensus, pick status, live
-- rank) or the logic is scoring and must have exactly one definition
-- (cover state, live points).
--
-- Every security-definer function checks membership itself. That check is
-- what replaces the RLS it bypasses.
--
-- Format handling is taken from grade_and_sync_standings, which is the
-- authoritative scoring definition:
--   ATS formats   : ats_confidence, ats, pick5_ats  -> spread decides
--   SU formats    : straight_up, su_confidence, pick5_su -> score decides
--   Confidence    : ats_confidence, su_confidence   -> points = confidence
--   Pick 5        : pick5_su, pick5_ats             -> push = 0.5, else 1.0


-- ---------------------------------------------------------------------------
-- 0. Collapse the get_league_pick_summary overloads.
--
-- (uuid) and (uuid, integer DEFAULT 2026) both existed, so a single-argument
-- PostgREST call is ambiguous and fails. Only the web dashboard calls this and
-- it always passes both arguments, so the one-argument form is dropped rather
-- than renamed.
--
-- The surviving definition also gains a membership check: it is SECURITY
-- DEFINER and had none, so any authenticated user could read any league's
-- per-user pick summary.
-- ---------------------------------------------------------------------------

drop function if exists public.get_league_pick_summary(uuid);

create or replace function public.get_league_pick_summary(
  p_league_id   uuid,
  p_season_year int default 2026
)
returns table (user_id uuid, total_graded bigint, correct_count bigint)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p.user_id,
    count(*)                                    as total_graded,
    count(*) filter (where p.is_correct = true) as correct_count
  from picks p
  join games g on g.id = p.game_id
  where p.league_id   = p_league_id
    and g.season_year = p_season_year
    and p.is_correct  is not null
    and public.is_league_member(p_league_id)
  group by p.user_id;
$$;


-- ---------------------------------------------------------------------------
-- 1. Pick consensus (Board meta bar: "68% DET").
--
-- Deliberately GLOBAL, not league-scoped: the percentage is an aggregate over
-- every pick on the platform, which is what the web picks page already shows.
-- League-scoping it would leak leaguemates' unlocked picks -- in a four-person
-- league "75% DET" plus your own pick identifies the other three -- and the
-- min-3 floor does not prevent that. Global has no such leak because the pool
-- is every user, and it keeps web and iOS showing the same number.
-- ---------------------------------------------------------------------------

create or replace function public.get_game_consensus(
  p_season_year int,
  p_week        int
)
returns table (game_id uuid, away_pct int, home_pct int, total int)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p.game_id,
    round(100.0 * count(*) filter (where p.picked_team = g.away_team) / count(*))::int,
    round(100.0 * count(*) filter (where p.picked_team = g.home_team) / count(*))::int,
    count(*)::int
  from picks p
  join games g on g.id = p.game_id
  where g.season_year = p_season_year
    and g.week        = p_week
    and p.picked_team is not null
    and p.picked_team in (g.home_team, g.away_team)
  group by p.game_id
  having count(*) >= 3;
$$;


-- ---------------------------------------------------------------------------
-- 2. Commissioner pick status (Commissioner screen: "11/13").
--
-- RLS hides leaguemates' unlocked picks, which is exactly the set this counts.
-- picks_required respects the Pick 5 cap so a Pick 5 commissioner sees 4/5,
-- not 4/16.
-- ---------------------------------------------------------------------------

create or replace function public.get_league_pick_status(
  p_league_id   uuid,
  p_season_year int,
  p_week        int
)
returns table (user_id uuid, picks_made int, picks_required int)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_required int;
begin
  if not public.is_league_commissioner(p_league_id) then
    raise exception 'not a commissioner of this league'
      using errcode = '42501';
  end if;

  select case
           when l.scoring_type in ('pick5_su', 'pick5_ats') then 5
           else (select count(*) from games g
                  where g.season_year = p_season_year
                    and g.week        = p_week)
         end
    into v_required
  from leagues l
  where l.id = p_league_id;

  return query
  select
    m.user_id,
    (select count(*) from picks p
      where p.user_id     = m.user_id
        and p.league_id   = p_league_id
        and p.season_year = p_season_year
        and p.week        = p_week
        and p.picked_team is not null)::int,
    coalesce(v_required, 0)
  from league_members m
  where m.league_id = p_league_id;
end;
$$;


-- ---------------------------------------------------------------------------
-- 3. Atomic confidence steal (Board confidence sheet).
--
-- Assigning a held value is two writes -- clear the previous holder, then set
-- the new one -- and they must happen in that order because of
-- picks_user_league_season_week_confidence_key. Doing them in one function
-- makes them one transaction, so a client that dies mid-flight cannot leave a
-- confidence value belonging to nobody.
--
-- SECURITY INVOKER is deliberate: the caller's RLS still applies, so a locked
-- pick is still refused by picks_update_own_unlocked and the kickoff guard.
-- ---------------------------------------------------------------------------

create or replace function public.set_pick_confidence(
  p_league_id uuid,
  p_game_id   uuid,
  p_value     int          -- null clears the value
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_week    int;
  v_season  int;
  v_updated int;
  v_holder  uuid;
  v_locked  boolean;
  v_target_locked boolean;
begin
  if p_value is not null and (p_value < 1 or p_value > 22) then
    raise exception 'confidence must be between 1 and 22, got %', p_value
      using errcode = '22003';
  end if;

  select g.week, g.season_year
    into v_week, v_season
  from games g
  where g.id = p_game_id;

  if v_week is null then
    raise exception 'game % not found', p_game_id using errcode = 'P0002';
  end if;

  -- The pick being written must exist and still be editable. Checked up front
  -- for the same reason as the holder check below: otherwise the UPDATE's
  -- WITH CHECK fires and the caller sees a bare row-level-security violation
  -- naming an internal statement instead of the actual reason.
  select p.is_locked into v_target_locked
  from picks p
  where p.user_id   = (select auth.uid())
    and p.league_id = p_league_id
    and p.game_id   = p_game_id;

  if not found then
    raise exception 'no pick for this game in this league' using errcode = 'P0002';
  end if;

  if v_target_locked or not public.game_is_open(p_game_id) then
    raise exception 'this pick is locked; its game has already started'
      using errcode = '42501';
  end if;

  -- Release the value from whichever pick is holding it this week.
  --
  -- The holder is checked before the write rather than letting the UPDATE
  -- fail: if its game has already started, RLS rejects the release and the
  -- caller would otherwise see either a bare row-level-security error or a
  -- unique-constraint violation on the following statement, neither of which
  -- says what actually went wrong. A confidence value committed to a started
  -- game is spent and cannot be reused.
  if p_value is not null then
    select p.game_id, p.is_locked
      into v_holder, v_locked
    from picks p
    where p.user_id     = (select auth.uid())
      and p.league_id   = p_league_id
      and p.season_year = v_season
      and p.week        = v_week
      and p.confidence  = p_value
      and p.game_id    <> p_game_id;

    if v_holder is not null then
      if v_locked or not public.game_is_open(v_holder) then
        raise exception
          'confidence % is committed to a game that has already started', p_value
          using errcode = '42501';
      end if;

      update picks
         set confidence = null
       where user_id   = (select auth.uid())
         and league_id = p_league_id
         and game_id   = v_holder;
    end if;
  end if;

  update picks
     set confidence = p_value
   where user_id   = (select auth.uid())
     and league_id = p_league_id
     and game_id   = p_game_id;

  get diagnostics v_updated = row_count;

  -- Without this the caller cannot tell "assigned" from "silently refused by
  -- RLS because the pick is locked".
  if v_updated = 0 then
    raise exception 'no editable pick for this game in this league'
      using errcode = '42501';
  end if;
end;
$$;


-- ---------------------------------------------------------------------------
-- 4. Live week -- cover state, live points, live rank (Sunday screen).
--
-- Returns jsonb rather than a row set for two reasons: banked points and live
-- rank are per-user scalars that would otherwise be repeated on every game
-- row, and a user with no in-progress games would get zero rows and lose them
-- entirely.
--
-- Shape:
--   {
--     "games": [ { "game_id", "cover_state", "cover_margin",
--                  "confidence", "live_points" } ],
--     "banked_points":   numeric,  -- already-final games this week
--     "live_points":     numeric,  -- at stake in games currently covering
--     "projected_points":numeric,  -- banked + live
--     "banked_rank":     int,      -- rank on final games only
--     "live_rank":       int,      -- rank on banked + live
--     "rank_delta":      int,      -- positive = moved up
--     "league_size":     int
--   }
--
-- cover_state is 'covering' | 'on_the_number' | 'not_covering'. There is no
-- 'clear' state: the boundary between "covering" and "covering comfortably"
-- has no definition anyone agreed on, so the distinction was dropped rather
-- than invented.
-- ---------------------------------------------------------------------------

create or replace function public.get_live_week(
  p_league_id   uuid,
  p_season_year int,
  p_week        int
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_scoring  text;
  v_is_ats   bool;
  v_is_conf  bool;
  v_is_pick5 bool;
  v_me       uuid := (select auth.uid());
  v_result   jsonb;
begin
  if not public.is_league_member(p_league_id) then
    raise exception 'not a member of this league' using errcode = '42501';
  end if;

  select scoring_type into v_scoring from leagues where id = p_league_id;
  v_is_ats   := v_scoring in ('ats_confidence', 'ats', 'pick5_ats');
  v_is_conf  := v_scoring in ('ats_confidence', 'su_confidence');
  v_is_pick5 := v_scoring in ('pick5_su', 'pick5_ats');

  with week_picks as (
    select
      p.user_id,
      p.game_id,
      p.picked_team,
      p.confidence,
      p.points_earned,
      g.home_team,
      g.away_team,
      g.home_score,
      g.away_score,
      g.status,
      coalesce(g.locked_spread_home, g.spread_home) as line
    from picks p
    join games g on g.id = p.game_id
    where p.league_id   = p_league_id
      and p.season_year = p_season_year
      and p.week        = p_week
      and p.picked_team is not null
  ),
  -- Margin, signed from the picker's point of view. ATS formats measure
  -- against the line; straight-up formats measure the scoreboard, because a
  -- straight-up league does not use the spread at all.
  live as (
    select
      wp.*,
      case
        when v_is_ats and wp.picked_team = wp.home_team
          then  (wp.home_score - wp.away_score + wp.line)
        when v_is_ats
          then -(wp.home_score - wp.away_score + wp.line)
        when wp.picked_team = wp.home_team
          then  (wp.home_score - wp.away_score)
        else  -(wp.home_score - wp.away_score)
      end::numeric as margin
    from week_picks wp
    where wp.status     = 'in_progress'
      and wp.home_score is not null
      and wp.away_score is not null
      and (not v_is_ats or wp.line is not null)
  ),
  -- Points at stake if the current margin holds. Mirrors the award side of
  -- grade_and_sync_standings: confidence formats pay the confidence value,
  -- everything else pays 1.0, and a Pick 5 push pays 0.5.
  scored as (
    select
      l.*,
      case
        when l.margin > 0 then
          case when v_is_conf then coalesce(l.confidence, 0)::numeric else 1.0 end
        when l.margin = 0 and v_is_pick5 then 0.5
        else 0.0
      end as live_points
    from live l
  ),
  banked as (
    select wp.user_id, coalesce(sum(wp.points_earned), 0)::numeric as pts
    from week_picks wp
    where wp.points_earned is not null
    group by wp.user_id
  ),
  member_totals as (
    select
      m.user_id,
      coalesce(b.pts, 0)                as banked_pts,
      coalesce(sum(s.live_points), 0)   as live_pts
    from league_members m
    left join banked b on b.user_id = m.user_id
    left join scored s on s.user_id = m.user_id
    where m.league_id = p_league_id
    group by m.user_id, b.pts
  ),
  ranked as (
    select
      mt.*,
      rank() over (order by mt.banked_pts desc)                    as banked_rank,
      rank() over (order by (mt.banked_pts + mt.live_pts) desc)    as live_rank,
      count(*) over ()                                             as league_size
    from member_totals mt
  ),
  mine as (select * from ranked where user_id = v_me)
  select jsonb_build_object(
    'games', coalesce((
      select jsonb_agg(jsonb_build_object(
        'game_id',      s.game_id,
        'cover_state',  case
                          when s.margin > 0 then 'covering'
                          when s.margin = 0 then 'on_the_number'
                          else                   'not_covering'
                        end,
        'cover_margin', s.margin,
        'confidence',   s.confidence,
        'live_points',  s.live_points
      ) order by s.live_points desc, s.margin asc)
      from scored s where s.user_id = v_me
    ), '[]'::jsonb),
    'banked_points',    coalesce((select banked_pts from mine), 0),
    'live_points',      coalesce((select live_pts   from mine), 0),
    'projected_points', coalesce((select banked_pts + live_pts from mine), 0),
    'banked_rank',      (select banked_rank from mine),
    'live_rank',        (select live_rank   from mine),
    'rank_delta',       (select banked_rank - live_rank from mine),
    'league_size',      coalesce((select league_size from mine), 0)
  )
  into v_result;

  return v_result;
end;
$$;


-- ---------------------------------------------------------------------------
-- 5. Team records (Board team rows: "4-2").
--
-- Derived from finished games rather than synced from ESPN: it needs no new
-- table, no new sync path, and no new failure mode, and it is always
-- consistent with the scores this app grades against. The tradeoff is that it
-- only counts games in this database.
-- ---------------------------------------------------------------------------

create or replace function public.get_team_records(p_season_year int)
returns table (team text, wins int, losses int, ties int)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with sides as (
    select g.home_team as team, g.home_score as pf, g.away_score as pa
    from games g
    where g.season_year = p_season_year and g.status = 'final'
      and g.home_score is not null and g.away_score is not null
    union all
    select g.away_team, g.away_score, g.home_score
    from games g
    where g.season_year = p_season_year and g.status = 'final'
      and g.home_score is not null and g.away_score is not null
  )
  select
    s.team,
    count(*) filter (where s.pf >  s.pa)::int,
    count(*) filter (where s.pf <  s.pa)::int,
    count(*) filter (where s.pf =  s.pa)::int
  from sides s
  group by s.team;
$$;


-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

revoke execute on function public.get_league_pick_summary(uuid, integer) from public, anon;
revoke execute on function public.get_game_consensus(integer, integer)    from public, anon;
revoke execute on function public.get_league_pick_status(uuid, integer, integer) from public, anon;
revoke execute on function public.set_pick_confidence(uuid, uuid, integer) from public, anon;
revoke execute on function public.get_live_week(uuid, integer, integer)    from public, anon;
revoke execute on function public.get_team_records(integer)                from public, anon;

grant execute on function public.get_league_pick_summary(uuid, integer) to authenticated;
grant execute on function public.get_game_consensus(integer, integer)    to authenticated;
grant execute on function public.get_league_pick_status(uuid, integer, integer) to authenticated;
grant execute on function public.set_pick_confidence(uuid, uuid, integer) to authenticated;
grant execute on function public.get_live_week(uuid, integer, integer)    to authenticated;
grant execute on function public.get_team_records(integer)                to authenticated;

-- Consensus and live rank both scan a week of picks across every league /
-- every member; the existing picks indexes are user-scoped.
create index if not exists picks_season_week_idx
  on public.picks (season_year, week);
create index if not exists picks_league_season_week_idx
  on public.picks (league_id, season_year, week);
