import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | thepickempool",
  description:
    "thepickempool is an independent, free platform for private NFL pick'em pools with confidence scoring, live ATS spreads, and real commissioner tools.",
  alternates: { canonical: "https://thepickempool.com/about" },
};

export default function AboutPage() {
  return (
    <div className="legal-shell">
      <header className="legal-header">
        <Link href="/" className="legal-logo">
          <div className="app-nav-badge" style={{ fontSize: 13, padding: "4px 8px" }}>TPP</div>
          <span style={{ fontFamily: "var(--font-disp)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>thepickempool</span>
        </Link>
      </header>

      <main className="legal-body">
        <h1 className="legal-title">About thepickempool</h1>
        <p className="legal-p">
          thepickempool.com is an independent, free platform for running private NFL pick&apos;em pools with confidence scoring and live against-the-spread lines.
        </p>

        <h2 className="legal-h2">Why it exists</h2>
        <p className="legal-p">
          thepickempool grew out of a single long-running family-and-friends confidence pool that had outgrown spreadsheets and the big-portal pick&apos;em products. The public platforms froze spreads on Tuesday or Thursday, locked every pick before the first kickoff, buried the pool under ads, and gave commissioners no real tools for tracking entries and payouts. So we built the pool platform we wanted to play in — and opened it up for everyone.
        </p>

        <h2 className="legal-h2">What we care about</h2>
        <ul className="legal-ul">
          <li><strong>Live, honest lines.</strong> Spreads come from real sportsbook markets (DraftKings, FanDuel, BetMGM) and update until each game&apos;s own kickoff.</li>
          <li><strong>The sweat.</strong> The Grid shows every player&apos;s picks and confidence numbers side by side in real time, so the whole league watches the same board.</li>
          <li><strong>Commissioners are people too.</strong> Payment tracking, member management, and registration control are built in — no side spreadsheet required.</li>
          <li><strong>Free means free.</strong> No entry fee to the platform, no ads inside the app, no upsells on your league.</li>
        </ul>

        <p className="legal-p">
          thepickempool is operated from the United States and is not a gambling operator: it does not accept wagers, hold entry fees, or pay out prizes. Leagues handle their own stakes privately; the platform only keeps score.
        </p>

        <h2 className="legal-h2">Contact</h2>
        <p className="legal-p">
          Email <a className="legal-link" href="mailto:admin@thepickempool.com">admin@thepickempool.com</a>, privacy questions to{" "}
          <a className="legal-link" href="mailto:privacy@thepickempool.com">privacy@thepickempool.com</a>, or find us on{" "}
          <a className="legal-link" href="https://x.com/thepickempool" target="_blank" rel="noopener noreferrer">X @thepickempool</a>.
        </p>
      </main>

      <footer className="legal-footer">
        <Link href="/" className="legal-link">← Back to thepickempool</Link>
        <span>·</span>
        <span>© {new Date().getFullYear()} thepickempool.com</span>
      </footer>
    </div>
  );
}
