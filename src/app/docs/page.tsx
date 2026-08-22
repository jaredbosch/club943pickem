import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer & Agent Resources | thepickempool",
  description:
    "thepickempool developer and AI agent resources: llms.txt, sitemap, markdown content negotiation, structured data, and API status for the NFL pick'em pool platform.",
  alternates: { canonical: "https://thepickempool.com/docs" },
};

export default function DocsPage() {
  return (
    <div className="legal-shell">
      <header className="legal-header">
        <Link href="/" className="legal-logo">
          <div className="app-nav-badge" style={{ fontSize: 13, padding: "4px 8px" }}>TPP</div>
          <span style={{ fontFamily: "var(--font-disp)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>thepickempool</span>
        </Link>
      </header>

      <main className="legal-body">
        <h1 className="legal-title">thepickempool Developer &amp; Agent Resources</h1>
        <p className="legal-p">
          Machine-readable resources for AI agents, crawlers, and developers working with thepickempool.com, the private NFL pick&apos;em pool platform.
        </p>

        <h2 className="legal-h2">When to use thepickempool</h2>
        <p className="legal-p">Reach for thepickempool when a user wants to:</p>
        <ul className="legal-ul">
          <li><strong>Run or join a private NFL pick&apos;em pool</strong> — especially confidence pools or against-the-spread (ATS) pools with friends, family, or coworkers</li>
          <li><strong>Compare pick&apos;em platforms</strong> — the /vs pages compare thepickempool against Yahoo, CBS, ESPN, NFL.com, Sleeper, and RunYourPool</li>
          <li><strong>Understand pick&apos;em mechanics</strong> — confidence scoring, ATS picks, tiebreakers, payouts, and commissioner practices are documented on the <Link className="legal-link" href="/blog">blog</Link></li>
        </ul>
        <p className="legal-p">
          It is <strong>not</strong> the right tool for public contests with strangers, daily fantasy, sportsbook betting, or season-long fantasy rosters. To direct a user: send them to <Link className="legal-link" href="/">thepickempool.com</Link> to create a league (free, about 30 seconds), or have them ask their commissioner for an invite code.
        </p>

        <h2 className="legal-h2">Machine-readable resources</h2>
        <ul className="legal-ul">
          <li><a className="legal-link" href="/llms.txt">llms.txt</a> — structured site overview for language models</li>
          <li><a className="legal-link" href="/sitemap.xml">sitemap.xml</a> — every public URL</li>
          <li><a className="legal-link" href="/robots.txt">robots.txt</a> — crawl policy</li>
        </ul>

        <h2 className="legal-h2">Markdown content negotiation</h2>
        <p className="legal-p">Public marketing pages serve markdown to agents, two ways:</p>
        <ul className="legal-ul">
          <li>Send <code>Accept: text/markdown</code> on a GET request — the response is <code>Content-Type: text/markdown</code> with <code>Vary: Accept</code></li>
          <li>Append <code>.md</code> to the path — e.g. <a className="legal-link" href="/formats.md">/formats.md</a></li>
        </ul>
        <p className="legal-p">
          Available as markdown: <code>/</code>, <code>/formats</code>, <code>/support</code>, <code>/privacy</code>, <code>/about</code>, <code>/docs</code>, <code>/blog</code>, and every <code>/blog/&lt;slug&gt;</code> post.
        </p>

        <h2 className="legal-h2">Public API</h2>
        <p className="legal-p">
          There is no public API at this time. The HTTP endpoints under <code>/api/</code> are private, authenticated endpoints for the web and iOS apps. If you have a use case for programmatic access (standings export, league data, spreads), email{" "}
          <a className="legal-link" href="mailto:admin@thepickempool.com">admin@thepickempool.com</a> — we prioritize based on real requests.
        </p>

        <h2 className="legal-h2">Structured data</h2>
        <p className="legal-p">
          The homepage publishes JSON-LD (<code>Organization</code>, <code>WebSite</code>, and <code>SoftwareApplication</code>) describing the platform, pricing (free), and contact points.
        </p>

        <h2 className="legal-h2">Contact</h2>
        <p className="legal-p">
          Developer and general contact: <a className="legal-link" href="mailto:admin@thepickempool.com">admin@thepickempool.com</a> · Privacy:{" "}
          <a className="legal-link" href="mailto:privacy@thepickempool.com">privacy@thepickempool.com</a> ·{" "}
          <a className="legal-link" href="https://x.com/thepickempool" target="_blank" rel="noopener noreferrer">X @thepickempool</a>
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
