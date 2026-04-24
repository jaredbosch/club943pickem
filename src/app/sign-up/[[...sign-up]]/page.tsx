"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setConfirm(true);
    }
  }

  if (confirm) {
    return (
      <main className="auth-shell pp-gridbg">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div className="auth-logo" style={{ justifyContent: "center" }}>
            <div className="app-nav-badge" style={{ width: 36, height: 36, fontSize: 16 }}>TPP</div>
          </div>
          <div className="disp-900 auth-title" style={{ marginTop: 16 }}>Check Your Email</div>
          <p className="tag" style={{ marginTop: 8, lineHeight: 1.6 }}>
            We sent a confirmation link to{" "}
            <span style={{ color: "var(--accent)" }}>{email}</span>.
            <br />Click it to activate your account.
          </p>
          <div style={{ marginTop: 24 }}>
            <Link href="/sign-in" className="auth-link">Back to sign in →</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell pp-gridbg">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">
          <div className="app-nav-badge" style={{ width: 36, height: 36, fontSize: 16 }}>TPP</div>
          <div>
            <div className="app-nav-name" style={{ fontSize: 18 }}>thepickempool</div>
            <div className="tag" style={{ marginTop: 2 }}>nfl confidence picks</div>
          </div>
        </div>

        <div className="auth-divider" />

        <div className="auth-title-block">
          <div className="disp-900 auth-title">Create Account</div>
          <div className="tag" style={{ marginTop: 6 }}>join your league and start picking</div>
        </div>

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
          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="min 8 characters"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Creating account…" : "Create Account →"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link href="/sign-in" className="auth-link">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
