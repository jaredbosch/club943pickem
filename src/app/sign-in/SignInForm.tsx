"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/picks";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="ps-auth-form">
      <label className="ps-auth-label">
        email
        <input
          type="email"
          className="ps-auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>
      <label className="ps-auth-label">
        password
        <input
          type="password"
          className="ps-auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </label>
      {error && <div className="ps-auth-error">{error}</div>}
      <button type="submit" className="ps-submit-btn" disabled={loading}>
        {loading ? "signing in…" : "sign in"}
      </button>
      <div className="ps-auth-alt">
        new here?{" "}
        <Link href={`/sign-up${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
          create an account
        </Link>
      </div>
    </form>
  );
}
