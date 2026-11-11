// Commissioner → league email, server half: rendering, unsubscribe tokens,
// and the Resend batch send (node:crypto + API key — never import from a
// client component; audience logic lives in ./audience).

import { createHmac, timingSafeEqual } from "node:crypto";

/** Resend's batch endpoint takes at most 100 emails per call. */
const RESEND_BATCH_MAX = 100;

// ── Unsubscribe tokens ───────────────────────────────────────────────────────

/** HMAC over the league_members.id — one token per member per league. */
export function unsubscribeToken(memberId: string, secret: string): string {
  return createHmac("sha256", secret).update(`league-email-unsubscribe:v1:${memberId}`).digest("hex").slice(0, 40);
}

export function verifyUnsubscribeToken(memberId: string, token: string, secret: string): boolean {
  if (!memberId || !token || !secret) return false;
  const expected = Buffer.from(unsubscribeToken(memberId, secret));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** UNSUBSCRIBE_SECRET, falling back to CRON_SECRET so existing deploys work. */
export function emailLinkSecret(): string | null {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || null;
}

// ── Rendering ────────────────────────────────────────────────────────────────

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Safe inside a quoted RFC 5322 display name: no quotes, brackets, or line breaks. */
export function headerSafeName(s: string, fallback: string): string {
  const clean = s.replace(/[\r\n"<>\\]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
  return clean || fallback;
}

/** Subject lines must be a single line. */
export function cleanSubject(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim();
}

export function fromHeader(commishName: string): string {
  const address = process.env.EMAIL_FROM_ADDRESS || "admin@thepickempool.com";
  return `"${headerSafeName(commishName, "Your commissioner")} via thepickempool" <${address}>`;
}

export function renderLeagueEmail(args: {
  leagueName: string;
  commishName: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
  unsubscribeUrl: string;
}): { html: string; text: string } {
  const { leagueName, commishName, body, ctaUrl, ctaLabel, unsubscribeUrl } = args;
  const league = escapeHtml(leagueName);
  const commish = escapeHtml(commishName);
  const bodyHtml = escapeHtml(body).replace(/\r?\n/g, "<br>");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#f5f5f7;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr>
      <td style="background:#ffcc00;color:#000;font-weight:900;font-size:13px;padding:5px 10px;border-radius:2px;letter-spacing:0.05em;">TPP</td>
      <td style="padding-left:12px;color:#a8a8b3;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;">${league}</td>
    </tr></table>
    <div style="background:#131317;border:1px solid #2a2a33;border-left:3px solid #ffcc00;border-radius:2px;padding:20px;">
      <div style="color:#a8a8b3;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:12px;">From your commissioner, ${commish}</div>
      <div style="font-size:15px;line-height:1.55;color:#f5f5f7;">${bodyHtml}</div>
    </div>
    <div style="margin:24px 0;">
      <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#ffcc00;color:#000;font-weight:800;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;text-decoration:none;padding:12px 20px;border-radius:2px;">${escapeHtml(ctaLabel)}</a>
    </div>
    <div style="color:#a8a8b3;font-size:12px;line-height:1.6;">
      You're getting this because you're in <strong style="color:#f5f5f7;">${league}</strong> on thepickempool.
      Reply to this email to reach ${commish} directly.<br>
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#a8a8b3;">Unsubscribe from ${league} emails</a>
    </div>
  </div>
</body>
</html>`;

  const text = [
    `${leagueName} · from your commissioner, ${commishName}`,
    "",
    body,
    "",
    `${ctaLabel}: ${ctaUrl}`,
    "",
    `You're getting this because you're in ${leagueName} on thepickempool. Reply to reach ${commishName} directly.`,
    `Unsubscribe from ${leagueName} emails: ${unsubscribeUrl}`,
  ].join("\n");

  return { html, text };
}

// ── Sending ──────────────────────────────────────────────────────────────────

export type OutgoingEmail = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
  headers?: Record<string, string>;
};

export type BatchResult = { sent: number; failed: number; error: string | null };

function friendlyResendError(status: number, message: string): string {
  if (status === 429) return "Email limit reached for today. Try again tomorrow.";
  if (status === 401 || status === 403) return "Email isn't configured correctly on the server.";
  return message || `Email provider error (${status}).`;
}

/** Sends via Resend's batch endpoint, 100 per call. Stops at the first failed chunk. */
export async function sendBatch(apiKey: string, emails: OutgoingEmail[]): Promise<BatchResult> {
  let sent = 0;
  for (let i = 0; i < emails.length; i += RESEND_BATCH_MAX) {
    const chunk = emails.slice(i, i + RESEND_BATCH_MAX);
    let res: Response;
    try {
      res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(chunk),
      });
    } catch (err) {
      return { sent, failed: emails.length - sent, error: err instanceof Error ? err.message : String(err) };
    }
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { message?: string } | null;
      return { sent, failed: emails.length - sent, error: friendlyResendError(res.status, payload?.message ?? "") };
    }
    sent += chunk.length;
  }
  return { sent, failed: 0, error: null };
}
