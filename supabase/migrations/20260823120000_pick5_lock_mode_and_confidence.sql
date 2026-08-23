-- Pick 5 league options, set from the commissioner panel:
--
--   pick5_lock_mode — when the weekly pick window closes.
--     'thursday' (default): all picks lock at the Thursday game's kickoff.
--     'sunday': picks lock at the week's first Sunday kickoff; games that kick
--     off before then (Thursday/Friday/Saturday) lock at their own kickoff so
--     a finished game can never be picked.
--
--   pick5_confidence — rank the 5 picks 1–5 (5 = most confident).
--     Win pays the rank, push pays half the rank, loss pays 0.
--     Off (default) keeps the flat 1 / 0.5 / 0 scoring.
--
-- Also closes a pre-existing gap: the Pick 5 weekly deadline was only
-- enforced client-side — the picks RLS gate (game_is_open) only checked each
-- game's own kickoff, so a Pick 5 pick on a Sunday game could still be
-- written after Thursday via a direct API call. The new pick_window_open()
-- gate is league-aware and enforces the actual deadline.

alter table public.leagues
  add column if not exists pick5_lock_mode text not null default 'thursday'
    constraint leagues_pick5_lock_mode_check check (pick5_lock_mode in ('thursday', 'sunday')),
  add column if not exists pick5_confidence boolean not null default false;

-- ---------------------------------------------------------------------------
-- League-aware pick write gate. Replaces game_is_open() in the picks
-- policies (game_is_open itself is kept — set_pick_confidence still uses it
-- for its per-game holder checks).
-- ---------------------------------------------------------------------------

create or replace function public.pick_window_open(p_league_id uuid, p_game_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_scoring  text;
  v_mode     text;
  v_kickoff  timestamptz;
  v_week     int;
  v_season   int;
  v_status   game_status;
  v_deadline timestamptz;
begin
  select l.scoring_type, l.pick5_lock_mode
    into v_scoring, v_mode
  from leagues l where l.id = p_league_id;

  select g.kickoff_time, g.week, g.season_year, g.status
    into v_kickoff, v_week, v_season, v_status
  from games g where g.id = p_game_id;

  if v_scoring is null or v_kickoff is null then
    return false;
  end if;

  -- Standard formats: unchanged from game_is_open — 5 minutes before kickoff.
  if v_scoring not in ('pick5_su', 'pick5_ats') then
    return v_status = 'scheduled'
       and v_kickoff - interval '5 minutes' > now();
  end if;

  -- Pick 5: weekly deadline per league setting. A week without the deadline
  -- slot (e.g. no Thursday game in week 18) has no weekly deadline and falls
  -- back to per-game kickoff, matching the pick sheet.
  if v_mode = 'sunday' then
    select min(g.kickoff_time) into v_deadline
    from games g
    where g.season_year = v_season and g.week = v_week
      and g.time_slot in ('sunday_early', 'sunday_late', 'sunday_night');
  else
    select min(g.kickoff_time) into v_deadline
    from games g
    where g.season_year = v_season and g.week = v_week
      and g.time_slot = 'thursday';
  end if;

  -- Open until the earlier of the weekly deadline and the game's own kickoff.
  -- (lock_slots may still flip is_locked on a saved pick 5 minutes before its
  -- own game's kickoff — a stricter-by-≤5min edge on the deadline game only.)
  return now() < least(coalesce(v_deadline, v_kickoff), v_kickoff);
end;
$$;

revoke all on function public.pick_window_open(uuid, uuid) from public;
grant execute on function public.pick_window_open(uuid, uuid) to authenticated;

drop policy if exists picks_insert_own_unlocked on public.picks;
create policy picks_insert_own_unlocked
  on public.picks for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and is_locked = false
    and public.is_league_member(league_id)
    and public.pick_window_open(league_id, game_id)
  );

drop policy if exists picks_update_own_unlocked on public.picks;
create policy picks_update_own_unlocked
  on public.picks for update
  to authenticated
  using (user_id = (select auth.uid()) and is_locked = false)
  with check (
    user_id = (select auth.uid())
    and is_locked = false
    and public.pick_window_open(league_id, game_id)
  );

drop policy if exists picks_delete_own_unlocked on public.picks;
create policy picks_delete_own_unlocked
  on public.picks for delete
  to authenticated
  using (
    user_id = (select auth.uid())
    and is_locked = false
    and public.pick_window_open(league_id, game_id)
  );

-- ---------------------------------------------------------------------------
-- Grading: Pick 5 confidence pays the rank on a win and half the rank on a
-- push. Identical to 20260803120002 except for v_p5_conf.
-- ---------------------------------------------------------------------------

create or replace function public.grade_and_sync_standings(
  p_league_id uuid,
  p_season_year integer,
  p_force boolean default false
)
returns jsonb
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
DECLARE
  v_week     int;
  v_graded   int := 0;
  v_weeks    int[] := '{}';
  v_tb_weeks int[] := '{}';
  v_scoring  text;
  v_is_ats   bool;
  v_is_conf  bool;
  v_is_pick5 bool;
  v_p5_conf  bool;
BEGIN
  SELECT scoring_type, COALESCE(pick5_confidence, false)
  INTO v_scoring, v_p5_conf
  FROM leagues WHERE id = p_league_id;
  v_is_ats   := v_scoring IN ('ats_confidence','ats','pick5_ats');
  v_is_conf  := v_scoring IN ('ats_confidence','su_confidence');
  v_is_pick5 := v_scoring IN ('pick5_su','pick5_ats');
  v_p5_conf  := v_is_pick5 AND v_p5_conf;

  WITH updated AS (
    UPDATE picks p
    SET
      is_correct = CASE
        WHEN v_is_ats AND (g.home_score - g.away_score + COALESCE(g.locked_spread_home, g.spread_home)) = 0
          THEN NULL
        WHEN v_is_ats
          THEN (p.picked_team = CASE
                  WHEN g.home_score - g.away_score + COALESCE(g.locked_spread_home, g.spread_home) > 0
                  THEN g.home_team ELSE g.away_team END)
        WHEN NOT v_is_ats AND g.home_score = g.away_score THEN NULL
        ELSE (p.picked_team = CASE WHEN g.home_score > g.away_score THEN g.home_team ELSE g.away_team END)
      END,
      points_earned = CASE
        WHEN v_is_ats AND (g.home_score - g.away_score + COALESCE(g.locked_spread_home, g.spread_home)) = 0
          THEN CASE
                 WHEN v_p5_conf  THEN COALESCE(p.confidence, 0) * 0.5
                 WHEN v_is_pick5 THEN 0.5
                 ELSE 0
               END
        WHEN NOT v_is_ats AND g.home_score = g.away_score
          THEN CASE
                 WHEN v_p5_conf  THEN COALESCE(p.confidence, 0) * 0.5
                 WHEN v_is_pick5 THEN 0.5
                 ELSE 0
               END
        WHEN (v_is_ats AND p.picked_team = CASE
                WHEN g.home_score - g.away_score + COALESCE(g.locked_spread_home, g.spread_home) > 0
                THEN g.home_team ELSE g.away_team END)
          OR (NOT v_is_ats AND p.picked_team = CASE
                WHEN g.home_score > g.away_score THEN g.home_team ELSE g.away_team END)
          THEN CASE WHEN v_is_conf OR v_p5_conf THEN COALESCE(p.confidence, 0)::real ELSE 1.0 END
        ELSE 0.0
      END,
      updated_at = now()
    FROM games g
    WHERE p.game_id     = g.id
      AND p.league_id   = p_league_id
      AND g.season_year = p_season_year
      AND g.status      = 'final'
      AND g.home_score  IS NOT NULL
      AND g.away_score  IS NOT NULL
      AND p.picked_team IS NOT NULL
      AND (NOT v_is_ats OR COALESCE(g.locked_spread_home, g.spread_home) IS NOT NULL)
      AND (p_force OR p.points_earned IS NULL)
    RETURNING p.week
  )
  SELECT count(*), COALESCE(array_agg(DISTINCT week), '{}')
  INTO v_graded, v_weeks
  FROM updated;

  WITH tb AS (
    UPDATE tiebreaker_guesses tg
    SET actual_total = g.home_score + g.away_score,
        updated_at   = now()
    FROM games g
    WHERE g.id           = tg.game_id
      AND tg.league_id   = p_league_id
      AND g.status       = 'final'
      AND g.home_score   IS NOT NULL
      AND g.away_score   IS NOT NULL
      AND tg.actual_total IS NULL
    RETURNING tg.week
  )
  SELECT COALESCE(array_agg(DISTINCT week), '{}') INTO v_tb_weeks FROM tb;

  v_weeks := (SELECT COALESCE(array_agg(DISTINCT w ORDER BY w), '{}')
              FROM unnest(v_weeks || v_tb_weeks) AS t(w));

  IF COALESCE(array_length(v_weeks, 1), 0) = 0 THEN
    RETURN jsonb_build_object('graded_picks', v_graded);
  END IF;

  FOREACH v_week IN ARRAY v_weeks LOOP
    INSERT INTO standings (user_id, league_id, week, season_year, total_points, correct_picks, rank)
    SELECT p.user_id, p_league_id, v_week, p_season_year,
      COALESCE(SUM(p.points_earned), 0) AS total_points,
      COUNT(*) FILTER (WHERE p.is_correct = true)::int AS correct_picks,
      RANK() OVER (
        ORDER BY COALESCE(SUM(p.points_earned), 0) DESC,
                 COUNT(*) FILTER (WHERE p.is_correct = true) DESC,
                 MIN(ABS(tg.guess - tg.actual_total)) ASC NULLS LAST
      )::int AS rank
    FROM picks p
    JOIN games g ON g.id = p.game_id
    LEFT JOIN tiebreaker_guesses tg
      ON tg.user_id = p.user_id AND tg.league_id = p_league_id
         AND tg.week = v_week AND tg.actual_total IS NOT NULL
    WHERE p.league_id = p_league_id AND g.season_year = p_season_year
      AND p.week = v_week
      AND (p.is_correct IS NOT NULL OR p.points_earned IS NOT NULL)
    GROUP BY p.user_id
    ON CONFLICT (user_id, league_id, week, season_year) DO UPDATE
      SET total_points = EXCLUDED.total_points,
          correct_picks = EXCLUDED.correct_picks,
          rank = EXCLUDED.rank, updated_at = now();
  END LOOP;

  INSERT INTO standings (user_id, league_id, week, season_year, total_points, correct_picks, rank)
  SELECT user_id, p_league_id, 0, p_season_year,
    SUM(total_points), SUM(correct_picks)::int,
    RANK() OVER (ORDER BY SUM(total_points) DESC, SUM(correct_picks) DESC)::int
  FROM standings
  WHERE league_id = p_league_id AND week > 0 AND season_year = p_season_year
  GROUP BY user_id
  ON CONFLICT (user_id, league_id, week, season_year) DO UPDATE
    SET total_points = EXCLUDED.total_points, correct_picks = EXCLUDED.correct_picks,
        rank = EXCLUDED.rank, updated_at = now();

  RETURN jsonb_build_object('graded_picks', v_graded, 'weeks', to_jsonb(v_weeks));
END;
$function$;

-- ---------------------------------------------------------------------------
-- Live projection (iOS sweat view): same Pick 5 confidence payout as grading.
-- Identical to 20260818120000 except for v_p5_conf.
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
  v_p5_conf  bool;
  v_me       uuid := (select auth.uid());
  v_result   jsonb;
begin
  if not public.is_league_member(p_league_id) then
    raise exception 'not a member of this league' using errcode = '42501';
  end if;

  select scoring_type, coalesce(pick5_confidence, false)
  into v_scoring, v_p5_conf
  from leagues where id = p_league_id;
  v_is_ats   := v_scoring in ('ats_confidence', 'ats', 'pick5_ats');
  v_is_conf  := v_scoring in ('ats_confidence', 'su_confidence');
  v_is_pick5 := v_scoring in ('pick5_su', 'pick5_ats');
  v_p5_conf  := v_is_pick5 and v_p5_conf;

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
  scored as (
    select
      l.*,
      case
        when l.margin > 0 then
          case when v_is_conf or v_p5_conf then coalesce(l.confidence, 0)::numeric else 1.0 end
        when l.margin = 0 and v_p5_conf then coalesce(l.confidence, 0) * 0.5
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
