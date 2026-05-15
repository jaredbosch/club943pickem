"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "create" | "join";

export function LeagueSetup() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("create");

  // Create form state
  const [name, setName] = useState("");
  const [seasonYear, setSeasonYear] = useState(2026);
  const [entryFeeDollars, setEntryFeeDollars] = useState(300);
  const [maxPlayers, setMaxPlayers] = useState(50);

  // Create form: scoring type
  const [scoringType, setScoringType] = useState<"ats_confidence" | "ats" | "straight_up">("ats_confidence");

  // Join form state
  const [code, setCode] = useState("");

  // Shared UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: rpcError } = await supabase.rpc("create_league", {
      _name: name,
      _season_year: seasonYear,
      _entry_fee_cents: entryFeeDollars * 100,
      _max_players: maxPlayers,
      _weekly_pool_pct: 0.36,
      _season_pool_pct: 0.64,
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    // Fetch the invite code for the newly created league
    const { data: league, error: fetchError } = await supabase
      .from("leagues")
      .select("invite_code")
      .eq("id", data)
      .single();

    if (fetchError || !league) {
      setError("League created but couldn't fetch invite code.");
      return;
    }

    // Set scoring type if non-default
    if (scoringType !== "ats_confidence") {
      await supabase.from("leagues").update({ scoring_type: scoringType }).eq("id", data);
    }

    setInviteCode(league.invite_code);
  }

  async function copyInviteCode() {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc("join_league_by_code", {
      _code: code.trim().toUpperCase(),
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message === "Invalid invite code" ? "Invalid invite code — double-check and try again." : rpcError.message);
      return;
    }

    router.push(`/league/${code.trim().toUpperCase()}/picks`);
  }

  if (inviteCode) {
    return (
      <div className="league-shell">
        <div className="league-card">
          <div className="league-success-icon">✓</div>
          <h2 className="league-title">League created!</h2>
          <p className="league-muted" style={{ marginBottom: "1.5rem" }}>
            Share this invite code with your players.
          </p>
          <div className="league-invite-code">{inviteCode}</div>
          <button type="button" className="league-btn" onClick={copyInviteCode} style={{ marginBottom: "0.75rem" }}>
            {copied ? "Copied!" : "Copy code"}
          </button>
          <button type="button" className="league-btn-secondary" onClick={() => router.push(`/league/${inviteCode}/picks`)}>
            Go to picks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="league-shell">
      <div className="league-card">
        <h1 className="league-title">Club 943 Pick&apos;em</h1>
        <p className="league-muted">Create a new league or join one with an invite code.</p>

        <div className="league-tabs">
          <button
            type="button"
            className={`league-tab${tab === "create" ? " active" : ""}`}
            onClick={() => { setTab("create"); setError(null); }}
          >
            Create
          </button>
          <button
            type="button"
            className={`league-tab${tab === "join" ? " active" : ""}`}
            onClick={() => { setTab("join"); setError(null); }}
          >
            Join
          </button>
        </div>

        {tab === "create" && (
          <form onSubmit={handleCreate} className="league-form">
            <div className="league-field">
              <label className="league-label">League name</label>
              <input
                className="league-input"
                type="text"
                required
                maxLength={60}
                placeholder="e.g. Club 943 ATS"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="league-field">
              <label className="league-label">Season year</label>
              <input
                className="league-input"
                type="number"
                required
                min={2020}
                max={2040}
                value={seasonYear}
                onChange={(e) => setSeasonYear(Number(e.target.value))}
              />
            </div>

            <div className="league-row">
              <div className="league-field">
                <label className="league-label">Entry fee ($)</label>
                <input
                  className="league-input"
                  type="number"
                  required
                  min={0}
                  step={1}
                  value={entryFeeDollars}
                  onChange={(e) => setEntryFeeDollars(Number(e.target.value))}
                />
              </div>
              <div className="league-field">
                <label className="league-label">Max players</label>
                <input
                  className="league-input"
                  type="number"
                  required
                  min={2}
                  max={500}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="league-field">
              <label className="league-label">League Type</label>
              <div className="league-type-options">
                {([
                  ["ats_confidence", "ATS + Confidence", "Pick ATS winners, assign 1–16 confidence points"],
                  ["ats", "ATS Only", "Pick ATS winners, 1 point per correct pick"],
                  ["straight_up", "Straight Up Winners", "Pick the outright winner, no spread"],
                ] as ["ats_confidence" | "ats" | "straight_up", string, string][]).map(([val, label, desc]) => (
                  <label key={val} className={`league-type-option${scoringType === val ? " selected" : ""}`}>
                    <input type="radio" name="scoringType" value={val}
                      checked={scoringType === val}
                      onChange={() => setScoringType(val)} />
                    <div>
                      <div className="league-type-label">{label}</div>
                      <div className="league-type-desc">{desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {error && <p className="league-error">{error}</p>}

            <button type="submit" className="league-btn" disabled={loading}>
              {loading ? "Creating…" : "Create league"}
            </button>
          </form>
        )}

        {tab === "join" && (
          <form onSubmit={handleJoin} className="league-form">
            <div className="league-field">
              <label className="league-label">Invite code</label>
              <input
                className="league-input league-code-input"
                type="text"
                required
                minLength={6}
                maxLength={6}
                placeholder="ABC123"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {error && <p className="league-error">{error}</p>}

            <button type="submit" className="league-btn" disabled={loading || code.length < 6}>
              {loading ? "Joining…" : "Join league"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
