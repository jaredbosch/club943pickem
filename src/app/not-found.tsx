import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | thepickempool",
  description: "This page does not exist. Find your way back to thepickempool — private NFL pick'em pools with live spreads and confidence scoring.",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="legal-shell">
      <header className="legal-header">
        <Link href="/" className="legal-logo">
          <div className="app-nav-badge" style={{ fontSize: 13, padding: "4px 8px" }}>TPP</div>
          <span style={{ fontFamily: "var(--font-disp)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>thepickempool</span>
        </Link>
      </header>

      <main className="legal-body">
        <h1 className="legal-title">404 — Page Not Found</h1>
        <p className="legal-p">This page does not exist on thepickempool.com. Where to look next:</p>
        <ul className="legal-ul">
          <li><Link className="legal-link" href="/">Home</Link> — platform overview and sign-up</li>
          <li><Link className="legal-link" href="/formats">Formats</Link> — all six pick&apos;em pool formats</li>
          <li><Link className="legal-link" href="/blog">Blog</Link> — NFL pick&apos;em guides</li>
          <li><Link className="legal-link" href="/support">Help &amp; Support</Link> — FAQ and contact</li>
          <li><a className="legal-link" href="/sitemap.xml">Site map</a> — every public URL</li>
          <li><a className="legal-link" href="/llms.txt">llms.txt</a> — structured site overview for agents</li>
          <li><Link className="legal-link" href="/docs">Developer &amp; agent resources</Link></li>
        </ul>
        <p className="legal-p">Looking for your league? Sign in at <Link className="legal-link" href="/sign-in">thepickempool.com/sign-in</Link> or ask your commissioner for the invite link.</p>
      </main>

      <footer className="legal-footer">
        <Link href="/" className="legal-link">← Back to thepickempool</Link>
        <span>·</span>
        <span>© {new Date().getFullYear()} thepickempool.com</span>
      </footer>
    </div>
  );
}
