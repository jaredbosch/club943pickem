"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/picks";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push(next);
      router.refresh();
    } else {
      setMessage("Check your email to confirm your account.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="ps-auth-form">
      <label className="ps-auth-label">
        display name
        <input
          type="text"
          className="ps-auth-input"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
      </label>
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
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      {error && <div className="ps-auth-error">{error}</div>}
      {message && <div className="ps-auth-message">{message}</div>}
      <button type="submit" className="ps-submit-btn" disabled={loading}>
        {loading ? "creating…" : "create account"}
      </button>
      <div className="ps-auth-alt">
        already have one?{" "}
        <Link href={`/sign-in${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
          sign in
        </Link>
      </div>
    </form>
  );
}
