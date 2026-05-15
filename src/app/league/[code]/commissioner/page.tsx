import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommissionerPanel } from "@/components/commissioner/CommissionerPanel";

export default async function CommissionerPage({
  params,
}: {
  params: { code: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: league } = await supabase
    .from("leagues")
    .select("id, name, season_year, entry_fee_cents, max_players, weekly_pool_pct, season_pool_pct, invite_code, status, playoffs_enabled, drop_lowest_weeks, commissioner_can_edit, registration_locked")
    .eq("invite_code", params.code.toUpperCase())
    .maybeSingle();

  if (!league) notFound();

  const { data: membership } = await supabase
    .from("league_members")
    .select("is_commissioner")
    .eq("league_id", league.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) redirect("/league");
  if (!membership.is_commissioner) redirect(`/league/${params.code}/dashboard`);

  const { data: members } = await supabase
    .from("league_members")
    .select("id, user_id, is_paid, paid_at, joined_at, phone, venmo, users(display_name, email)")
    .eq("league_id", league.id)
    .order("joined_at", { ascending: true });

  const rows = (members ?? []).map((m) => {
    const u = m.users as unknown as { display_name: string | null; email: string } | null;
    return {
      memberId: m.id,
      userId: m.user_id,
      displayName: u?.display_name ?? u?.email?.split("@")[0] ?? "Player",
      email: u?.email ?? "",
      phone: m.phone ?? "",
      venmo: m.venmo ?? "",
      isPaid: m.is_paid,
      paidAt: m.paid_at,
      joinedAt: m.joined_at,
    };
  });

  const paidCount = rows.filter((r) => r.isPaid).length;
  const entryFeeDollars = (league.entry_fee_cents / 100).toFixed(0);
  const totalCollected = paidCount * league.entry_fee_cents;

  return (
    <CommissionerPanel
      league={league}
      leagueCode={params.code.toUpperCase()}
      members={rows}
      currentUserId={user.id}
      paidCount={paidCount}
      entryFeeDollars={entryFeeDollars}
      totalCollectedCents={totalCollected}
    />
  );
}
