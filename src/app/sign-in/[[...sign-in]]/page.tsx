"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
          <div className="disp-900 auth-title">Sign In</div>
          <div className="tag" style={{ marginTop: 6 }}>enter your credentials to continue</div>
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        <p className="auth-switch">
          No account?{" "}
          <Link href="/sign-up" className="auth-link">Create one</Link>
        </p>
      </div>
    </main>
  );
}
