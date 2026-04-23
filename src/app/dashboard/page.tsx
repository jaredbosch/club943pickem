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
    id: string;
    name: string;
    season_year: number;
    invite_code: string;
    status: string;
  };

  // Season standings (week = 0)
  const { data: standings } = await supabase
    .from("standings")
    .select("user_id, total_points, correct_picks, rank")
    .eq("league_id", league.id)
    .eq("week", 0)
    .order("rank", { ascending: true });

  // Member profiles
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, is_paid, users(display_name, email)")
    .eq("league_id", league.id);

  const memberMap = new Map(
    (members ?? []).map((m) => {
      const u = m.users as unknown as { display_name: string | null; email: string } | null;
      return [
        m.user_id,
        {
          displayName: u?.display_name ?? u?.email?.split("@")[0] ?? "Member",
          isPaid: m.is_paid,
        },
      ];
    }),
  );

  const rows = (standings ?? []).map((s) => ({
    userId: s.user_id,
    rank: s.rank ?? 0,
    displayName: memberMap.get(s.user_id)?.displayName ?? "Member",
    isPaid: memberMap.get(s.user_id)?.isPaid ?? false,
    totalPoints: s.total_points,
    correctPicks: s.correct_picks,
    isCurrentUser: s.user_id === user.id,
  }));

  const memberRows = Array.from(memberMap.entries()).map(([userId, m], i) => ({
    userId,
    rank: i + 1,
    displayName: m.displayName,
    isPaid: m.isPaid,
    totalPoints: 0,
    correctPicks: 0,
    isCurrentUser: userId === user.id,
  }));

  const dummyRows = [
    { userId: "dummy-1", rank: 2, displayName: "Matty Ice", isPaid: true, totalPoints: 0, correctPicks: 0, isCurrentUser: false },
    { userId: "dummy-2", rank: 3, displayName: "Big Ray", isPaid: true, totalPoints: 0, correctPicks: 0, isCurrentUser: false },
    { userId: "dummy-3", rank: 4, displayName: "Kayla B", isPaid: false, totalPoints: 0, correctPicks: 0, isCurrentUser: false },
    { userId: "dummy-4", rank: 5, displayName: "T-Bone", isPaid: true, totalPoints: 0, correctPicks: 0, isCurrentUser: false },
    { userId: "dummy-5", rank: 6, displayName: "Sully", isPaid: false, totalPoints: 0, correctPicks: 0, isCurrentUser: false },
  ];

  const displayRows =
    rows.length > 0
      ? rows
      : [...memberRows, ...dummyRows].map((r, i) => ({ ...r, rank: i + 1 }));

  // League posts (pinned first, then newest)
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
      id: p.id,
      body: p.body,
      is_pinned: p.is_pinned,
      created_at: p.created_at,
      user_id: p.user_id,
      authorName: u?.display_name ?? u?.email?.split("@")[0] ?? "Member",
      isCurrentUser: p.user_id === user.id,
    };
  });

  return (
    <LeagueDashboard
      league={league}
      standings={displayRows}
      isCommissioner={membership.is_commissioner}
      currentUserId={user.id}
      initialPosts={initialPosts}
    />
  );
}
