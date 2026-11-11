"use client";

import { useMemo, useState } from "react";
import {
  AUDIENCES,
  AUDIENCE_LABEL,
  BODY_MAX,
  SUBJECT_MAX,
  selectRecipients,
  type Audience,
  type EmailMember,
} from "@/lib/email/audience";

export type RecentLeagueEmail = {
  id: string;
  audience: string;
  subject: string;
  recipientCount: number;
  createdAt: string;
};

export type LeagueEmailConfig = {
  /** RESEND_API_KEY + link secret present on the server. */
  enabled: boolean;
  /** Where replies land — the commissioner's own address. */
  replyTo: string;
  /** NFL week the "haven't picked" audience is measured against. */
  week: number;
  recent: RecentLeagueEmail[];
};

type Props = {
  leagueId: string;
  currentUserId: string;
  members: EmailMember[];
  config: LeagueEmailConfig;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function LeagueEmailCard({ leagueId, currentUserId, members, config }: Props) {
  const [audience, setAudience] = useState<Audience>("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [recent, setRecent] = useState(config.recent);

  const reach = useMemo(() => {
    const out = {} as Record<Audience, { count: number; optedOut: number }>;
    for (const a of AUDIENCES) {
      const { recipients, optedOut } = selectRecipients(members, a, currentUserId);
      out[a] = { count: recipients.length, optedOut };
    }
    return out;
  }, [members, currentUserId]);

  const current = reach[audience];
  const canSend = config.enabled && !sending && current.count > 0 && subject.trim() !== "" && body.trim() !== "";
  const people = (n: number) => `${n} ${n === 1 ? "member" : "members"}`;

  async function send() {
    setSending(true);
    setMsg(null);
    try {
      const res = await fetch("/api/commissioner/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leagueId, audience, subject, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ ok: false, text: data.error ?? "Couldn't send the email." });
        return;
      }
      const partial = data.failed > 0 ? ` ${data.failed} didn't go out: ${data.error ?? "provider error"}.` : "";
      setMsg({ ok: data.failed === 0, text: `Sent to ${people(data.sent)}. A copy went to you.${partial}` });
      setRecent((r) => [
        { id: `local-${Date.now()}`, audience, subject: subject.trim(), recipientCount: data.sent, createdAt: new Date().toISOString() },
        ...r,
      ].slice(0, 5));
      setSubject("");
      setBody("");
    } catch {
      setMsg({ ok: false, text: "Network error. Nothing was sent." });
    } finally {
      setSending(false);
      setConfirming(false);
    }
  }

  return (
    <div className="dash-card comm-email-card">
      <div className="dash-card-header">
        <div>
          <div className="dash-card-title">Email the League</div>
          <div className="dash-card-sub">
            {config.replyTo ? <>replies go straight to {config.replyTo}</> : "replies go straight to you"}
          </div>
        </div>
      </div>

      <div className="comm-email-body">
        <div className="comm-email-field">
          <div className="comm-email-eyebrow" id="comm-email-to">To</div>
          <div className="comm-email-audiences" role="radiogroup" aria-labelledby="comm-email-to">
            {AUDIENCES.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={audience === a}
                className={`comm-email-aud${audience === a ? " active" : ""}`}
                onClick={() => { setAudience(a); setConfirming(false); }}
              >
                <span>{AUDIENCE_LABEL[a]}{a === "unpicked" ? ` · Wk ${config.week}` : ""}</span>
                <span className="comm-email-aud-count">{reach[a].count}</span>
              </button>
            ))}
          </div>
          {current.optedOut > 0 && (
            <div className="comm-email-note">
              {people(current.optedOut)} in this group unsubscribed from league emails and won&apos;t get it.
            </div>
          )}
          {current.count === 0 && current.optedOut === 0 && (
            <div className="comm-email-note">
              {audience === "unpaid" ? "Everyone's paid up." : audience === "unpicked" ? "Everyone's in for this week." : "No other members yet."}
            </div>
          )}
        </div>

        <div className="comm-email-field">
          <label className="comm-email-eyebrow" htmlFor="comm-email-subject">Subject</label>
          <input
            id="comm-email-subject"
            className="comm-email-input"
            value={subject}
            maxLength={SUBJECT_MAX}
            onChange={(e) => { setSubject(e.target.value); setConfirming(false); }}
            placeholder={audience === "unpaid" ? "Entry fees due before Week 1" : audience === "unpicked" ? "Picks lock Thursday night" : "League update"}
          />
        </div>

        <div className="comm-email-field">
          <div className="comm-email-label-row">
            <label className="comm-email-eyebrow" htmlFor="comm-email-body">Message</label>
            <span className="comm-email-count">{body.length}/{BODY_MAX}</span>
          </div>
          <textarea
            id="comm-email-body"
            className="comm-email-input comm-email-textarea"
            value={body}
            maxLength={BODY_MAX}
            rows={6}
            onChange={(e) => { setBody(e.target.value); setConfirming(false); }}
            placeholder="Write it like a group text. Each person gets their own copy, so nobody sees anyone else's address."
          />
        </div>
      </div>

      <div className="comm-settings-footer comm-email-footer">
        {msg && <span className={`comm-settings-msg${msg.ok ? " ok" : " err"}`} role="status">{msg.text}</span>}
        {!config.enabled && <span className="comm-email-note">Email isn&apos;t set up on this server yet.</span>}
        {confirming ? (
          <div className="comm-email-confirm">
            <span className="comm-email-confirm-text">Send to {people(current.count)}?</span>
            <button type="button" className="comm-email-send" onClick={send} disabled={!canSend}>
              {sending ? "Sending…" : "Yes, send"}
            </button>
            <button type="button" className="comm-email-cancel" onClick={() => setConfirming(false)} disabled={sending}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className="comm-email-send" onClick={() => setConfirming(true)} disabled={!canSend}>
            Send to {people(current.count)}
          </button>
        )}
      </div>

      {recent.length > 0 && (
        <div className="comm-email-recent">
          <div className="comm-email-eyebrow">Recent</div>
          <ul className="comm-email-recent-list">
            {recent.map((e) => (
              <li key={e.id} className="comm-email-recent-row">
                <span className="comm-email-recent-when">{formatWhen(e.createdAt)}</span>
                <span className="comm-email-recent-subject">{e.subject}</span>
                <span className="comm-email-recent-meta">
                  {AUDIENCE_LABEL[e.audience as Audience] ?? e.audience} · <span className="comm-email-recent-num">{e.recipientCount}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
