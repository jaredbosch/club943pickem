import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Two separate queries — nested joins can silently return null
    const { data: memberships } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("user_id", user.id);

    const leagueIds = (memberships ?? []).map((m) => m.league_id).filter(Boolean);

    if (leagueIds.length === 0) redirect("/league");

    const { data: leagueRows } = await supabase
      .from("leagues")
      .select("invite_code")
      .in("id", leagueIds);

    const codes = (leagueRows ?? []).map((l) => l.invite_code).filter(Boolean);

    if (codes.length === 0) redirect("/league");
    if (codes.length === 1) redirect(`/league/${codes[0]}/dashboard`);
    redirect("/home");
  }

  return <LandingPage />;
}
