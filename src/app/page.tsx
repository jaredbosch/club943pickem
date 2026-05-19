import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: memberships } = await supabase
      .from("league_members")
      .select("leagues(invite_code)")
      .eq("user_id", user.id);

    const leagues = (memberships ?? [])
      .map((m) => (m.leagues as unknown as { invite_code: string } | null)?.invite_code)
      .filter(Boolean) as string[];

    if (leagues.length === 0) redirect("/league");
    if (leagues.length === 1) redirect(`/league/${leagues[0]}/dashboard`);
    redirect("/home"); // 2+ leagues → picker
  }

  return <LandingPage />;
}
