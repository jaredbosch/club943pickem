import Link from "next/link";
import { signUpWithPassword } from "@/app/auth/actions";

export const metadata = { title: "Sign up · Club 943" };

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-lg bg-card p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-text mb-1">Create account</h1>
        <p className="text-sm text-muted mb-6">Club 943 Pick&apos;em</p>

        {error ? (
          <p className="mb-4 rounded border border-orange/40 bg-orange/10 p-3 text-sm text-orange">
            {error}
          </p>
        ) : null}

        <form action={signUpWithPassword} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-muted">Display name</span>
            <input
              type="text"
              name="display_name"
              autoComplete="nickname"
              className="w-full rounded border border-white/10 bg-bg px-3 py-2 text-text outline-none focus:border-green"
            />
          </label>
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
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded border border-white/10 bg-bg px-3 py-2 text-text outline-none focus:border-green"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded bg-green py-2 font-semibold text-bg hover:brightness-110"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-green hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
