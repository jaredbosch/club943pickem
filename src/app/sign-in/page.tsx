import Link from "next/link";
import { signInWithPassword } from "@/app/auth/actions";

export const metadata = { title: "Sign in · Club 943" };

type Search = {
  next?: string;
  error?: string;
  message?: string;
};

export default function SignInPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const next = searchParams.next ?? "/picks";
  const error = searchParams.error;
  const showCheckEmail = searchParams.message === "check-email";

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-text mb-1">Sign in</h1>
        <p className="text-sm text-muted mb-6">Club 943 Pick&apos;em</p>

        {showCheckEmail ? (
          <p className="mb-4 rounded border border-green/40 bg-green/10 p-3 text-sm text-green">
            Check your inbox and click the confirmation link to finish signing up.
          </p>
        ) : null}

        {error ? (
          <p className="mb-4 rounded border border-orange/40 bg-orange/10 p-3 text-sm text-orange">
            {error}
          </p>
        ) : null}

        <form action={signInWithPassword} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className="w-full rounded border border-white/10 bg-bg px-3 py-2 text-text outline-none focus:border-green"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="w-full rounded border border-white/10 bg-bg px-3 py-2 text-text outline-none focus:border-green"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded bg-green py-2 font-semibold text-bg hover:brightness-110"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          No account?{" "}
          <Link href="/sign-up" className="text-green hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
