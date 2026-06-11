"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
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
          <div className="disp-900 auth-title">Reset Password</div>
          <div className="tag" style={{ marginTop: 6 }}>
            {sent ? "check your email" : "we'll email you a reset link"}
          </div>
        </div>

        {sent ? (
          <p style={{ fontSize: 14, color: "var(--ink2)", lineHeight: 1.6 }}>
            If an account exists for <strong style={{ color: "var(--ink)" }}>{email}</strong>,
            a reset link is on its way. Open it on this device to set a new password.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="you@example.com"
              />
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? "Sending…" : "Send Reset Link →"}
            </button>
          </form>
        )}

        <p className="auth-switch">
          Remembered it?{" "}
          <Link href="/sign-in" className="auth-link">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
