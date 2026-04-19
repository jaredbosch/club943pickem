"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewLeagueForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [entryFee, setEntryFee] = useState(300);
  const [maxPlayers, setMaxPlayers] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/leagues", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        entry_fee_cents: entryFee * 100,
        max_players: maxPlayers,
        season_year: new Date().getFullYear(),
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "failed to create league");
      return;
    }
    const league = (await res.json()) as { id: string };
    router.push(`/admin/${league.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="ps-auth-form">
      <label className="ps-auth-label">
        league name
        <input
          type="text"
          className="ps-auth-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
        />
      </label>
      <label className="ps-auth-label">
        entry fee (USD)
        <input
          type="number"
          className="ps-auth-input"
          value={entryFee}
          min={0}
          step={5}
          onChange={(e) => setEntryFee(Number(e.target.value))}
          required
        />
      </label>
      <label className="ps-auth-label">
        max players
        <input
          type="number"
          className="ps-auth-input"
          value={maxPlayers}
          min={2}
          max={200}
          onChange={(e) => setMaxPlayers(Number(e.target.value))}
          required
        />
      </label>
      {error && <div className="ps-auth-error">{error}</div>}
      <button type="submit" className="ps-submit-btn" disabled={loading}>
        {loading ? "creating…" : "create league"}
      </button>
    </form>
  );
}
