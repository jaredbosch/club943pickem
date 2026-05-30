import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & Support | thepickempool",
  description: "Get help with thepickempool — commissioner setup, picking games, scoring, and more.",
  alternates: { canonical: "https://thepickempool.com/support" },
  twitter: {
    card: "summary_large_image",
    title: "Help & Support | thepickempool",
    description: "Get help with thepickempool — commissioner setup, picking games, scoring, and more.",
  },
};

const FAQS = [
  {
    category: "Getting Started",
    items: [
      {
        q: "How do I create a league?",
        a: "Go to thepickempool.com and click \"Create a League\". Set your league name, format, entry fee, and max players. You'll get a 6-character invite code to share with your group. Takes about 30 seconds.",
      },
      {
        q: "How do players join my league?",
        a: "Share your invite code. Players go to thepickempool.com, click \"Join a League\", enter the code, and create an account. They'll appear in your commissioner panel immediately.",
      },
      {
        q: "Which league format should I pick?",
        a: "ATS + Confidence is the most popular and most skill-based. If your group doesn't follow betting lines, Straight Up + Confidence is a great alternative. Pick 5 formats work well for groups that want a quick, low-commitment version. See thepickempool.com/formats for a full breakdown.",
      },
      {
        q: "Can I change the format after creating a league?",
        a: "Yes — go to the Commissioner Panel → League Settings and change the scoring format before the season starts. Don't change it mid-season as it will affect how existing picks are graded.",
      },
    ],
  },
  {
    category: "Making Picks",
    items: [
      {
        q: "When do picks lock?",
        a: "For standard formats (ATS, Straight Up, confidence), each game locks at its scheduled kickoff time. For Pick 5 formats, all picks lock Friday night before the Thursday night game. You can edit your picks any time before they lock.",
      },
      {
        q: "What is confidence scoring?",
        a: "In confidence formats, you assign a unique number from 1 to the number of games each week to each pick. Higher numbers = more confident. If you're right, you earn that many points. If you're wrong, you earn 0. Your lock gets the highest number.",
      },
      {
        q: "How does Pick 5 work?",
        a: "In Pick 5, you choose any 5 games from the week's slate — then pick a side for each. Scoring: 1 pt for a win, ½ pt for a push (spread lands exactly on the number), 0 pts for a loss. All picks lock Friday before TNF.",
      },
      {
        q: "Can I change a pick after submitting?",
        a: "Yes, as long as the game hasn't kicked off. Go back to your picks page and update before the lock time.",
      },
      {
        q: "What is the MNF tiebreaker?",
        a: "At the bottom of the picks page, you can predict the total combined score of the Monday Night Football game. This is only used as a tiebreaker if two players finish a week tied on points.",
      },
    ],
  },
  {
    category: "Scoring & Standings",
    items: [
      {
        q: "How is ATS scoring calculated?",
        a: "A team covers the spread if: the favorite wins by more than the spread, or the underdog wins outright or loses by less than the spread. Spreads come from live market data (DraftKings, FanDuel, BetMGM) and lock at kickoff.",
      },
      {
        q: "When do standings update?",
        a: "Standings sync automatically as games go final. During live games, scores are pulled every 2 minutes via ESPN data. The leaderboard rebuilds after each game completes.",
      },
      {
        q: "What happens if a game is postponed or cancelled?",
        a: "Postponed or cancelled games are removed from that week's slate. Any picks submitted for that game are voided and confidence points are returned.",
      },
    ],
  },
  {
    category: "Commissioner Tools",
    items: [
      {
        q: "How do I track who has paid?",
        a: "In the Commissioner Panel → Player Settings, click the UNPAID badge next to any player to mark them as paid. The collected total updates automatically.",
      },
      {
        q: "How do I lock registration so no new players can join?",
        a: "Commissioner Panel → League Settings → toggle on Lock Registration. Once locked, the invite code stops working.",
      },
      {
        q: "Can I remove a player from the league?",
        a: "Yes — contact us at the email below and we can remove a member. We're working on adding this directly to the commissioner panel.",
      },
    ],
  },
];

export default function SupportPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.flatMap((section) =>
      section.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      }))
    ),
  };

  return (
    <div className="legal-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <header className="legal-header">
        <Link href="/" className="legal-logo">
          <div className="app-nav-badge" style={{ fontSize: 13, padding: "4px 8px" }}>TPP</div>
          <span style={{ fontFamily: "var(--font-disp)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>thepickempool</span>
        </Link>
      </header>

      <main className="legal-body">
        <h1 className="legal-title">Help & Support</h1>
        <p className="legal-meta">Questions? We've got answers. Can't find what you need — email us directly.</p>

        {/* Contact CTA */}
        <div className="support-contact-card">
          <div className="support-contact-icon">✉</div>
          <div>
            <div className="support-contact-title">Email the developer directly</div>
            <div className="support-contact-sub">Usually responds within 24 hours. For bugs, league issues, or anything else.</div>
          </div>
          <a href="mailto:admin@thepickempool.com" className="support-contact-btn">
            admin@thepickempool.com
          </a>
        </div>

        <div className="support-contact-card" style={{ marginTop: 12 }}>
          <div className="support-contact-icon">𝕏</div>
          <div>
            <div className="support-contact-title">DM us on X</div>
            <div className="support-contact-sub">Quick questions, feedback, or just want to talk pick'em.</div>
          </div>
          <a href="https://x.com/thepickempool" target="_blank" rel="noopener noreferrer" className="support-contact-btn">
            @thepickempool
          </a>
        </div>

        {/* FAQ */}
        {FAQS.map((section) => (
          <div key={section.category}>
            <h2 className="legal-h2">{section.category}</h2>
            {section.items.map((item) => (
              <div key={item.q} className="support-faq-item">
                <h3 className="support-faq-q">{item.q}</h3>
                <p className="support-faq-a">{item.a}</p>
              </div>
            ))}
          </div>
        ))}

        <h2 className="legal-h2">Still stuck?</h2>
        <p className="legal-p">
          Email <a href="mailto:admin@thepickempool.com" className="legal-link">admin@thepickempool.com</a> or DM{" "}
          <a href="https://x.com/thepickempool" target="_blank" rel="noopener noreferrer" className="legal-link">@thepickempool on X</a>.
          We build and run this product directly — you'll hear from the person who wrote the code.
        </p>
      </main>

      <footer className="legal-footer">
        <Link href="/" className="legal-link">← thepickempool</Link>
        <span>·</span>
        <a href="https://x.com/thepickempool" target="_blank" rel="noopener noreferrer" className="legal-link">𝕏 @thepickempool</a>
        <span>·</span>
        <Link href="/privacy" className="legal-link">Privacy Policy</Link>
        <span>·</span>
        <span style={{ color: "var(--ink3)", fontSize: 11, fontFamily: "var(--font-code)" }}>© {new Date().getFullYear()} thepickempool.com</span>
      </footer>
    </div>
  );
}
