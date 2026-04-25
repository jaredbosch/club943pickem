import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeagueDashboard } from "@/components/league/LeagueDashboard";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: membership } = await supabase
    .from("league_members")
    .select("league_id, is_paid, is_commissioner, leagues(id, name, season_year, invite_code, status)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/league");

  const league = membership.leagues as unknown as {
    id: string; name: string; season_year: number; invite_code: string; status: string;
  };

  // Season standings (week=0)
  const { data: seasonStandings } = await supabase
    .from("standings")
    .select("user_id, total_points, correct_picks, rank")
    .eq("league_id", league.id)
    .eq("week", 0)
    .order("rank", { ascending: true });

  // Weekly standings for form + streak computation
  const { data: weeklyStandings } = await supabase
    .from("standings")
    .select("user_id, week, total_points, correct_picks, rank")
    .eq("league_id", league.id)
    .gt("week", 0)
    .order("week", { ascending: false });

  // Total graded picks per user (for losses column)
  const { data: gradedPicks } = await supabase
    .from("picks")
    .select("user_id, is_correct")
    .eq("league_id", league.id)
    .not("is_correct", "is", null);

  // Member profiles
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

  // Build weekly data per player
  const weeklyByPlayer = new Map<string, Array<{ week: number; rank: number | null; points: number }>>();
  for (const row of weeklyStandings ?? []) {
    if (!weeklyByPlayer.has(row.user_id)) weeklyByPlayer.set(row.user_id, []);
    weeklyByPlayer.get(row.user_id)!.push({ week: row.week, rank: row.rank, points: row.total_points });
  }

  // Total graded per player
  const gradedByUser = new Map<string, number>();
  for (const p of gradedPicks ?? []) {
    gradedByUser.set(p.user_id, (gradedByUser.get(p.user_id) ?? 0) + 1);
  }

  const totalPlayers = (members ?? []).length;
  const midpoint = Math.ceil(totalPlayers / 2);

  const rows = (seasonStandings ?? []).map((s) => {
    const weekly = (weeklyByPlayer.get(s.user_id) ?? []).sort((a, b) => b.week - a.week);

    // Form: last 5 weeks — W if rank <= top half
    const form = weekly.slice(0, 5).map((w) =>
      w.rank != null && w.rank <= midpoint ? "W" : "L"
    ) as ("W" | "L")[];

    // Streak: consecutive same result from most recent week
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
    const losses = Math.max(0, totalGraded - s.correct_picks);

    return {
      userId: s.user_id,
      rank: s.rank ?? 0,
      displayName: memberMap.get(s.user_id)?.displayName ?? "Member",
      isPaid: memberMap.get(s.user_id)?.isPaid ?? false,
      totalPoints: s.total_points,
      correctPicks: s.correct_picks,
      losses,
      form,
      streak,
      isCurrentUser: s.user_id === user.id,
    };
  });

  // League posts
  const { data: rawPosts } = await supabase
    .from("league_posts")
    .select("id, body, is_pinned, created_at, user_id, users(display_name, email)")
    .eq("league_id", league.id)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  const initialPosts = (rawPosts ?? []).map((p) => {
    const u = p.users as unknown as { display_name: string | null; email: string } | null;
    return {
      id: p.id, body: p.body, is_pinned: p.is_pinned, created_at: p.created_at,
      user_id: p.user_id,
      authorName: u?.display_name ?? u?.email?.split("@")[0] ?? "Member",
      isCurrentUser: p.user_id === user.id,
    };
  });

  return (
    <LeagueDashboard
      league={league}
      standings={rows}
      isCommissioner={membership.is_commissioner}
      currentUserId={user.id}
      initialPosts={initialPosts}
    />
  );
}
