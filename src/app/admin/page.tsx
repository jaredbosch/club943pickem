import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["boschtj@gmail.com", "jbosch@sunstonerea.com"];

const DAY_MS = 86_400_000;

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  if (!ADMIN_EMAILS.includes(user.email ?? "")) redirect("/dashboard");

  const admin = createAdminClient();

  const [{ data: usersPage, error: usersErr }, { data: leagues, error: leaguesErr }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin
      .from("leagues")
      .select("id, name, invite_code, status, season_year, created_at, league_members(count)")
      .order("created_at", { ascending: false }),
  ]);

  const allUsers = usersPage?.users ?? [];
  const now = Date.now();
  const newLast7 = allUsers.filter((u) => now - new Date(u.created_at).getTime() < 7 * DAY_MS).length;
  const newLast30 = allUsers.filter((u) => now - new Date(u.created_at).getTime() < 30 * DAY_MS).length;
  const unconfirmed = allUsers.filter((u) => !u.email_confirmed_at).length;

  // Signups per day, last 30 days
  const days: { key: string; label: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * DAY_MS);
    days.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" }),
      count: 0,
    });
  }
  for (const u of allUsers) {
    const key = dayKey(new Date(u.created_at));
    const slot = days.find((d) => d.key === key);
    if (slot) slot.count++;
  }
  const maxDay = Math.max(1, ...days.map((d) => d.count));

  const leagueRows = (leagues ?? []).map((l) => ({
    ...l,
    members: (l.league_members as unknown as { count: number }[])?.[0]?.count ?? 0,
  }));

  const sortedUsers = [...allUsers].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const tile: React.CSSProperties = {
    background: "var(--bg2)",
    border: "1px solid var(--line)",
    borderRadius: 2,
    padding: "14px 16px",
    flex: "1 1 140px",
    minWidth: 140,
  };
  const eyebrow: React.CSSProperties = {
    fontFamily: "var(--font-code)",
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--ink3)",
  };
  const bigNum: React.CSSProperties = {
    fontFamily: "var(--font-disp)",
    fontWeight: 900,
    fontSize: 40,
    lineHeight: 1,
    color: "var(--ink)",
    fontVariantNumeric: "tabular-nums",
  };
  const th: React.CSSProperties = {
    ...eyebrow,
    textAlign: "left",
    padding: "8px 12px",
    borderBottom: "1px solid var(--line)",
  };
  const td: React.CSSProperties = {
    padding: "10px 12px",
    borderBottom: "1px solid var(--line)",
    fontSize: 13,
    color: "var(--ink2)",
  };
  const mono: React.CSSProperties = {
    fontFamily: "var(--font-code)",
    fontVariantNumeric: "tabular-nums",
  };
  const sectionTitle: React.CSSProperties = {
    fontFamily: "var(--font-disp)",
    fontWeight: 800,
    fontSize: 22,
    textTransform: "uppercase",
    color: "var(--ink)",
    margin: "32px 0 12px",
  };

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px 64px" }}>
      <div style={eyebrow}>Back office</div>
      <h1
        style={{
          fontFamily: "var(--font-disp)",
          fontWeight: 900,
          fontSize: 40,
          lineHeight: 0.95,
          textTransform: "uppercase",
          color: "var(--ink)",
          margin: "4px 0 24px",
        }}
      >
        League Office
      </h1>

      {(usersErr || leaguesErr) && (
        <div style={{ ...tile, borderColor: "var(--loss)", color: "var(--loss)", marginBottom: 16 }}>
          {usersErr?.message ?? leaguesErr?.message}
        </div>
      )}

      {/* Stat tiles */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <div style={tile}>
          <div style={eyebrow}>Players</div>
          <div style={{ ...bigNum, color: "var(--accent-ink)", textShadow: "0 0 18px rgba(255,204,0,.35)" }}>
            {allUsers.length}
          </div>
        </div>
        <div style={tile}>
          <div style={eyebrow}>New · 7 days</div>
          <div style={bigNum}>{newLast7}</div>
        </div>
        <div style={tile}>
          <div style={eyebrow}>New · 30 days</div>
          <div style={bigNum}>{newLast30}</div>
        </div>
        <div style={tile}>
          <div style={eyebrow}>Leagues</div>
          <div style={bigNum}>{leagueRows.length}</div>
        </div>
        <div style={tile}>
          <div style={eyebrow}>Unconfirmed</div>
          <div style={{ ...bigNum, color: unconfirmed > 0 ? "var(--live)" : "var(--ink)" }}>{unconfirmed}</div>
        </div>
      </div>

      {/* Signups per day */}
      <h2 style={sectionTitle}>Signups · Last 30 Days</h2>
      <div
        style={{
          background: "var(--bg2)",
          border: "1px solid var(--line)",
          borderRadius: 2,
          padding: "16px 12px 8px",
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          height: 140,
        }}
      >
        {days.map((d) => (
          <div key={d.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 4, minWidth: 0 }}>
            <div style={{ ...mono, fontSize: 11, color: d.count > 0 ? "var(--accent-ink)" : "var(--ink3)" }}>
              {d.count > 0 ? d.count : ""}
            </div>
            <div
              style={{
                width: "100%",
                height: Math.max(2, Math.round((d.count / maxDay) * 80)),
                background: d.count > 0 ? "var(--accent)" : "var(--bg3)",
                borderRadius: 1,
              }}
            />
            <div style={{ ...mono, fontSize: 9, color: "var(--ink3)", whiteSpace: "nowrap" }}>
              {d.key === days[0].key || d.key === days[days.length - 1].key ? d.label : ""}
            </div>
          </div>
        ))}
      </div>

      {/* Leagues */}
      <h2 style={sectionTitle}>Leagues</h2>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 2, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Name</th>
              <th style={th}>Code</th>
              <th style={th}>Status</th>
              <th style={th}>Season</th>
              <th style={{ ...th, textAlign: "right" }}>Members</th>
              <th style={th}>Created</th>
            </tr>
          </thead>
          <tbody>
            {leagueRows.map((l) => (
              <tr key={l.id}>
                <td style={{ ...td, color: "var(--ink)", fontWeight: 600 }}>{l.name}</td>
                <td style={{ ...td, ...mono }}>{l.invite_code}</td>
                <td style={td}>{l.status}</td>
                <td style={{ ...td, ...mono }}>{l.season_year}</td>
                <td style={{ ...td, ...mono, textAlign: "right" }}>{l.members}</td>
                <td style={{ ...td, ...mono }}>{fmtDate(l.created_at)}</td>
              </tr>
            ))}
            {leagueRows.length === 0 && (
              <tr><td style={td} colSpan={6}>No leagues yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Players */}
      <h2 style={sectionTitle}>Players</h2>
      <div style={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 2, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>Email</th>
              <th style={th}>Signed Up</th>
              <th style={th}>Confirmed</th>
              <th style={th}>Last Sign-In</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((u) => (
              <tr key={u.id}>
                <td style={{ ...td, color: "var(--ink)" }}>{u.email}</td>
                <td style={{ ...td, ...mono }}>{fmtDate(u.created_at)}</td>
                <td style={{ ...td, ...mono, color: u.email_confirmed_at ? "var(--win)" : "var(--live)" }}>
                  {u.email_confirmed_at ? "yes" : "pending"}
                </td>
                <td style={{ ...td, ...mono }}>{fmtDate(u.last_sign_in_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
