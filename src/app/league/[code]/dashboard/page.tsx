import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeagueDashboard } from "@/components/league/LeagueDashboard";
import { nflSeasonYear } from "@/lib/nfl/week";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { season?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, season_year, invite_code, status")
    .eq("invite_code", params.code.toUpperCase())
    .maybeSingle();

  if (!league) notFound();

  const { data: membership } = await supabase
    .from("league_members")
    .select("is_paid, is_commissioner")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/league");

  const { data: seasonRows } = await supabase
    .from("standings")
    .select("season_year")
    .eq("league_id", league.id)
    .eq("week", 0)
    .order("season_year", { ascending: false });

  const availableSeasons = [...new Set((seasonRows ?? []).map((r) => r.season_year))].sort((a, b) => b - a);

  const currentSeasonYear = league.season_year;
  const requestedSeason = searchParams.season ? parseInt(searchParams.season) : null;
  const viewingSeason = requestedSeason ?? currentSeasonYear;
  const isArchive = viewingSeason !== currentSeasonYear;

  const { data: seasonStandings } = await supabase
    .from("standings")
    .select("user_id, total_points, correct_picks, rank")
    .eq("league_id", league.id)
    .eq("week", 0)
    .eq("season_year", viewingSeason)
    .order("rank", { ascending: true });

  const { data: weeklyStandings } = await supabase
    .from("standings")
    .select("user_id, week, total_points, correct_picks, rank")
    .eq("league_id", league.id)
    .eq("season_year", viewingSeason)
    .gt("week", 0)
    .order("week", { ascending: false });

  const { data: pickSummary } = await supabase
    .rpc("get_league_pick_summary", { p_league_id: league.id, p_season_year: viewingSeason });

  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, is_paid, users(display_name, email)")
    .eq("league_id", league.id);

  const memberMap = new Map(
    (members ?? []).map((m) => {
      const u = m.users as unknown as { display_name: string | null; email: string } | null;
      return [m.user_id, {
        displayName: u?.display_name ?? u?.email?.split("@")[0] ?? "Member",
        isPaid: m.is_paid,
      }];
    }),
  );

  const weeklyByPlayer = new Map<string, Array<{ week: number; rank: number | null; points: number }>>();
  for (const row of weeklyStandings ?? []) {
    if (!weeklyByPlayer.has(row.user_id)) weeklyByPlayer.set(row.user_id, []);
    weeklyByPlayer.get(row.user_id)!.push({ week: row.week, rank: row.rank, points: row.total_points });
  }

  type PickSummaryRow = { user_id: string; total_graded: number; correct_count: number };
  const gradedByUser = new Map<string, number>(
    ((pickSummary ?? []) as PickSummaryRow[]).map((r) => [r.user_id, Number(r.total_graded)])
  );
  const correctByUser = new Map<string, number>(
    ((pickSummary ?? []) as PickSummaryRow[]).map((r) => [r.user_id, Number(r.correct_count)])
  );

  const allWeeks = [...new Set((weeklyStandings ?? []).map((r) => r.week))].sort((a, b) => a - b);

  type WeeklyPlayerRow = {
    userId: string;
    displayName: string;
    isCurrentUser: boolean;
    totalSeasonPts: number;
    weekPts: Record<number, number>;
    weekRank: Record<number, number>;
  };

  const weeklyPlayerRows: WeeklyPlayerRow[] = (seasonStandings ?? []).map((s) => {
    const weekly = weeklyByPlayer.get(s.user_id) ?? [];
    const weekPts: Record<number, number> = {};
    const weekRank: Record<number, number> = {};
    for (const w of weekly) {
      weekPts[w.week] = w.points;
      if (w.rank != null) weekRank[w.week] = w.rank;
    }
    return {
      userId: s.user_id,
      displayName: memberMap.get(s.user_id)?.displayName ?? "Member",
      isCurrentUser: s.user_id === user.id,
      totalSeasonPts: s.total_points,
      weekPts,
      weekRank,
    };
  });

  const totalPlayers = (members ?? []).length;
  const midpoint = Math.ceil(totalPlayers / 2);

  const rows = (seasonStandings ?? []).map((s) => {
    const weekly = (weeklyByPlayer.get(s.user_id) ?? []).sort((a, b) => b.week - a.week);
    const form = weekly.slice(0, 5).map((w) =>
      w.rank != null && w.rank <= midpoint ? "W" : "L"
    ) as ("W" | "L")[];

    let streak = 0;
    if (form.length > 0) {
      const dir = form[0];
      for (const f of form) {
        if (f === dir) streak++;
        else break;
      }
      if (dir === "L") streak = -streak;
    }

    const totalGraded = gradedByUser.get(s.user_id) ?? 0;
    const correctPicks = correctByUser.get(s.user_id) ?? 0;
    const losses = Math.max(0, totalGraded - correctPicks);

    return {
      userId: s.user_id,
      rank: s.rank ?? 0,
      displayName: memberMap.get(s.user_id)?.displayName ?? "Member",
      isPaid: memberMap.get(s.user_id)?.isPaid ?? false,
      totalPoints: s.total_points,
      correctPicks,
      losses,
      form,
      streak,
      isCurrentUser: s.user_id === user.id,
    };
  });

  const { data: rawPosts } = isArchive ? { data: [] } : await supabase
    .from("league_posts")
    .select("id, body, image_url, is_pinned, created_at, user_id, users(display_name, email)")
    .eq("league_id", league.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const postIds = (rawPosts ?? []).map((p) => p.id);
  const { data: rawComments } = postIds.length
    ? await supabase
        .from("post_comments")
        .select("id, post_id, body, image_url, created_at, user_id, users(display_name, email)")
        .in("post_id", postIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const commentsByPost = new Map<string, unknown[]>();
  for (const c of rawComments ?? []) {
    const cu = (c as { users: unknown }).users as { display_name: string | null; email: string } | null;
    const comment = {
      id: (c as { id: string }).id,
      post_id: (c as { post_id: string }).post_id,
      body: (c as { body: string | null }).body,
      image_url: (c as { image_url: string | null }).image_url,
      created_at: (c as { created_at: string }).created_at,
      user_id: (c as { user_id: string }).user_id,
      authorName: cu?.display_name ?? cu?.email?.split("@")[0] ?? "Member",
      isCurrentUser: (c as { user_id: string }).user_id === user.id,
    };
    const pid = (c as { post_id: string }).post_id;
    if (!commentsByPost.has(pid)) commentsByPost.set(pid, []);
    commentsByPost.get(pid)!.push(comment);
  }

  const initialPosts = (rawPosts ?? []).map((p) => {
    const u = p.users as unknown as { display_name: string | null; email: string } | null;
    return {
      id: p.id,
      body: p.body,
      image_url: (p as unknown as { image_url: string | null }).image_url,
      is_pinned: p.is_pinned,
      created_at: p.created_at,
      user_id: p.user_id,
      authorName: u?.display_name ?? u?.email?.split("@")[0] ?? "Member",
      isCurrentUser: p.user_id === user.id,
      comments: (commentsByPost.get(p.id) ?? []) as [],
    };
  });

  return (
    <LeagueDashboard
      league={league}
      leagueCode={params.code.toUpperCase()}
      standings={rows}
      isCommissioner={membership.is_commissioner}
      currentUserId={user.id}
      initialPosts={initialPosts}
      weeklyPlayerRows={weeklyPlayerRows}
      allWeeks={allWeeks}
      viewingSeason={viewingSeason}
      currentSeasonYear={currentSeasonYear}
      availableSeasons={availableSeasons}
      isArchive={isArchive}
    />
  );
}
