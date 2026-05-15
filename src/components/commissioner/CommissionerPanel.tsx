"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SignOutButton } from "@/components/ui/SignOutButton";

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

type ScoringType = "ats_confidence" | "ats" | "straight_up";
type WeeklyPotType = "percentage" | "fixed";

type LeagueSettings = {
  name: string;
  entry_fee_cents: number;
  max_players: number;
  weekly_pool_pct: number;
  season_pool_pct: number;
  weekly_pot_type: WeeklyPotType;
  weekly_fixed_cents: number | null;
  scoring_type: ScoringType;
  playoffs_enabled: boolean;
  drop_lowest_weeks: number;
  commissioner_can_edit: boolean;
  registration_locked: boolean;
};

type Props = {
  league: { id: string; season_year: number; invite_code: string; status: string; scoring_type: ScoringType; weekly_pot_type: WeeklyPotType; weekly_fixed_cents: number | null } & LeagueSettings;
  leagueCode: string;
  members: Member[];
  currentUserId: string;
  paidCount: number;
  entryFeeDollars: string;
  totalCollectedCents: number;
};

const HELP_ITEMS = [
  {
    category: "Pool Manager",
    items: [
      {
        q: "How do I invite new players?",
        a: "Share your invite code from the Commissioner panel. Players enter it on the Join League screen. You can copy it with one click.",
      },
      {
        q: "How do I lock registration so no new players can join?",
        a: "In League Settings, toggle on Lock Registration. Once locked, the invite code stops working and no new members can join.",
      },
      {
        q: "How do I track who has paid?",
        a: "In the Member Roster, click the UNPAID badge next to any player to mark them as paid. The Collected total updates automatically.",
      },
      {
        q: "How do I change the entry fee or pot split?",
        a: "In League Settings → Money, update the entry fee and weekly/season pot percentages. Changes apply immediately but won't affect picks already submitted.",
      },
      {
        q: "Can I edit picks for a player?",
        a: "If Commissioner Can Edit Picks is enabled in League Settings, you can submit picks on behalf of a player before the game kicks off. This is useful if someone is having trouble submitting.",
      },
    ],
  },
  {
    category: "How to Play",
    items: [
      {
        q: "How do I make picks?",
        a: "Go to Make Picks. For each game, pick the winner against the spread and assign a confidence point value from 1–16. Higher confidence = more points on the line if you're right. Submit before kickoff — picks lock automatically.",
      },
      {
        q: "What does ATS mean?",
        a: "Against The Spread. Instead of just picking the winner, you pick who covers the point spread. If KC is -3.5 and you pick KC, they need to win by 4 or more for your pick to be correct.",
      },
      {
        q: "How does confidence scoring work?",
        a: "You assign each game a unique confidence value from 1–16. If you're right, you earn that many points. If you're wrong, you earn 0. Stack your highest confidence on your locks.",
      },
      {
        q: "What is the MNF tiebreaker?",
        a: "At the bottom of the pick sheet, guess the total combined score of the Monday Night Football game. Used only as a tiebreaker if two players finish tied in points at the end of the season.",
      },
      {
        q: "When do standings update?",
        a: "Standings sync every 2 minutes during live games via ESPN data. You'll see your rank shift in real time on Sundays, Mondays, and Thursdays.",
      },
      {
        q: "How are postponed or canceled games handled?",
        a: "If the NFL postpones or cancels a game, we remove it from that week's slate. Any picks already submitted for that game are voided and confidence points are returned.",
      },
      {
        q: "How are international games handled?",
        a: "London and Munich games are included in the regular weekly slate. They typically kick off early Sunday morning ET and lock at their scheduled kickoff time.",
      },
      {
        q: "There are two Monday Night Football games — which is the tiebreaker?",
        a: "The later MNF game (8:15 PM ET slot) is used as the tiebreaker. If both games are at the same time, the home team game is used.",
      },
    ],
  },
  {
    category: "Account",
    items: [
      {
        q: "How do I change my display name?",
        a: "Go to your Profile page (click your avatar or name from the dashboard). You can update your display name there.",
      },
      {
        q: "How do I reset my password?",
        a: "Go to the Sign In page and click Forgot Password. You'll receive an email with a reset link.",
      },
      {
        q: "How do I sign out?",
        a: "Click the Sign Out button in the top-right corner of any page in the app.",
      },
    ],
  },
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CommissionerPanel({ league, leagueCode, members: initialMembers, currentUserId, entryFeeDollars }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [editing, setEditing] = useState<Record<string, { phone: string; venmo: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [openHelp, setOpenHelp] = useState<string | null>(null);

  const [settings, setSettings] = useState<LeagueSettings>({
    name: league.name,
    entry_fee_cents: league.entry_fee_cents,
    max_players: league.max_players,
    weekly_pool_pct: league.weekly_pool_pct,
    season_pool_pct: league.season_pool_pct,
    weekly_pot_type: league.weekly_pot_type,
    weekly_fixed_cents: league.weekly_fixed_cents,
    scoring_type: league.scoring_type,
    playoffs_enabled: league.playoffs_enabled,
    drop_lowest_weeks: league.drop_lowest_weeks,
    commissioner_can_edit: league.commissioner_can_edit,
    registration_locked: league.registration_locked,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const supabase = createClient();
  const paidCount = members.filter((m) => m.isPaid).length;
  const totalCollected = paidCount * settings.entry_fee_cents;

  function setSetting<K extends keyof LeagueSettings>(key: K, val: LeagueSettings[K]) {
    setSettings((s) => {
      const next = { ...s, [key]: val };
      if (key === "weekly_pool_pct") next.season_pool_pct = Math.round((1 - (val as number)) * 100) / 100;
      if (key === "season_pool_pct") next.weekly_pool_pct = Math.round((1 - (val as number)) * 100) / 100;
      return next;
    });
  }

  async function saveSettings() {
    setSettingsSaving(true);
    setSettingsMsg(null);
    const { error } = await supabase
      .from("leagues")
      .update({
        name: settings.name,
        entry_fee_cents: settings.entry_fee_cents,
        max_players: settings.max_players,
        weekly_pool_pct: settings.weekly_pool_pct,
        season_pool_pct: settings.season_pool_pct,
        weekly_pot_type: settings.weekly_pot_type,
        weekly_fixed_cents: settings.weekly_pot_type === "fixed" ? settings.weekly_fixed_cents : null,
        scoring_type: settings.scoring_type,
        playoffs_enabled: settings.playoffs_enabled,
        drop_lowest_weeks: settings.drop_lowest_weeks,
        commissioner_can_edit: settings.commissioner_can_edit,
        registration_locked: settings.registration_locked,
      })
      .eq("id", league.id);
    setSettingsSaving(false);
    setSettingsMsg(error ? { ok: false, text: error.message } : { ok: true, text: "Settings saved." });
    setTimeout(() => setSettingsMsg(null), 3000);
  }

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
        <Link href={`/league/${leagueCode}/dashboard`} className="app-nav-logo">
          <div className="app-nav-badge">TPP</div>
          <span className="app-nav-name">thepickempool</span>
        </Link>
        <div style={{ width: 1, height: 24, background: "var(--line)" }} />
        <span className="pp-chip solid">{settings.name}</span>
        <div style={{ flex: 1 }} />
        <Link href={`/league/${leagueCode}/dashboard`} className="ps-nav-back">← Standings</Link>
        <SignOutButton />
        <ThemeToggle />
      </header>

      {/* Hero */}
      <div className="comm-hero pp-hero-grad">
        <div>
          <div className="tag">COMMISSIONER · {league.season_year}</div>
          <div className="comm-hero-title">LEAGUE CONTROL</div>
          <div className="tag" style={{ marginTop: 4 }}>{settings.name}</div>
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
            <div className="dash-kpi-sub">{settings.registration_locked ? "🔒 registration locked" : "share to add members"}</div>
          </div>
        </div>
      </div>

      <div className="comm-main">

        {/* Member table */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">Player Settings</div>
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
                        <input className="comm-input" value={ed.phone}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [m.memberId]: { ...ed, phone: e.target.value } }))}
                          placeholder="555-555-5555" type="tel" />
                      ) : (
                        <span className="comm-field" onClick={() => startEdit(m)}>{m.phone || <span className="comm-empty">—</span>}</span>
                      )}
                    </td>
                    <td className="comm-td comm-td-mono">
                      {isEditing ? (
                        <input className="comm-input" value={ed.venmo}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [m.memberId]: { ...ed, venmo: e.target.value } }))}
                          placeholder="@username" />
                      ) : (
                        <span className="comm-field" onClick={() => startEdit(m)}>{m.venmo || <span className="comm-empty">—</span>}</span>
                      )}
                    </td>
                    <td className="comm-td comm-td-mono" style={{ color: "var(--ink3)", fontSize: 11 }}>{formatDate(m.joinedAt)}</td>
                    <td className="comm-td">
                      <button type="button" className={`comm-paid-btn${m.isPaid ? " is-paid" : ""}`}
                        onClick={() => togglePaid(m.memberId, m.isPaid)} disabled={isSaving}
                        title={m.isPaid ? `Paid ${m.paidAt ? formatDate(m.paidAt) : ""}` : "Mark as paid"}>
                        {isSaving ? "…" : m.isPaid ? "✓ PAID" : "UNPAID"}
                      </button>
                    </td>
                    <td className="comm-td">
                      {isEditing ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button type="button" className="comm-save-btn" onClick={() => saveEdit(m.memberId)} disabled={isSaving}>{isSaving ? "…" : "Save"}</button>
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

        {/* League Settings */}
        <div className="dash-card comm-settings-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">League Settings</div>
              <div className="dash-card-sub">changes apply immediately after saving</div>
            </div>
          </div>

          <div className="comm-settings-body">

            {/* General */}
            <div className="comm-settings-group">
              <div className="comm-settings-group-label">GENERAL</div>
              <div className="comm-settings-row">
                <label className="comm-settings-label">League Name</label>
                <input className="comm-settings-input wide" value={settings.name}
                  onChange={(e) => setSetting("name", e.target.value)} placeholder="League name" />
              </div>
            </div>

            {/* League Type */}
            <div className="comm-settings-group">
              <div className="comm-settings-group-label">LEAGUE TYPE</div>
              <div className="comm-settings-row">
                <label className="comm-settings-label">Scoring Mode</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {([
                    ["ats_confidence", "ATS + Confidence", "Pick winners against the spread, assign 1–16 confidence points per game"],
                    ["ats", "ATS Only", "Pick winners against the spread, 1 point per correct pick"],
                    ["straight_up", "Straight Up Winners", "Pick the outright winner, no spread, 1 point per correct pick"],
                  ] as [ScoringType, string, string][]).map(([val, label, desc]) => (
                    <label key={val} className={`comm-type-option${settings.scoring_type === val ? " selected" : ""}`}>
                      <input type="radio" name="scoring_type" value={val}
                        checked={settings.scoring_type === val}
                        onChange={() => setSetting("scoring_type", val)} />
                      <div>
                        <div className="comm-type-option-label">{label}</div>
                        <div className="comm-type-option-desc">{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Money */}
            <div className="comm-settings-group">
              <div className="comm-settings-group-label">MONEY</div>
              <div className="comm-settings-row">
                <label className="comm-settings-label">Entry Fee</label>
                <div className="comm-settings-money">
                  <span className="comm-settings-prefix">$</span>
                  <input className="comm-settings-input narrow" type="number" min={0} step={5}
                    value={settings.entry_fee_cents / 100}
                    onChange={(e) => setSetting("entry_fee_cents", Math.round(parseFloat(e.target.value || "0") * 100))} />
                </div>
              </div>
              <div className="comm-settings-row">
                <label className="comm-settings-label">Max Players</label>
                <input className="comm-settings-input narrow" type="number" min={2} max={500}
                  value={settings.max_players}
                  onChange={(e) => setSetting("max_players", parseInt(e.target.value || "50"))} />
              </div>
              <div className="comm-settings-row">
                <label className="comm-settings-label">Weekly Pot</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      className={`comm-type-btn${settings.weekly_pot_type === "percentage" ? " active" : ""}`}
                      onClick={() => setSetting("weekly_pot_type", "percentage")}
                    >% of pot</button>
                    <button
                      type="button"
                      className={`comm-type-btn${settings.weekly_pot_type === "fixed" ? " active" : ""}`}
                      onClick={() => setSetting("weekly_pot_type", "fixed")}
                    >Fixed $</button>
                  </div>
                  {settings.weekly_pot_type === "percentage" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input className="comm-settings-input narrow" type="number" min={0} max={100} step={1}
                        value={Math.round(settings.weekly_pool_pct * 100)}
                        onChange={(e) => setSetting("weekly_pool_pct", parseInt(e.target.value || "0") / 100)} />
                      <span className="comm-settings-suffix">% weekly · {Math.round(settings.season_pool_pct * 100)}% season</span>
                    </div>
                  ) : (
                    <div className="comm-settings-money">
                      <span className="comm-settings-prefix">$</span>
                      <input className="comm-settings-input narrow" type="number" min={0} step={5}
                        value={settings.weekly_fixed_cents != null ? settings.weekly_fixed_cents / 100 : ""}
                        placeholder="e.g. 300"
                        onChange={(e) => setSetting("weekly_fixed_cents", Math.round(parseFloat(e.target.value || "0") * 100))} />
                      <span className="comm-settings-suffix">per week · remainder to season winner</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scoring */}
            <div className="comm-settings-group">
              <div className="comm-settings-group-label">SCORING</div>
              <div className="comm-settings-row">
                <label className="comm-settings-label">Drop Lowest Weeks</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button type="button" className="comm-stepper-btn"
                    onClick={() => setSetting("drop_lowest_weeks", Math.max(0, settings.drop_lowest_weeks - 1))}>−</button>
                  <span className="comm-stepper-val">{settings.drop_lowest_weeks}</span>
                  <button type="button" className="comm-stepper-btn"
                    onClick={() => setSetting("drop_lowest_weeks", Math.min(16, settings.drop_lowest_weeks + 1))}>+</button>
                  <span className="comm-settings-suffix">{settings.drop_lowest_weeks === 0 ? "off" : `drop ${settings.drop_lowest_weeks} lowest week${settings.drop_lowest_weeks > 1 ? "s" : ""}`}</span>
                </div>
              </div>
              <div className="comm-settings-row">
                <label className="comm-settings-label">Include Playoffs</label>
                <button type="button" className={`comm-toggle${settings.playoffs_enabled ? " on" : ""}`}
                  onClick={() => setSetting("playoffs_enabled", !settings.playoffs_enabled)}>
                  <span className="comm-toggle-knob" />
                  <span className="comm-toggle-label">{settings.playoffs_enabled ? "Yes — weeks 19–22" : "No — regular season only"}</span>
                </button>
              </div>
            </div>

            {/* Registration */}
            <div className="comm-settings-group">
              <div className="comm-settings-group-label">REGISTRATION</div>
              <div className="comm-settings-row">
                <label className="comm-settings-label">Lock Registration</label>
                <button type="button" className={`comm-toggle${settings.registration_locked ? " on" : ""}`}
                  onClick={() => setSetting("registration_locked", !settings.registration_locked)}>
                  <span className="comm-toggle-knob" />
                  <span className="comm-toggle-label">{settings.registration_locked ? "Locked — no new members" : "Open — invite code active"}</span>
                </button>
              </div>
            </div>

            {/* Permissions */}
            <div className="comm-settings-group">
              <div className="comm-settings-group-label">PERMISSIONS</div>
              <div className="comm-settings-row">
                <label className="comm-settings-label">Commissioner Can Edit Picks</label>
                <button type="button" className={`comm-toggle${settings.commissioner_can_edit ? " on" : ""}`}
                  onClick={() => setSetting("commissioner_can_edit", !settings.commissioner_can_edit)}>
                  <span className="comm-toggle-knob" />
                  <span className="comm-toggle-label">{settings.commissioner_can_edit ? "Allowed (pre-deadline only)" : "Not allowed"}</span>
                </button>
              </div>
            </div>

          </div>

          <div className="comm-settings-footer">
            {settingsMsg && (
              <span className={`comm-settings-msg${settingsMsg.ok ? " ok" : " err"}`}>{settingsMsg.text}</span>
            )}
            <button type="button" className="comm-save-settings-btn" onClick={saveSettings} disabled={settingsSaving}>
              {settingsSaving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </div>

        {/* Help */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <div className="dash-card-title">Help &amp; FAQ</div>
              <div className="dash-card-sub">common questions about running your pool</div>
            </div>
          </div>
          <div className="comm-help-body">
            {HELP_ITEMS.map((cat) => (
              <div key={cat.category} className="comm-help-category">
                <div className="comm-help-cat-label">{cat.category}</div>
                {cat.items.map((item) => {
                  const key = `${cat.category}:${item.q}`;
                  const isOpen = openHelp === key;
                  return (
                    <div key={key} className={`comm-help-item${isOpen ? " open" : ""}`}>
                      <button type="button" className="comm-help-q" onClick={() => setOpenHelp(isOpen ? null : key)}>
                        <span>{item.q}</span>
                        <span className="comm-help-chevron">{isOpen ? "▲" : "▼"}</span>
                      </button>
                      {isOpen && <div className="comm-help-a">{item.a}</div>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
