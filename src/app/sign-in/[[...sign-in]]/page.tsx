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
    <main className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-sm space-y-6 px-4">
        <h1 className="text-2xl font-bold text-center text-text">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-border bg-card px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-border bg-card px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-green"
            />
          </div>
          {error && <p className="text-sm text-red">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-green px-4 py-2 text-sm font-semibold text-bg hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-sm text-muted">
          No account?{" "}
          <Link href="/sign-up" className="text-green hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
