import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CommissionerPanel } from "@/components/commissioner/CommissionerPanel";
import { activePickWeek, usersWithUnpickedGames } from "@/lib/email/league-members";
import { emailLinkSecret } from "@/lib/email/league-email";

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
    .select("id, name, season_year, entry_fee_cents, max_players, weekly_pool_pct, season_pool_pct, weekly_pot_type, weekly_fixed_cents, scoring_type, invite_code, status, playoffs_enabled, drop_lowest_weeks, commissioner_can_edit, registration_locked, pick5_lock_mode, pick5_confidence, push_half_points")
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

  // users.email is no longer readable by the authenticated role (email privacy
  // migration) — commissioner is verified above, so use the admin client here.
  const admin = createAdminClient();
  const [{ data: members }, { data: recentEmails }] = await Promise.all([
    admin
      .from("league_members")
      .select("id, user_id, is_paid, paid_at, joined_at, phone, venmo, email_opt_out, users(display_name, email)")
      .eq("league_id", league.id)
      .order("joined_at", { ascending: true }),
    admin
      .from("league_emails")
      .select("id, audience, subject, recipient_count, created_at")
      .eq("league_id", league.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const now = new Date();
  let unpicked = new Set<string>();
  try {
    unpicked = await usersWithUnpickedGames(admin, league, (members ?? []).map((m) => m.user_id), now);
  } catch {
    // Audience count only — the send route recomputes it.
  }

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
      emailOptOut: m.email_opt_out ?? false,
      hasUnpicked: unpicked.has(m.user_id),
    };
  });
  const commissionerEmail = rows.find((r) => r.userId === user.id)?.email || user.email || "";

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
      email={{
        enabled: !!process.env.RESEND_API_KEY && !!emailLinkSecret(),
        replyTo: commissionerEmail,
        week: activePickWeek(league.season_year, now),
        recent: (recentEmails ?? []).map((e) => ({
          id: e.id,
          audience: e.audience,
          subject: e.subject,
          recipientCount: e.recipient_count,
          createdAt: e.created_at,
        })),
      }}
    />
  );
}
