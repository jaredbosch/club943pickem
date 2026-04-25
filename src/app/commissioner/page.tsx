import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CommissionerPanel } from "@/components/commissioner/CommissionerPanel";

export default async function CommissionerPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: membership } = await supabase
    .from("league_members")
    .select("league_id, is_commissioner, leagues(id, name, season_year, entry_fee_cents, invite_code, status)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/league");
  if (!membership.is_commissioner) redirect("/dashboard");

  const league = membership.leagues as unknown as {
    id: string; name: string; season_year: number;
    entry_fee_cents: number; invite_code: string; status: string;
  };

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
      members={rows}
      currentUserId={user.id}
      paidCount={paidCount}
      entryFeeDollars={entryFeeDollars}
      totalCollectedCents={totalCollected}
    />
  );
}
