import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LeagueRow, LeagueMemberRow } from "@/lib/db-types";

export const dynamic = "force-dynamic";

type Membership = Pick<LeagueMemberRow, "is_commissioner" | "is_paid"> & {
  leagues: Pick<LeagueRow, "id" | "name" | "invite_code" | "season_year" | "status">;
};

export default async function LeaguesPage() {
  const userId = await requireUserId("/leagues");
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("league_members")
    .select(
      "is_commissioner, is_paid, leagues:league_id (id, name, invite_code, season_year, status)",
    )
    .eq("user_id", userId);

  const memberships = ((data ?? []) as unknown as Membership[]).filter(
    (m) => m.leagues,
  );

  return (
    <div className="ps-shell">
      <div className="ps-container">
        <div className="ps-header">
          <div>
            <div className="ps-title">your leagues</div>
            <div className="ps-subtitle">
              {memberships.length} league{memberships.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="ps-week-nav">
            <Link href="/leagues/new" className="ps-week-btn">
              create
            </Link>
            <Link href="/leagues/join" className="ps-week-btn">
              join
            </Link>
          </div>
        </div>

        {memberships.length === 0 ? (
          <div className="ps-empty">
            <p>You&apos;re not in any leagues yet.</p>
            <div className="ps-auth-alt">
              <Link href="/leagues/new">Create one</Link> or{" "}
              <Link href="/leagues/join">join with an invite code</Link>.
            </div>
          </div>
        ) : (
          <div className="ps-league-list">
            {memberships.map((m) => (
              <Link
                key={m.leagues.id}
                href={`/picks?league=${m.leagues.id}`}
                className="ps-league-card"
              >
                <div>
                  <div className="ps-league-name">{m.leagues.name}</div>
                  <div className="ps-league-meta">
                    season {m.leagues.season_year} · code {m.leagues.invite_code}
                    {m.is_commissioner && " · commissioner"}
                  </div>
                </div>
                {m.is_paid && <span className="ps-paid-badge">$ paid</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
