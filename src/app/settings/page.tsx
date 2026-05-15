import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlayerSettings } from "@/components/settings/PlayerSettings";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("users")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  const { data: membership } = await supabase
    .from("league_members")
    .select("id, phone, venmo, is_commissioner, leagues(id, name, invite_code)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const league = membership?.leagues as unknown as { id: string; name: string; invite_code: string } | null;

  return (
    <PlayerSettings
      userId={user.id}
      email={profile?.email ?? user.email ?? ""}
      displayName={profile?.display_name ?? ""}
      phone={membership?.phone ?? ""}
      venmo={membership?.venmo ?? ""}
      memberId={membership?.id ?? null}
      leagueName={league?.name ?? null}
      leagueCode={league?.invite_code ?? null}
      isCommissioner={membership?.is_commissioner ?? false}
    />
  );
}
