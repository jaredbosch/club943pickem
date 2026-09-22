import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeagueSetup } from "@/components/league/LeagueSetup";
import { AppShell } from "@/components/nav/AppShell";
import { AppHeader } from "@/components/nav/AppHeader";

export default async function LeaguePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // Create/join is where the league tabs land when the user has no league,
  // so it carries the same header + tabs (DESIGN.md: tabs never disappear).
  return (
    <AppShell leagueCode={null}>
      <AppHeader contextLabel="CREATE OR JOIN" />
      <LeagueSetup />
    </AppShell>
  );
}
