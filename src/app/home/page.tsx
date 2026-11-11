import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/nav/AppShell";
import { AppHeader } from "@/components/nav/AppHeader";
import { AccountSection } from "@/components/me/AccountSection";
import { scoringTypeHeroLabel } from "@/lib/scoring";
import type { ScoringType } from "@/lib/scoring";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // All leagues this user belongs to. Member counts are aggregated by
  // PostgREST (`league_members(count)`) rather than by fetching every member
  // row of every league — that list is leagues × players and would hit the
  // 1000-row response cap for anyone in a handful of big leagues.
  const { data: memberships } = await supabase
    .from("league_members")
    .select("is_commissioner, is_paid, leagues(id, name, invite_code, season_year, scoring_type, status, max_players, league_members(count))")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const leagues = (memberships ?? []).map((m) => {
    const { league_members: memberAgg, ...league } = m.leagues as unknown as {
      id: string; name: string; invite_code: string;
      season_year: number; scoring_type: string; status: string; max_players: number;
      league_members: { count: number }[];
    };
    return {
      ...league,
      memberCount: memberAgg?.[0]?.count ?? 0,
      isCommissioner: m.is_commissioner,
      isPaid: m.is_paid,
    };
  });

  // If only one league, go straight there
  if (leagues.length === 1) {
    redirect(`/league/${leagues[0].invite_code}/dashboard`);
  }

  // User standings for each league
  const leagueIds = leagues.map((l) => l.id);

  const { data: standings } = await supabase
    .from("standings")
    .select("league_id, rank, total_points")
    .eq("user_id", user.id)
    .eq("week", 0)
    .in("league_id", leagueIds);

  const standingsMap = new Map<string, { rank: number | null; total_points: number }>();
  for (const s of standings ?? []) {
    standingsMap.set(s.league_id, { rank: s.rank, total_points: s.total_points });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Player";

  return (
    <AppShell leagueCode={null}>
    <div className="home-shell pp-gridbg">
      <AppHeader />

      <div className="home-hero pp-hero-grad">
        <div className="home-hero-tag">YOUR LEAGUES</div>
        <div className="home-hero-title">Welcome back, {displayName.split(" ")[0]}.</div>
        <div className="home-hero-sub">Pick a league to jump in.</div>
      </div>

      <div className="home-cards">
        {leagues.map((league) => {
          const memberCount = league.memberCount;
          const standing = standingsMap.get(league.id);
          const format = scoringTypeHeroLabel(league.scoring_type as ScoringType);

          return (
            <Link
              key={league.id}
              href={`/league/${league.invite_code}/dashboard`}
              className="home-card"
            >
              <div className="home-card-top">
                <div className="home-card-name">{league.name}</div>
                <div className="home-card-meta">
                  <span className="home-card-chip">{format}</span>
                  <span className="home-card-chip">{league.season_year}</span>
                  {league.isCommissioner && <span className="home-card-chip comm">Commissioner</span>}
                </div>
              </div>

              <div className="home-card-stats">
                {standing ? (
                  <>
                    <div className="home-card-stat">
                      <div className="home-card-stat-val">#{standing.rank}</div>
                      <div className="home-card-stat-label">Rank</div>
                    </div>
                    <div className="home-card-stat">
                      <div className="home-card-stat-val">{standing.total_points}</div>
                      <div className="home-card-stat-label">Points</div>
                    </div>
                  </>
                ) : (
                  <div className="home-card-stat">
                    <div className="home-card-stat-val" style={{ fontSize: 16, color: "var(--ink3)" }}>Season not started</div>
                  </div>
                )}
                <div className="home-card-stat">
                  <div className="home-card-stat-val">{memberCount}</div>
                  <div className="home-card-stat-label">Players</div>
                </div>
              </div>

              <div className="home-card-footer">
                Enter League →
              </div>
            </Link>
          );
        })}

        {/* Join / Create another */}
        <div className="home-card home-card-new">
          <div className="home-card-new-title">Join or create another league</div>
          <div className="home-card-new-actions">
            <Link href="/league?action=create" className="home-card-new-btn primary">Create</Link>
            <Link href="/league?action=join" className="home-card-new-btn">Join</Link>
          </div>
        </div>
      </div>

      <div className="me-main home-account">
        <AccountSection />
      </div>
    </div>
    </AppShell>
  );
}
