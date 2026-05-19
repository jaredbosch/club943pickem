import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  const reportEmail = process.env.REPORT_EMAIL ?? "boschtj@gmail.com";
  if (!resendKey) return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });

  const supabase = createAdminClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Pull all stats in parallel
  const [
    { count: totalLeagues },
    { count: newLeagues },
    { count: totalPlayers },
    { count: newPlayers },
    { count: totalPicks },
    { count: newPicks },
    { data: recentLeagues },
  ] = await Promise.all([
    supabase.from("leagues").select("*", { count: "exact", head: true }),
    supabase.from("leagues").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("league_members").select("*", { count: "exact", head: true }),
    supabase.from("league_members").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("picks").select("*", { count: "exact", head: true }),
    supabase.from("picks").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
    supabase.from("leagues").select("name, created_at, scoring_type, max_players, entry_fee_cents").gte("created_at", weekAgo).order("created_at", { ascending: false }),
  ]);

  const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const leagueRows = (recentLeagues ?? []).map(l => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #333;">${l.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#9ca3af;">${l.scoring_type}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#9ca3af;">$${(l.entry_fee_cents / 100).toFixed(0)} · ${l.max_players} max</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;color:#9ca3af;">${new Date(l.created_at).toLocaleDateString()}</td>
    </tr>
  `).join("") || `<tr><td colspan="4" style="padding:12px;color:#6b7280;text-align:center;">No new leagues this week</td></tr>`;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#ffffff;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">

    <!-- Header -->
    <div style="display:flex;align-items:center;margin-bottom:32px;">
      <div style="background:#facc15;color:#000;font-weight:900;font-size:13px;padding:5px 10px;border-radius:6px;letter-spacing:0.05em;margin-right:12px;">TPP</div>
      <div style="color:#9ca3af;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">Weekly Report · ${date}</div>
    </div>

    <!-- Stat cards -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:32px;">

      <div style="background:#111827;border:1px solid #1f2937;border-radius:10px;padding:20px;">
        <div style="font-size:11px;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">New Leagues</div>
        <div style="font-size:36px;font-weight:900;color:#facc15;line-height:1;">${newLeagues ?? 0}</div>
        <div style="font-size:11px;color:#374151;margin-top:6px;">${totalLeagues ?? 0} total</div>
      </div>

      <div style="background:#111827;border:1px solid #1f2937;border-radius:10px;padding:20px;">
        <div style="font-size:11px;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">New Players</div>
        <div style="font-size:36px;font-weight:900;color:#facc15;line-height:1;">${newPlayers ?? 0}</div>
        <div style="font-size:11px;color:#374151;margin-top:6px;">${totalPlayers ?? 0} total</div>
      </div>

      <div style="background:#111827;border:1px solid #1f2937;border-radius:10px;padding:20px;">
        <div style="font-size:11px;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px;">Picks This Week</div>
        <div style="font-size:36px;font-weight:900;color:#facc15;line-height:1;">${newPicks ?? 0}</div>
        <div style="font-size:11px;color:#374151;margin-top:6px;">${totalPicks ?? 0} total</div>
      </div>

    </div>

    <!-- New leagues table -->
    <div style="background:#111827;border:1px solid #1f2937;border-radius:10px;overflow:hidden;margin-bottom:32px;">
      <div style="padding:14px 16px;border-bottom:1px solid #1f2937;">
        <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;">New Leagues This Week</span>
      </div>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#0d1117;">
            <th style="padding:8px 12px;text-align:left;font-size:10px;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Name</th>
            <th style="padding:8px 12px;text-align:left;font-size:10px;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Format</th>
            <th style="padding:8px 12px;text-align:left;font-size:10px;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Fee · Size</th>
            <th style="padding:8px 12px;text-align:left;font-size:10px;color:#6b7280;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Created</th>
          </tr>
        </thead>
        <tbody>${leagueRows}</tbody>
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align:center;color:#374151;font-size:11px;letter-spacing:0.05em;">
      thepickempool.com · Weekly digest · Every Monday
    </div>

  </div>
</body>
</html>`;

  // Send via Resend
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "thepickempool <admin@thepickempool.com>",
      to: [reportEmail],
      subject: `TPP Weekly · ${newLeagues ?? 0} new league${newLeagues !== 1 ? "s" : ""} · ${newPlayers ?? 0} new player${newPlayers !== 1 ? "s" : ""}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    stats: { newLeagues, totalLeagues, newPlayers, totalPlayers, newPicks, totalPicks },
  });
}
