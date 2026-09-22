import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerSettings } from "@/components/settings/PlayerSettings";
import { AppShell } from "@/components/nav/AppShell";
import { getNavData } from "@/lib/nav-data";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // League-scoped fields (phone, venmo) edit the membership of the league the
  // nav points at — the user's last-active league.
  const nav = await getNavData(null);
  const current = nav?.current ?? null;

  const { data: profile } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const { data: league } = current
    ? await supabase.from("leagues").select("id").eq("invite_code", current.code).maybeSingle()
    : { data: null };

  const { data: membership } = league
    ? await supabase
        .from("league_members")
        .select("id, phone, venmo, is_commissioner")
        .eq("user_id", user.id)
        .eq("league_id", league.id)
        .maybeSingle()
    : { data: null };

  return (
    <AppShell leagueCode={null}>
      <PlayerSettings
        userId={user.id}
        email={user.email ?? ""}
        displayName={profile?.display_name ?? ""}
        phone={membership?.phone ?? ""}
        venmo={membership?.venmo ?? ""}
        memberId={membership?.id ?? null}
        leagueName={current?.name ?? null}
        leagueCode={current?.code ?? null}
        isCommissioner={membership?.is_commissioner ?? false}
      />
    </AppShell>
  );
}
