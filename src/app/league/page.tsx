import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeagueSetup } from "@/components/league/LeagueSetup";

export default async function LeaguePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return <LeagueSetup />;
}
