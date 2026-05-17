import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NFL Pick'em Pool Formats | thepickempool",
  description: "Six NFL pick'em formats in one platform — ATS confidence, straight-up, Pick 5, and more. Find the right format for your group.",
  alternates: { canonical: "https://thepickempool.com/formats" },
};

const FORMATS = [
  {
    id: "ats_confidence",
    name: "ATS + Confidence",
    tag: "Most Popular",
    tagColor: "var(--accent)",
    headline: "The full skill game.",
    desc: "Pick every NFL game against the spread and assign a unique confidence number (1–16) to each pick. Stack high confidence on your locks, low confidence on coin flips. Points earned = confidence × correct. The best handicappers rise to the top over 18 weeks.",
    details: [
      { label: "Picks per week", value: "All 16 games" },
      { label: "Scoring", value: "Confidence 1–16 per game" },
      { label: "Spread", value: "ATS (against the spread)" },
      { label: "Lock time", value: "Each game at kickoff" },
      { label: "Max pts/week", value: "136 (1+2+…+16)" },
      { label: "Tiebreaker", value: "MNF combined score" },
    ],
    best: "Groups that know football. Separates the sharps from the squares by week 4.",
  },
  {
    id: "su_confidence",
    name: "Straight Up + Confidence",
    tag: "Casual Friendly",
    tagColor: "#6366f1",
    headline: "All the strategy, no spread knowledge needed.",
    desc: "Pick the outright winner of every game — no point spread. Assign confidence 1–16 exactly like ATS Confidence, so skill differentiation stays high. Great for groups where not everyone follows the betting market.",
    details: [
      { label: "Picks per week", value: "All 16 games" },
      { label: "Scoring", value: "Confidence 1–16 per game" },
      { label: "Spread", value: "Straight up (pick the winner)" },
      { label: "Lock time", value: "Each game at kickoff" },
      { label: "Max pts/week", value: "136 (1+2+…+16)" },
      { label: "Tiebreaker", value: "MNF combined score" },
    ],
    best: "Mixed groups — some fans, some casual. Everyone understands who wins a game.",
  },
  {
    id: "ats",
    name: "ATS Only",
    tag: "Simple",
    tagColor: "#10b981",
    headline: "One point, one game. Pick em ATS.",
    desc: "Pick every game against the spread for one point per correct pick. No confidence assignment — just pick the team. Fastest to fill out each week, but the week winner can change on any late game.",
    details: [
      { label: "Picks per week", value: "All 16 games" },
      { label: "Scoring", value: "1 pt per correct ATS pick" },
      { label: "Spread", value: "ATS (against the spread)" },
      { label: "Lock time", value: "Each game at kickoff" },
      { label: "Max pts/week", value: "16" },
      { label: "Tiebreaker", value: "MNF combined score" },
    ],
    best: "Leagues that want a quick weekly format. Less individual game weight means more weekly drama.",
  },
  {
    id: "straight_up",
    name: "Straight Up Winners",
    tag: "Easiest",
    tagColor: "#64748b",
    headline: "Pick the winner. That's it.",
    desc: "Pick the outright winner of every game, one point for each correct pick, no spread. The simplest format on the platform. Good for very casual groups or as a secondary game within a larger league.",
    details: [
      { label: "Picks per week", value: "All 16 games" },
      { label: "Scoring", value: "1 pt per correct pick" },
      { label: "Spread", value: "None — straight winner" },
      { label: "Lock time", value: "Each game at kickoff" },
      { label: "Max pts/week", value: "16" },
      { label: "Tiebreaker", value: "MNF combined score" },
    ],
    best: "Family pools, office leagues where most people don't follow spreads.",
  },
  {
    id: "pick5_ats",
    name: "Pick 5 — ATS",
    tag: "Strategic",
    tagColor: "#f97316",
    headline: "Five games. Choose wisely.",
    desc: "Pick any 5 games from the week's slate, pick them against the spread. All picks lock Friday before the Thursday night game. 1 point for a win, ½ point for a push, 0 for a loss. Game selection is its own layer of strategy — which 5 matchups do you actually have conviction on?",
    details: [
      { label: "Picks per week", value: "Any 5 of 16" },
      { label: "Scoring", value: "1pt win · ½pt push · 0pt loss" },
      { label: "Spread", value: "ATS (against the spread)" },
      { label: "Lock time", value: "Friday before TNF" },
      { label: "Max pts/week", value: "5.0" },
      { label: "Tiebreaker", value: "None needed (low ties)" },
    ],
    best: "Bettors and sharp handicappers. Forces conviction — no padding your slate with easy chalk.",
  },
  {
    id: "pick5_su",
    name: "Pick 5 — Straight Up",
    tag: "Fun",
    tagColor: "#ec4899",
    headline: "Five games, pick your spots.",
    desc: "Pick any 5 games from the week's slate, pick the outright winner of each. All picks lock Friday. 1 point for a win, ½ point for a push. Game selection and pick selection both matter — ignore the spreads entirely and bet on what you know.",
    details: [
      { label: "Picks per week", value: "Any 5 of 16" },
      { label: "Scoring", value: "1pt win · ½pt push · 0pt loss" },
      { label: "Spread", value: "None — straight winner" },
      { label: "Lock time", value: "Friday before TNF" },
      { label: "Max pts/week", value: "5.0" },
      { label: "Tiebreaker", value: "None needed (low ties)" },
    ],
    best: "Groups that want flexibility and low time commitment. Five games takes 2 minutes.",
  },
];

const COMPARISON = [
  { feature: "Spread required",    ats_confidence: "✓ ATS", su_confidence: "✗ SU", ats: "✓ ATS", straight_up: "✗ SU", pick5_ats: "✓ ATS", pick5_su: "✗ SU" },
  { feature: "Confidence scoring", ats_confidence: "✓ 1–16", su_confidence: "✓ 1–16", ats: "✗", straight_up: "✗", pick5_ats: "✗", pick5_su: "✗" },
  { feature: "Games per week",     ats_confidence: "16", su_confidence: "16", ats: "16", straight_up: "16", pick5_ats: "5 of 16", pick5_su: "5 of 16" },
  { feature: "Lock time",          ats_confidence: "Kickoff", su_confidence: "Kickoff", ats: "Kickoff", straight_up: "Kickoff", pick5_ats: "Friday", pick5_su: "Friday" },
  { feature: "Push scoring",       ats_confidence: "0 pts", su_confidence: "0 pts", ats: "0 pts", straight_up: "0 pts", pick5_ats: "½ pt", pick5_su: "½ pt" },
  { feature: "Time to pick",       ats_confidence: "~10 min", su_confidence: "~10 min", ats: "~5 min", straight_up: "~3 min", pick5_ats: "~3 min", pick5_su: "~2 min" },
  { feature: "Skill ceiling",      ats_confidence: "High", su_confidence: "High", ats: "Medium", straight_up: "Low", pick5_ats: "Very High", pick5_su: "Medium" },
];

const COLS = ["ats_confidence","su_confidence","ats","straight_up","pick5_ats","pick5_su"] as const;
const SHORT: Record<string, string> = {
  ats_confidence: "ATS+Conf", su_confidence: "SU+Conf",
  ats: "ATS", straight_up: "SU",
  pick5_ats: "P5 ATS", pick5_su: "P5 SU",
};

export default function FormatsPage() {
  return (
    <div className="fmt-shell">
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

      <div className="fmt-hero">
        <div className="fmt-hero-tag">LEAGUE FORMATS</div>
        <h1 className="fmt-hero-title">Six ways to run<br /><span className="vs-headline-accent">your pool.</span></h1>
        <p className="fmt-hero-sub">Every format runs on the same platform — same commissioner tools, same Grid, same standings. Pick the one that fits your group.</p>
      </div>

      {/* Format cards */}
      <div className="fmt-cards">
        {FORMATS.map(f => (
          <div key={f.id} className="fmt-card">
            <div className="fmt-card-top">
              <div className="fmt-card-tag" style={{ background: f.tagColor, color: f.tagColor === "var(--accent)" ? "#000" : "#fff" }}>{f.tag}</div>
              <h2 className="fmt-card-name">{f.name}</h2>
              <p className="fmt-card-headline">{f.headline}</p>
              <p className="fmt-card-desc">{f.desc}</p>
            </div>
            <div className="fmt-card-details">
              {f.details.map(d => (
                <div key={d.label} className="fmt-detail-row">
                  <span className="fmt-detail-label">{d.label}</span>
                  <span className="fmt-detail-value">{d.value}</span>
                </div>
              ))}
            </div>
            <div className="fmt-card-best">
              <span className="fmt-best-label">Best for:</span> {f.best}
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="fmt-table-section">
        <h2 className="fmt-table-title">Side-by-side comparison</h2>
        <div className="fmt-table-wrap">
          <table className="fmt-table">
            <thead>
              <tr>
                <th className="fmt-th fmt-th-feature">Feature</th>
                {COLS.map(c => (
                  <th key={c} className="fmt-th">{SHORT[c]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => (
                <tr key={i} className="fmt-tr">
                  <td className="fmt-td fmt-td-feature">{row.feature}</td>
                  {COLS.map(c => (
                    <td key={c} className={`fmt-td${(row as Record<string, string>)[c]?.startsWith("✓") ? " good" : (row as Record<string, string>)[c]?.startsWith("✗") ? " muted" : ""}`}>
                      {(row as Record<string, string>)[c]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div className="fmt-cta">
        <h2 className="fmt-cta-title">Ready to run your pool?</h2>
        <p className="fmt-cta-sub">Pick your format when you create your league. You can change it in the commissioner panel before the season starts.</p>
        <div className="vs-hero-ctas" style={{ justifyContent: "center" }}>
          <Link href="/league?action=create" className="vs-cta-primary">Create a League — Free</Link>
          <Link href="/league?action=join" className="vs-cta-secondary">Already invited? Join →</Link>
        </div>
      </div>

      <footer className="vs-footer">
        <Link href="/" className="lp-footer-legal">← Home</Link>
        <span>·</span>
        <Link href="/privacy" className="lp-footer-legal">Privacy Policy</Link>
        <span>·</span>
        <span style={{ color: "var(--ink3)", fontSize: 11, fontFamily: "var(--font-code)" }}>© {new Date().getFullYear()} thepickempool.com</span>
      </footer>
    </div>
  );
}
