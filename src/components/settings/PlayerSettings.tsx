"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SignOutButton } from "@/components/ui/SignOutButton";

type Props = {
  userId: string;
  email: string;
  displayName: string;
  phone: string;
  venmo: string;
  memberId: string | null;
  leagueName: string | null;
  leagueCode: string | null;
  isCommissioner: boolean;
};

export function PlayerSettings({ userId, email, displayName: initName, phone: initPhone, venmo: initVenmo, memberId, leagueName, leagueCode, isCommissioner }: Props) {
  const supabase = createClient();

  const [displayName, setDisplayName] = useState(initName);
  const [phone, setPhone] = useState(initPhone);
  const [venmo, setVenmo] = useState(initVenmo);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);

    const [userRes, memberRes] = await Promise.all([
      supabase.from("users").update({ display_name: displayName || null }).eq("id", userId),
      memberId
        ? supabase.from("league_members").update({ phone: phone || null, venmo: venmo || null }).eq("id", memberId)
        : Promise.resolve({ error: null }),
    ]);

    const err = userRes.error ?? (memberRes as { error: unknown }).error;
    setSaving(false);
    setMsg(err ? { ok: false, text: String(err) } : { ok: true, text: "Settings saved." });
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="sett-shell pp-gridbg">
      <header className="app-nav">
        <Link href={leagueCode ? `/league/${leagueCode}/dashboard` : "/"} className="app-nav-logo">
          <div className="app-nav-badge">TPP</div>
          <span className="app-nav-name">thepickempool</span>
        </Link>
        <div style={{ width: 1, height: 24, background: "var(--line)" }} />
        {leagueName && <span className="pp-chip solid">{leagueName}</span>}
        <div style={{ flex: 1 }} />
        <Link href={leagueCode ? `/league/${leagueCode}/dashboard` : "/"} className="ps-nav-back">← Dashboard</Link>
        <SignOutButton />
        <ThemeToggle />
      </header>

      <div className="sett-main">
        <div className="sett-hero">
          <div className="tag">SETTINGS · SEASON 2026</div>
          <div className="sett-hero-title">YOUR SETTINGS</div>
        </div>

        <div className="dash-card sett-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">Profile</div>
              <div className="dash-card-sub">how you appear in the league</div>
            </div>
          </div>
          <div className="sett-body">
            <div className="sett-row">
              <label className="sett-label">Display Name</label>
              <input className="sett-input" value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name" />
            </div>
            <div className="sett-row">
              <label className="sett-label">Email</label>
              <span className="sett-static">{email}</span>
            </div>
          </div>
        </div>

        <div className="dash-card sett-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">League Info</div>
              <div className="dash-card-sub">visible to your commissioner</div>
            </div>
          </div>
          <div className="sett-body">
            <div className="sett-row">
              <label className="sett-label">Phone</label>
              <input className="sett-input" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-555-5555" type="tel" />
            </div>
            <div className="sett-row">
              <label className="sett-label">Venmo</label>
              <input className="sett-input" value={venmo}
                onChange={(e) => setVenmo(e.target.value)}
                placeholder="@username" />
            </div>
          </div>
        </div>

        {isCommissioner && (
          <div className="dash-card sett-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">Commissioner Tools</div>
                <div className="dash-card-sub">manage your league</div>
              </div>
            </div>
            <div className="sett-body">
              <div className="sett-row">
                <label className="sett-label">League Settings</label>
                <Link href={leagueCode ? `/league/${leagueCode}/commissioner` : "/"} className="sett-link-btn">Open Commissioner Panel →</Link>
              </div>
            </div>
          </div>
        )}

        <div className="sett-footer">
          {msg && <span className={`sett-msg${msg.ok ? " ok" : " err"}`}>{msg.text}</span>}
          <button type="button" className="comm-save-settings-btn" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
