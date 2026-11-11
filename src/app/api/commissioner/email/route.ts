import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usersWithUnpickedGames } from "@/lib/email/league-members";
import {
  BODY_MAX,
  SENDS_PER_DAY,
  SUBJECT_MAX,
  isAudience,
  selectRecipients,
  type EmailMember,
} from "@/lib/email/audience";
import {
  cleanSubject,
  emailLinkSecret,
  fromHeader,
  renderLeagueEmail,
  sendBatch,
  unsubscribeToken,
  type OutgoingEmail,
} from "@/lib/email/league-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

// POST { leagueId, audience: "all" | "unpaid" | "unpicked", subject, body }
// Commissioner-only. Each recipient gets their own email (no shared To/CC),
// replies go to the commissioner, and every email carries a one-click
// unsubscribe for that league.
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail(401, "Unauthorized");

  const payload = await request.json().catch(() => null);
  const leagueId = typeof payload?.leagueId === "string" ? payload.leagueId : "";
  const audience = payload?.audience;
  const subject = cleanSubject(typeof payload?.subject === "string" ? payload.subject : "");
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";

  if (!leagueId || !isAudience(audience)) return fail(400, "Missing league or audience.");
  if (!subject) return fail(400, "Add a subject.");
  if (!body) return fail(400, "Write a message.");
  if (subject.length > SUBJECT_MAX) return fail(400, `Subject is over ${SUBJECT_MAX} characters.`);
  if (body.length > BODY_MAX) return fail(400, `Message is over ${BODY_MAX} characters.`);

  const { data: membership } = await supabase
    .from("league_members")
    .select("is_commissioner")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership?.is_commissioner) return fail(403, "Only the commissioner can email the league.");

  const apiKey = process.env.RESEND_API_KEY;
  const secret = emailLinkSecret();
  if (!apiKey || !secret) return fail(503, "Email isn't set up on this server yet.");

  const admin = createAdminClient();

  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { count: recentSends, error: countError } = await admin
    .from("league_emails")
    .select("id", { count: "exact", head: true })
    .eq("league_id", leagueId)
    .gte("created_at", since);
  if (countError) return fail(500, countError.message);
  if ((recentSends ?? 0) >= SENDS_PER_DAY) {
    return fail(429, `You've sent ${SENDS_PER_DAY} league emails in the last 24 hours. Try again later.`);
  }

  const [{ data: league }, { data: members, error: membersError }, { data: sender }] = await Promise.all([
    admin
      .from("leagues")
      .select("id, name, invite_code, season_year, scoring_type, pick5_lock_mode")
      .eq("id", leagueId)
      .maybeSingle(),
    admin
      .from("league_members")
      .select("id, user_id, is_paid, email_opt_out, users(display_name, email)")
      .eq("league_id", leagueId),
    admin.from("users").select("display_name, email").eq("id", user.id).maybeSingle(),
  ]);
  if (!league) return fail(404, "League not found.");
  if (membersError) return fail(500, membersError.message);

  const rows = members ?? [];
  let unpicked = new Set<string>();
  if (audience === "unpicked") {
    try {
      unpicked = await usersWithUnpickedGames(admin, league, rows.map((m) => m.user_id));
    } catch (err) {
      return fail(500, err instanceof Error ? err.message : "Couldn't load this week's picks.");
    }
  }

  const emailMembers: EmailMember[] = rows.map((m) => {
    const u = m.users as unknown as { display_name: string | null; email: string | null } | null;
    return {
      memberId: m.id,
      userId: m.user_id,
      email: u?.email ?? "",
      displayName: u?.display_name ?? u?.email?.split("@")[0] ?? "Player",
      isPaid: m.is_paid,
      emailOptOut: m.email_opt_out,
      hasUnpicked: unpicked.has(m.user_id),
    };
  });

  const { recipients, optedOut } = selectRecipients(emailMembers, audience, user.id);
  if (recipients.length === 0) {
    return fail(400, optedOut > 0
      ? "Everyone in that group has unsubscribed from league emails."
      : "Nobody in the league matches that group right now.");
  }

  const replyTo = sender?.email ?? user.email ?? undefined;
  const commishName = sender?.display_name ?? user.email?.split("@")[0] ?? "Your commissioner";
  const origin = request.nextUrl.origin;
  const code = league.invite_code;
  const cta = audience === "unpicked"
    ? { url: `${origin}/league/${code}/picks`, label: "Make your picks" }
    : { url: `${origin}/league/${code}/dashboard`, label: `Open ${league.name}` };

  const build = (m: EmailMember, copy: boolean): OutgoingEmail => {
    const unsubscribeUrl =
      `${origin}/api/email/unsubscribe?m=${encodeURIComponent(m.memberId)}&t=${unsubscribeToken(m.memberId, secret)}`;
    const { html, text } = renderLeagueEmail({
      leagueName: league.name,
      commishName,
      body,
      ctaUrl: cta.url,
      ctaLabel: cta.label,
      unsubscribeUrl,
    });
    return {
      from: fromHeader(commishName),
      to: [m.email],
      subject: copy ? `[Copy] ${subject}` : subject,
      html,
      text,
      reply_to: replyTo,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
  };

  const outgoing = recipients.map((m) => build(m, false));
  const result = await sendBatch(apiKey, outgoing);

  // The commissioner's own copy goes last so it can't eat quota meant for members.
  const senderMember = emailMembers.find((m) => m.userId === user.id);
  if (result.sent === outgoing.length && senderMember?.email) {
    await sendBatch(apiKey, [build(senderMember, true)]);
  }

  if (result.sent > 0) {
    const { error: logError } = await admin.from("league_emails").insert({
      league_id: leagueId,
      sender_id: user.id,
      audience,
      subject,
      body,
      recipient_count: result.sent,
    });
    if (logError) console.error("league_emails insert failed:", logError.message);
  }

  if (result.sent === 0) return fail(502, result.error ?? "Couldn't send the email.");

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    failed: result.failed,
    optedOut,
    error: result.error,
  });
}
