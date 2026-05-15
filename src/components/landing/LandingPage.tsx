"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const MOCK_GAMES = [
  { away: "BUF", home: "KC",  spread: "-3.5", conf: 16, pick: "KC",  result: "correct" },
  { away: "SF",  home: "DAL", spread: "+2",   conf: 14, pick: "SF",  result: "correct" },
  { away: "PHI", home: "NYG", spread: "-7",   conf: 11, pick: "PHI", result: null },
  { away: "LAR", home: "SEA", spread: "-4.5", conf: 8,  pick: "LAR", result: "wrong" },
  { away: "MIA", home: "NE",  spread: "+3",   conf: 5,  pick: "MIA", result: null },
];

const MOCK_PLAYERS = [
  { name: "Jerry Jones",  handle: "@jjones",  initials: "JJ", pts: 142, form: ["w","w","w","l","w"] },
  { name: "Brady Gisele", handle: "@brady12", initials: "BG", pts: 138, form: ["w","l","w","w","w"] },
  { name: "Hunter Time",  handle: "@hunter",  initials: "HT", pts: 136, form: ["w","w","l","w","l"] },
  { name: "Coach Mike",   handle: "@coachm",  initials: "CM", pts: 131, form: ["l","l","w","w","l"] },
];

const MOCK_LIVE = [
  { away: "KC",  home: "BUF", scores: [21, 17] as [number, number], q: "Q3 4:22", spread: "BUF -2.5" },
  { away: "PHI", home: "DAL", scores: [10, 14] as [number, number], q: "Q2 0:48", spread: "PHI -3"   },
];

const TICKER = [
  "ATS CONFIDENCE PICKS", "REAL-TIME SCORE UPDATES", "16 GAMES PER WEEK",
  "MNF TIEBREAKER", "SEASON ARCHIVE", "PRIVATE LEAGUES",
  "LEAGUE BOARD", "BUMP CHART RANKINGS", "WEEK-BY-WEEK HISTORY",
];

const FEATURES = [
  {
    tag: "THE SYSTEM",
    icon: "🎯",
    title: "Against The Spread,\nWith Confidence",
    desc: "Pick every NFL game against the spread. Assign confidence points 1–16 to each pick — stack big on your locks, go low on coin flips. The spread is where champions are made.",
    stat: "16 pts max",
  },
  {
    tag: "LIVE",
    icon: "⚡",
    title: "Scores Update\nAs Games Happen",
    desc: "ESPN-powered live sync. Watch your standing shift in real time every Sunday, Monday, and Thursday. No waiting until Tuesday to find out you got burned by a backdoor cover.",
    stat: "2 min sync",
  },
  {
    tag: "ANALYTICS",
    icon: "📈",
    title: "See Who's Rising\nAnd Who's Fading",
    desc: "The bump chart shows rank trajectory across every week of the season. The weekly table shows who won each week. There's nowhere to hide.",
    stat: "Full season",
  },
  {
    tag: "HISTORY",
    icon: "🏆",
    title: "Season Archive\nForever",
    desc: "Every season preserved. Every week on record. Come back in 3 years and prove you were the GOAT of the 2026 season. Receipts keep forever.",
    stat: "All seasons",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Create a Private League",
    desc: "Set it up in 30 seconds. Share an invite code with your crew. Private, no strangers.",
  },
  {
    n: "02",
    title: "Pick Every NFL Game ATS",
    desc: "Every week: pick the winner against the spread for all games. Assign your confidence 1–16. Submit before kickoff.",
  },
  {
    n: "03",
    title: "Watch the Board Update Live",
    desc: "Scores sync automatically. Standings rebuild after every final. The board is always live.",
  },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`lp-feature-card${visible ? " in-view" : ""}`}
      style={{ transitionDelay: `${index * 0.08}s` }}
    >
      <div className="lp-feature-tag">{feature.tag}</div>
      <div className="lp-feature-icon">{feature.icon}</div>
      <div className="lp-feature-title">{feature.title}</div>
      <div className="lp-feature-desc">{feature.desc}</div>
      <div className="lp-feature-stat">{feature.stat}</div>
    </div>
  );
}

function StepRow({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`lp-step${visible ? " in-view" : ""}`}
      style={{ transitionDelay: `${index * 0.12}s` }}
    >
      <div className="lp-step-num">{step.n}</div>
      <div className="lp-step-body">
        <div className="lp-step-title">{step.title}</div>
        <div className="lp-step-desc">{step.desc}</div>
      </div>
    </div>
  );
}

const DEMO_COLORS: Record<string, string> = {
  KC: "#E31837", BUF: "#00338D", PHI: "#004C54",
  DAL: "#003594", SF:  "#AA0000", LAR: "#003594",
  BAL: "#241773", CIN: "#FB4F14",
};

const DEMO_GAMES = [
  { away: "BUF", awayRec: "6-2", home: "KC",  homeRec: "7-1", spread: "BUF -2.5", ou: "48.5", time: "SUN 4:25P", net: "CBS", picked: "KC",  conf: 16, pct: 42, prime: false, locked: false, final: "",        won: false },
  { away: "PHI", awayRec: "6-2", home: "DAL", homeRec: "4-4", spread: "PHI -3",   ou: "46.0", time: "SUN 8:20P", net: "NBC", picked: "PHI", conf: 15, pct: 61, prime: true,  locked: false, final: "",        won: false },
  { away: "SF",  awayRec: "5-3", home: "LAR", homeRec: "4-4", spread: "SF -4",    ou: "44.5", time: "SUN 4:05P", net: "FOX", picked: "SF",  conf: 13, pct: 54, prime: false, locked: false, final: "",        won: false },
  { away: "BAL", awayRec: "6-2", home: "CIN", homeRec: "4-4", spread: "BAL -5.5", ou: "47.0", time: "THU 8:15P", net: "AMZ", picked: "BAL", conf: 10, pct: 68, prime: true,  locked: true,  final: "BAL 24-21", won: true  },
];

function DemoPickRow({ game }: { game: typeof DEMO_GAMES[0] }) {
  const pickedAway = game.picked === game.away;
  const pickedHome = game.picked === game.home;
  const awayColor = DEMO_COLORS[game.away] ?? "#333";
  const homeColor = DEMO_COLORS[game.home] ?? "#333";
  const highConf = game.conf >= 13;
  const midConf  = game.conf >= 8 && game.conf < 13;
  return (
    <div className={`lp-ps-row${game.locked ? " locked" : ""}`}>
      <div className="lp-ps-conf-rail" style={{ background: highConf ? "var(--accent)" : "var(--bg3)" }}>
        <div className="lp-ps-conf-num" style={{ color: highConf ? "#000" : midConf ? "var(--accent)" : "var(--ink2)" }}>{game.conf}</div>
        <div className="lp-ps-conf-tag" style={{ color: highConf ? "#000" : "var(--ink3)" }}>CONF</div>
      </div>
      <div className="lp-ps-center">
        <div className="lp-ps-meta">
          <span className="lp-ps-meta-time">{game.time}</span>
          <span className="lp-ps-net-chip">{game.net}</span>
          <span className="lp-ps-meta-label">SPREAD</span>
          <span className="lp-ps-meta-val">{game.spread}</span>
          <span className="lp-ps-meta-label">O/U</span>
          <span className="lp-ps-meta-val">{game.ou}</span>
          <div className="lp-ps-meta-spacer" />
          <span className="lp-ps-meta-pct">{game.pct}% on {game.picked}</span>
          {game.prime  && <span className="lp-ps-chip-prime">★ PRIME</span>}
          {game.locked && <span className="lp-ps-chip-locked">🔒 {game.final}</span>}
        </div>
        <div className="lp-ps-teams">
          <div className="lp-ps-side" style={pickedAway ? {
            background: `linear-gradient(90deg, color-mix(in oklab, ${awayColor} 24%, transparent), color-mix(in oklab, ${awayColor} 8%, transparent))`,
            borderLeft: `3px solid ${awayColor}`,
          } : undefined}>
            <div className="lp-ps-logo" style={{ background: awayColor }}>{game.away}</div>
            <div className="lp-ps-team-info">
              <div className={`lp-ps-team-abbr${pickedAway ? " picked" : ""}`}>{game.away}</div>
              <div className="lp-ps-team-rec">{game.awayRec}</div>
            </div>
          </div>
          <div className="lp-ps-at">@</div>
          <div className="lp-ps-side home" style={pickedHome ? {
            background: `linear-gradient(270deg, color-mix(in oklab, ${homeColor} 24%, transparent), color-mix(in oklab, ${homeColor} 8%, transparent))`,
            borderRight: `3px solid ${homeColor}`,
          } : undefined}>
            <div className="lp-ps-team-info right">
              <div className={`lp-ps-team-abbr${pickedHome ? " picked" : ""}`}>{game.home}</div>
              <div className="lp-ps-team-rec">{game.homeRec}</div>
            </div>
            <div className="lp-ps-logo" style={{ background: homeColor }}>{game.home}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {

  return (
    <div className="lp-shell">

      {/* Nav */}
      <header className="lp-nav">
        <div className="lp-nav-logo">
          <div className="app-nav-badge">TPP</div>
          <span className="lp-nav-name">thepickempool</span>
        </div>
        <div className="lp-nav-right">
          <Link href="/sign-in" className="lp-nav-signin">Sign In</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="lp-hero pp-gridbg lp-hero-grad">
        <div className="lp-hero-inner">

          {/* Left: headline + CTAs */}
          <div className="lp-hero-content">
            <div className="lp-hero-tag">
              <span className="pp-live-dot" />
              NFL · ATS CONFIDENCE PICK&apos;EM
            </div>
            <h1 className="lp-hero-title">
              THE<br />
              PICK&apos;EM<br />
              <span className="lp-hero-accent">POOL</span>
            </h1>
            <p className="lp-hero-sub">
              Boys play fantasy football. Men pick games against the spread.<br />
              Private leagues. Confidence points. Real bragging rights.
            </p>
            <div className="lp-hero-ctas">
              <Link href="/league?action=create" className="lp-btn-primary">
                Create a League
              </Link>
              <Link href="/league?action=join" className="lp-btn-secondary">
                Join a League
              </Link>
              <Link href="/sign-in" className="lp-btn-ghost">
                Sign In →
              </Link>
            </div>
            <div className="lp-hero-stats">
              {[
                { k: "FORMAT",     v: "ATS"     },
                { k: "CONFIDENCE", v: "1–16"    },
                { k: "SCORES",     v: "Live"    },
                { k: "LEAGUES",    v: "Private" },
              ].map((s) => (
                <div key={s.k} className="lp-hero-stat">
                  <div className="lp-hero-stat-val">{s.v}</div>
                  <div className="lp-hero-stat-key">{s.k}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: live app preview */}
          <div className="lp-hero-preview" aria-hidden>
            {/* Standings card */}
            <div className="lp-preview-card">
              <div className="lp-preview-card-hdr">
                <span>WEEK 8 · STANDINGS</span>
                <div className="lp-preview-chip-live">
                  <span className="pp-live-dot" />
                  LIVE
                </div>
              </div>
              {MOCK_PLAYERS.map((p, i) => (
                <div key={i} className={`lp-preview-row${i === 0 ? " leader" : ""}`}>
                  <span className="lp-preview-rank">{String(i + 1).padStart(2, "0")}</span>
                  <div className="lp-preview-player">
                    <div className="lp-preview-initials">{p.initials}</div>
                    <div>
                      <div className="lp-preview-name">{p.name}</div>
                      <div className="lp-preview-handle">{p.handle}</div>
                    </div>
                  </div>
                  <div className="lp-preview-form">
                    {p.form.map((f, j) => (
                      <span key={j} className={`lp-preview-form-pip ${f}`} />
                    ))}
                  </div>
                  <span className={`lp-preview-pts${i === 0 ? " leader" : ""}`}>{p.pts}</span>
                </div>
              ))}
            </div>

            {/* Live game tiles */}
            <div className="lp-preview-games">
              {MOCK_LIVE.map((g, i) => (
                <div key={i} className="lp-preview-game">
                  <div className="lp-preview-game-hdr">
                    <span className="pp-live-dot" style={{ width: 6, height: 6 }} />
                    <span>{g.q}</span>
                    <span className="lp-preview-spread">{g.spread}</span>
                  </div>
                  <div className="lp-preview-game-body">
                    <div className="lp-preview-team-row">
                      <span className="lp-preview-tm">{g.away}</span>
                      <span className={`lp-preview-sc${g.scores[0] > g.scores[1] ? " lead" : ""}`}>{g.scores[0]}</span>
                    </div>
                    <div className="lp-preview-team-row">
                      <span className="lp-preview-tm">{g.home}</span>
                      <span className={`lp-preview-sc${g.scores[1] > g.scores[0] ? " lead" : ""}`}>{g.scores[1]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        <div className="lp-hero-fade" />
      </section>

      {/* Ticker */}
      <div className="lp-ticker">
        <div className="lp-ticker-track">
          {[...TICKER, ...TICKER].map((item, i) => (
            <span key={i} className="lp-ticker-item">
              <span className="pp-live-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="lp-section lp-steps-section">
        <div className="lp-section-inner">
          <div className="lp-section-label">HOW IT WORKS</div>
          <h2 className="lp-section-title">Up and running<br /><span className="lp-accent">in three steps</span></h2>
          <div className="lp-steps">
            {STEPS.map((s, i) => <StepRow key={i} step={s} index={i} />)}
          </div>
        </div>
      </section>

      {/* Pick Sheet Demo */}
      <section className="lp-section lp-demo-section">
        <div className="lp-section-inner">
          <div className="lp-section-label">LIVE DEMO</div>
          <h2 className="lp-section-title">This is your<br /><span className="lp-accent">pick sheet</span></h2>
          <p className="lp-section-sub">Not a random lineup. Not waiver wire luck. Every game, every week — you either know football or you don&apos;t.</p>

          <div className="lp-ps-shell">
            {/* Header */}
            <div className="lp-ps-hdr">
              <div>
                <div className="lp-ps-hdr-tag">WEEK 14 · CONFIDENCE PICKS</div>
                <div className="lp-ps-hdr-title">LOCK IT IN</div>
                <div className="lp-ps-hdr-sub">assign 1–16 points per game · higher = more confident</div>
              </div>
              <div className="lp-ps-hdr-deadline">
                <div className="lp-ps-hdr-tag">DEADLINE</div>
                <div className="lp-ps-hdr-dl-val">2D 4H</div>
                <div className="lp-ps-hdr-dl-sub">sun · dec 7 · 1:00P</div>
              </div>
            </div>

            {/* Budget strip */}
            <div className="lp-ps-budget">
              <div className="lp-ps-budget-top">
                <span className="lp-ps-budget-label">CONFIDENCE BUDGET · 1–16</span>
                <span className="lp-ps-budget-used">used 4 / 16</span>
              </div>
              <div className="lp-ps-budget-pills">
                {Array.from({ length: 16 }, (_, i) => 16 - i).map((n) => (
                  <div key={n} className={`lp-ps-pill${[16, 15, 13, 10].includes(n) ? " used" : ""}`}>{n}</div>
                ))}
              </div>
            </div>

            {/* Game rows */}
            <div className="lp-ps-games">
              {DEMO_GAMES.map((g, i) => <DemoPickRow key={i} game={g} />)}
            </div>

            {/* Footer */}
            <div className="lp-ps-footer">
              <div>
                <div className="lp-ps-budget-label">TIEBREAKER · MNF TOTAL POINTS</div>
                <div className="lp-ps-tb-row">
                  <div className="lp-ps-tb-num">48</div>
                  <span className="lp-ps-tb-game">MIN @ CHI · Mon 8:15P</span>
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <Link href="/league?action=create" className="lp-btn-primary">
                Start Your League →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="lp-section lp-features-section">
        <div className="lp-section-inner">
          <div className="lp-section-label">FEATURES</div>
          <h2 className="lp-section-title">Everything you need to<br /><span className="lp-accent">run the pool right</span></h2>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => <FeatureCard key={i} feature={f} index={i} />)}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="lp-stats-bar">
        <div className="lp-stat"><div className="lp-stat-val">16</div><div className="lp-stat-label">Games Per Week</div></div>
        <div className="lp-stat-divider" />
        <div className="lp-stat"><div className="lp-stat-val">1–16</div><div className="lp-stat-label">Confidence Range</div></div>
        <div className="lp-stat-divider" />
        <div className="lp-stat"><div className="lp-stat-val">3</div><div className="lp-stat-label">Tiebreaker Levels</div></div>
        <div className="lp-stat-divider" />
        <div className="lp-stat"><div className="lp-stat-val">∞</div><div className="lp-stat-label">Bragging Rights</div></div>
      </div>

      {/* Final CTA */}
      <section className="lp-cta-section">
        <div className="lp-cta-inner">
          <div className="lp-cta-tag">GET STARTED FREE</div>
          <h2 className="lp-cta-title">Fantasy is luck.<br />Picking games ATS is skill.<br /><span style={{ color: "var(--accent)" }}>Prove yours.</span></h2>
          <div className="lp-cta-buttons">
            <Link href="/league?action=create" className="lp-btn-primary lg">
              Create a League
            </Link>
            <Link href="/league?action=join" className="lp-btn-secondary lg">
              Join a League
            </Link>
          </div>
          <Link href="/sign-in" className="lp-cta-signin">Already have an account? Sign in →</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">
          <div className="app-nav-badge" style={{ fontSize: 10 }}>TPP</div>
          <span style={{ fontSize: 13, color: "var(--ink3)" }}>thepickempool</span>
        </div>
        <div className="lp-footer-copy">NFL ATS Confidence Pick&apos;em · Private Leagues · Built for real fans</div>
        <Link href="/privacy" className="lp-footer-legal">Privacy Policy</Link>
      </footer>

    </div>
  );
}
