"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinLeagueForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/leagues/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ invite_code: code }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "failed to join");
      return;
    }
    const { league_id } = (await res.json()) as { league_id: string };
    router.push(`/picks?league=${league_id}`);
  }

  return (
    <form onSubmit={onSubmit} className="ps-auth-form">
      <label className="ps-auth-label">
        invite code
        <input
          type="text"
          className="ps-auth-input"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          required
          minLength={4}
          maxLength={10}
          style={{ letterSpacing: "0.3em", textAlign: "center" }}
        />
      </label>
      {error && <div className="ps-auth-error">{error}</div>}
      <button type="submit" className="ps-submit-btn" disabled={loading}>
        {loading ? "joining…" : "join league"}
      </button>
    </form>
  );
}
