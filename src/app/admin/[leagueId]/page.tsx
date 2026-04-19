import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminMembersList } from "./AdminMembersList";

export const dynamic = "force-dynamic";

type Props = { params: { leagueId: string } };

export default async function AdminPage({ params }: Props) {
  const userId = await requireUserId(`/admin/${params.leagueId}`);
  const supabase = createAdminClient();

  const { data: league } = await supabase
    .from("leagues")
    .select(
      "id, name, invite_code, commissioner_id, entry_fee_cents, season_year",
    )
    .eq("id", params.leagueId)
    .maybeSingle();

  if (!league || league.commissioner_id !== userId) notFound();

  const { data: members } = await supabase
    .from("league_members")
    .select(
      "id, user_id, is_paid, is_commissioner, joined_at, users:user_id(display_name, email)",
    )
    .eq("league_id", league.id)
    .order("joined_at", { ascending: true });

  const paidCount = (members ?? []).filter((m) => m.is_paid).length;
  const entryFee = (league.entry_fee_cents / 100).toFixed(0);

  return (
    <div className="ps-shell">
      <div className="ps-container">
        <div className="ps-header">
          <div>
            <div className="ps-title">{league.name} · commissioner</div>
            <div className="ps-subtitle">
              invite code <strong>{league.invite_code}</strong> · entry $
              {entryFee} · season {league.season_year}
            </div>
          </div>
          <div className="ps-week-nav">
            <span className="ps-week-btn active">
              {paidCount}/{members?.length ?? 0} paid
            </span>
          </div>
        </div>

        <div className="ps-section-label">roster</div>
        <AdminMembersList
          leagueId={league.id}
          initialMembers={(members ?? []).map((m) => {
            const user = Array.isArray(m.users) ? m.users[0] : m.users;
            return {
              id: m.id,
              user_id: m.user_id,
              display_name: user?.display_name ?? null,
              email: user?.email ?? "",
              is_paid: m.is_paid,
              is_commissioner: m.is_commissioner,
            };
          })}
        />
      </div>
    </div>
  );
}
