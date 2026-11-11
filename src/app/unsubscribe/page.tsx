import Link from "next/link";
import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailLinkSecret, verifyUnsubscribeToken } from "@/lib/email/league-email";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email preferences | thepickempool",
  robots: { index: false, follow: false },
};

type Search = { m?: string; t?: string; done?: string };

export default async function UnsubscribePage({ searchParams }: { searchParams: Search }) {
  const m = searchParams.m ?? "";
  const t = searchParams.t ?? "";
  const secret = emailLinkSecret();
  const valid = !!secret && verifyUnsubscribeToken(m, t, secret);

  let leagueName: string | null = null;
  let optedOut = false;
  if (valid) {
    const { data } = await createAdminClient()
      .from("league_members")
      .select("email_opt_out, leagues(name)")
      .eq("id", m)
      .maybeSingle();
    if (data) {
      leagueName = (data.leagues as unknown as { name: string } | null)?.name ?? "your league";
      optedOut = data.email_opt_out;
    }
  }

  const action = `/api/email/unsubscribe?m=${encodeURIComponent(m)}&t=${encodeURIComponent(t)}`;
  const done = searchParams.done;

  let title: string;
  let copy: string;
  let button: { a: "unsubscribe" | "resubscribe"; label: string } | null = null;

  if (!valid || !leagueName || done === "error") {
    title = "Link not valid";
    copy = "This unsubscribe link is broken or expired. Use the link from your most recent league email, or ask your commissioner.";
  } else if (optedOut) {
    title = done === "out" ? "You're unsubscribed" : "Already unsubscribed";
    copy = `You won't get emails from your commissioner in ${leagueName}. Picks, standings, and account emails like password resets aren't affected.`;
    button = { a: "resubscribe", label: "Resubscribe" };
  } else {
    title = done === "in" ? "You're back on the list" : `Unsubscribe from ${leagueName} emails?`;
    copy = done === "in"
      ? `You'll get emails from your commissioner in ${leagueName} again.`
      : `You'll stop getting emails your commissioner sends to ${leagueName}. You stay in the league, and account emails like password resets still arrive.`;
    if (done !== "in") button = { a: "unsubscribe", label: "Unsubscribe" };
  }

  return (
    <div className="legal-shell">
      <header className="legal-header">
        <Link href="/" className="legal-logo">
          <div className="app-nav-badge" style={{ fontSize: 13, padding: "4px 8px" }}>TPP</div>
          <span style={{ fontFamily: "var(--font-disp)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>thepickempool</span>
        </Link>
      </header>

      <main className="legal-body">
        <h1 className="legal-title">{title}</h1>
        <p className="legal-p">{copy}</p>
        {button && (
          <form method="post" action={action} className="unsub-form">
            <input type="hidden" name="from" value="page" />
            <input type="hidden" name="a" value={button.a} />
            <button type="submit" className={`unsub-btn${button.a === "resubscribe" ? " secondary" : ""}`}>
              {button.label}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
