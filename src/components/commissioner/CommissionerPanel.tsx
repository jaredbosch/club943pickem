"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type Member = {
  memberId: string;
  userId: string;
  displayName: string;
  email: string;
  phone: string;
  venmo: string;
  isPaid: boolean;
  paidAt: string | null;
  joinedAt: string;
};

type Props = {
  league: { id: string; name: string; season_year: number; entry_fee_cents: number; invite_code: string; status: string };
  members: Member[];
  currentUserId: string;
  paidCount: number;
  entryFeeDollars: string;
  totalCollectedCents: number;
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CommissionerPanel({ league, members: initialMembers, currentUserId, paidCount: initPaidCount, entryFeeDollars, totalCollectedCents: initTotal }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [editing, setEditing] = useState<Record<string, { phone: string; venmo: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const supabase = createClient();

  const paidCount = members.filter((m) => m.isPaid).length;
  const totalCollected = paidCount * parseInt(entryFeeDollars) * 100;

  async function togglePaid(memberId: string, current: boolean) {
    setSaving((s) => ({ ...s, [memberId]: true }));
    const { error } = await supabase
      .from("league_members")
      .update({ is_paid: !current, paid_at: !current ? new Date().toISOString() : null })
      .eq("id", memberId);
    if (!error) {
      setMembers((ms) => ms.map((m) => m.memberId === memberId ? { ...m, isPaid: !current, paidAt: !current ? new Date().toISOString() : null } : m));
    }
    setSaving((s) => ({ ...s, [memberId]: false }));
  }

  function startEdit(m: Member) {
    setEditing((e) => ({ ...e, [m.memberId]: { phone: m.phone, venmo: m.venmo } }));
  }

  function cancelEdit(memberId: string) {
    setEditing((e) => { const n = { ...e }; delete n[memberId]; return n; });
  }

  async function saveEdit(memberId: string) {
    const vals = editing[memberId];
    if (!vals) return;
    setSaving((s) => ({ ...s, [memberId]: true }));
    const { error } = await supabase
      .from("league_members")
      .update({ phone: vals.phone || null, venmo: vals.venmo || null })
      .eq("id", memberId);
    if (!error) {
      setMembers((ms) => ms.map((m) => m.memberId === memberId ? { ...m, phone: vals.phone, venmo: vals.venmo } : m));
      cancelEdit(memberId);
    }
    setSaving((s) => ({ ...s, [memberId]: false }));
  }

  async function copyCode() {
    await navigator.clipboard.writeText(league.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="comm-shell pp-gridbg">

      <header className="app-nav">
        <Link href="/dashboard" className="app-nav-logo">
          <div className="app-nav-badge">TPP</div>
          <span className="app-nav-name">thepickempool</span>
        </Link>
        <div style={{ width: 1, height: 24, background: "var(--line)" }} />
        <span className="pp-chip solid">{league.name}</span>
        <div style={{ flex: 1 }} />
        <Link href="/dashboard" className="ps-nav-back">← Standings</Link>
        <ThemeToggle />
      </header>

      {/* Hero */}
      <div className="comm-hero pp-hero-grad">
        <div>
          <div className="tag">COMMISSIONER · {league.season_year}</div>
          <div className="comm-hero-title">LEAGUE CONTROL</div>
          <div className="tag" style={{ marginTop: 4 }}>{league.name}</div>
        </div>
        <div className="comm-hero-kpis">
          <div className="dash-kpi">
            <div className="dash-kpi-label">Members</div>
            <div className="dash-kpi-val">{members.length}</div>
            <div className="dash-kpi-sub">in the pool</div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-label">Paid</div>
            <div className="dash-kpi-val good">{paidCount}<span style={{ fontSize: 14, color: "var(--ink3)" }}>/{members.length}</span></div>
            <div className="dash-kpi-sub">{members.length - paidCount} outstanding</div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-label">Collected</div>
            <div className="dash-kpi-val accent">${(totalCollected / 100).toFixed(0)}</div>
            <div className="dash-kpi-sub">${entryFeeDollars} entry fee</div>
          </div>
          <div className="dash-kpi">
            <div className="dash-kpi-label">Invite Code</div>
            <div className="comm-invite-row">
              <span className="comm-invite-code">{league.invite_code}</span>
              <button type="button" className="dash-invite-copy" onClick={copyCode}>{copied ? "✓" : "Copy"}</button>
            </div>
            <div className="dash-kpi-sub">share to add members</div>
          </div>
        </div>
      </div>

      {/* Member table */}
      <div className="comm-main">
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">Member Roster</div>
              <div className="dash-card-sub">click a row to edit phone &amp; venmo</div>
            </div>
            <div className="comm-legend">
              <span className="pp-chip good">● paid</span>
              <span className="pp-chip bad">● unpaid</span>
            </div>
          </div>

          <table className="comm-table">
            <thead>
              <tr>
                <th className="comm-th">#</th>
                <th className="comm-th">Player</th>
                <th className="comm-th">Email</th>
                <th className="comm-th">Phone</th>
                <th className="comm-th">Venmo</th>
                <th className="comm-th">Joined</th>
                <th className="comm-th">Paid</th>
                <th className="comm-th" />
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => {
                const isEditing = !!editing[m.memberId];
                const isSaving = !!saving[m.memberId];
                const ed = editing[m.memberId];
                return (
                  <tr key={m.memberId} className={`comm-row${m.isPaid ? " paid" : " unpaid"}${m.userId === currentUserId ? " me" : ""}`}>
                    <td className="comm-td comm-td-num">{i + 1}</td>
                    <td className="comm-td">
                      <div className="comm-player">
                        <span className="dash-avatar">{initials(m.displayName)}</span>
                        <span className="comm-player-name">
                          {m.displayName}
                          {m.userId === currentUserId && <span className="dash-you">you</span>}
                        </span>
                      </div>
                    </td>
                    <td className="comm-td comm-td-mono">{m.email}</td>
                    <td className="comm-td comm-td-mono">
                      {isEditing ? (
                        <input
                          className="comm-input"
                          value={ed.phone}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [m.memberId]: { ...ed, phone: e.target.value } }))}
                          placeholder="555-555-5555"
                          type="tel"
                        />
                      ) : (
                        <span className="comm-field" onClick={() => startEdit(m)}>{m.phone || <span className="comm-empty">—</span>}</span>
                      )}
                    </td>
                    <td className="comm-td comm-td-mono">
                      {isEditing ? (
                        <input
                          className="comm-input"
                          value={ed.venmo}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [m.memberId]: { ...ed, venmo: e.target.value } }))}
                          placeholder="@username"
                        />
                      ) : (
                        <span className="comm-field" onClick={() => startEdit(m)}>{m.venmo || <span className="comm-empty">—</span>}</span>
                      )}
                    </td>
                    <td className="comm-td comm-td-mono" style={{ color: "var(--ink3)", fontSize: 11 }}>
                      {formatDate(m.joinedAt)}
                    </td>
                    <td className="comm-td">
                      <button
                        type="button"
                        className={`comm-paid-btn${m.isPaid ? " is-paid" : ""}`}
                        onClick={() => togglePaid(m.memberId, m.isPaid)}
                        disabled={isSaving}
                        title={m.isPaid ? `Paid ${m.paidAt ? formatDate(m.paidAt) : ""}` : "Mark as paid"}
                      >
                        {isSaving ? "…" : m.isPaid ? "✓ PAID" : "UNPAID"}
                      </button>
                    </td>
                    <td className="comm-td">
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button type="button" className="comm-save-btn" onClick={() => saveEdit(m.memberId)} disabled={isSaving}>
                            {isSaving ? "…" : "Save"}
                          </button>
                          <button type="button" className="comm-cancel-btn" onClick={() => cancelEdit(m.memberId)}>✕</button>
                        </div>
                      ) : (
                        <button type="button" className="comm-edit-btn" onClick={() => startEdit(m)}>Edit</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
