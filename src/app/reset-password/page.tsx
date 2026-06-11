"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  return (
    <main className="auth-shell pp-gridbg">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="app-nav-badge" style={{ width: 36, height: 36, fontSize: 16 }}>TPP</div>
          <div>
            <div className="app-nav-name" style={{ fontSize: 18 }}>thepickempool</div>
            <div className="tag" style={{ marginTop: 2 }}>nfl confidence picks</div>
          </div>
        </div>

        <div className="auth-divider" />

        <div className="auth-title-block">
          <div className="disp-900 auth-title">New Password</div>
          <div className="tag" style={{ marginTop: 6 }}>choose a new password to continue</div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Saving…" : "Set New Password →"}
          </button>
        </form>
      </div>
    </main>
  );
}
