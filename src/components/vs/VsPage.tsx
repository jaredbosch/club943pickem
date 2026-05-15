import Link from "next/link";
import type { ReactNode } from "react";

export type PainPoint = {
  title: string;
  body: string;
  quote?: { text: string; source: string; url?: string };
  competitorScreenshot: string; // path under /vs/
  competitorAlt: string;
  tppScreenshot: string;
  tppAlt: string;
};

export type VsPageProps = {
  competitor: string;           // "Yahoo" or "CBS Sports"
  competitorFull: string;       // "Yahoo Pro Football Pick'em"
  slug: string;                 // "yahoo-pickem" | "cbs-pickem"
  heroHeadline: ReactNode;
  heroSub: string;
  painPoints: PainPoint[];
  comparisonRows: {
    feature: string;
    them: { value: string; good: boolean };
    tpp: { value: string; good: boolean };
  }[];
};

function Check() {
  return <span className="vs-check">✓</span>;
}
function X() {
  return <span className="vs-x">✗</span>;
}

function ScreenshotSlot({ src, alt, label }: { src: string; alt: string; label: string }) {
  // In production, replace with <Image> from next/image once screenshots are added
  if (!src) {
    return (
      <div className="vs-screenshot-placeholder">
        <span className="vs-screenshot-label">{label}</span>
        <span className="vs-screenshot-hint">Screenshot pending</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="vs-screenshot" loading="lazy" />
  );
}

export function VsPage({
  competitor,
  competitorFull,
  heroHeadline,
  heroSub,
  painPoints,
  comparisonRows,
}: VsPageProps) {
  return (
    <div className="vs-shell">

      {/* Nav */}
      <header className="vs-nav">
        <Link href="/" className="vs-nav-logo">
          <div className="app-nav-badge" style={{ fontSize: 12, padding: "3px 7px" }}>TPP</div>
          <span className="vs-nav-name">thepickempool</span>
        </Link>
        <div className="vs-nav-actions">
          <Link href="/league?action=join" className="vs-btn-ghost">Join a League</Link>
          <Link href="/league?action=create" className="vs-btn-primary">Create a League →</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="vs-hero">
        <div className="vs-hero-inner">
          <div className="vs-hero-tag">vs {competitorFull}</div>
          <h1 className="vs-hero-headline">{heroHeadline}</h1>
          <p className="vs-hero-sub">{heroSub}</p>
          <div className="vs-hero-ctas">
            <Link href="/league?action=create" className="vs-cta-primary">
              Start Your League — Free
            </Link>
            <Link href="/league?action=join" className="vs-cta-secondary">
              Already invited? Join →
            </Link>
          </div>
          <p className="vs-hero-fine">Free to use. No credit card required.</p>
        </div>
      </section>

      {/* Pain points */}
      <section className="vs-section">
        <div className="vs-section-inner">
          <h2 className="vs-section-title">What {competitor} Gets Wrong</h2>
          <p className="vs-section-sub">These aren&apos;t opinions. They&apos;re the reasons your league group chat complains every week.</p>

          {painPoints.map((p, i) => (
            <div key={i} className={`vs-pain-point${i % 2 === 1 ? " reversed" : ""}`}>
              <div className="vs-pain-text">
                <h3 className="vs-pain-title">{p.title}</h3>
                <p className="vs-pain-body">{p.body}</p>
                {p.quote && (
                  <blockquote className="vs-quote">
                    <p className="vs-quote-text">&ldquo;{p.quote.text}&rdquo;</p>
                    <cite className="vs-quote-source">
                      {p.quote.url
                        ? <a href={p.quote.url} target="_blank" rel="noopener noreferrer">{p.quote.source}</a>
                        : p.quote.source
                      }
                    </cite>
                  </blockquote>
                )}
              </div>
              <div className="vs-pain-screenshots">
                <div className="vs-screenshot-wrap">
                  <div className="vs-screenshot-badge them">{competitor}</div>
                  <ScreenshotSlot src={p.competitorScreenshot} alt={p.competitorAlt} label={`${competitor}: ${p.competitorAlt}`} />
                </div>
                <div className="vs-screenshot-wrap">
                  <div className="vs-screenshot-badge us">thepickempool</div>
                  <ScreenshotSlot src={p.tppScreenshot} alt={p.tppAlt} label={`TPP: ${p.tppAlt}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison table */}
      <section className="vs-table-section">
        <div className="vs-section-inner">
          <h2 className="vs-section-title">Feature Comparison</h2>
          <div className="vs-table-wrap">
            <table className="vs-table">
              <thead>
                <tr>
                  <th className="vs-th vs-th-feature">Feature</th>
                  <th className="vs-th vs-th-them">{competitor}</th>
                  <th className="vs-th vs-th-tpp">thepickempool</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className="vs-tr">
                    <td className="vs-td vs-td-feature">{row.feature}</td>
                    <td className={`vs-td vs-td-them${row.them.good ? " good" : " bad"}`}>
                      {!row.them.good && <X />} {row.them.value}
                    </td>
                    <td className={`vs-td vs-td-tpp${row.tpp.good ? " good" : " bad"}`}>
                      {row.tpp.good && <Check />} {row.tpp.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="vs-cta-section">
        <div className="vs-cta-inner">
          <h2 className="vs-cta-headline">Your League Deserves Better Than {competitor}</h2>
          <p className="vs-cta-sub">Set up your first league in under 5 minutes. Invite your crew, set your entry fee, and be ready for Week 1.</p>
          <div className="vs-hero-ctas">
            <Link href="/league?action=create" className="vs-cta-primary">
              Start Your League — Free
            </Link>
            <Link href="/league?action=join" className="vs-cta-secondary">
              Join an Existing League →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="vs-footer">
        <Link href="/" className="lp-footer-legal">← thepickempool home</Link>
        <span>·</span>
        <Link href="/privacy" className="lp-footer-legal">Privacy Policy</Link>
        <span>·</span>
        <span style={{ color: "var(--ink3)", fontSize: 11, fontFamily: "var(--font-code)" }}>
          © {new Date().getFullYear()} thepickempool.com
        </span>
      </footer>

    </div>
  );
}
