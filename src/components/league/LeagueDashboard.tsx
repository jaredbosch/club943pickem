"use client";

import Link from "next/link";
import { useState } from "react";
import { LeagueNotes } from "./LeagueNotes";

type StandingRow = {
  userId: string;
  rank: number;
  displayName: string;
  isPaid: boolean;
  totalPoints: number;
  correctPicks: number;
  isCurrentUser: boolean;
};

type League = {
  id: string;
  name: string;
  season_year: number;
  invite_code: string;
  status: string;
};

type Post = {
  id: string;
  body: string;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
  authorName: string;
  isCurrentUser: boolean;
};

type Props = {
  league: League;
  standings: StandingRow[];
  isCommissioner: boolean;
  currentUserId: string;
  initialPosts: Post[];
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export function LeagueDashboard({ league, standings, isCommissioner, currentUserId, initialPosts }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(league.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const me = standings.find((r) => r.isCurrentUser);
  const leader = standings[0];
  const gapToFirst = me && leader && !leader.isCurrentUser
    ? leader.totalPoints - me.totalPoints
    : null;

  const tickerItems = [
    `${league.name} · ${league.season_year} Season`,
    `${standings.length} players competing`,
    leader ? `🏆 Leader: ${leader.displayName} · ${leader.totalPoints} pts` : "Season starting soon",
    me ? `You are ranked #${me.rank}` : "Make your picks",
    "Confidence pool · 1 point per game · higher = more confident",
    league.status === "active" ? "Season in progress" : `Status: ${league.status}`,
  ];

  return (
    <div className="dash-shell pp-gridbg">

      {/* Nav */}
      <header className="app-nav">
        <Link href="/dashboard" className="app-nav-logo">
          <div className="app-nav-badge">TPP</div>
          <span className="app-nav-name">thepickempool</span>
        </Link>
        <div style={{ width: 1, height: 24, background: "var(--line)" }} />
        <span className="pp-chip solid">{league.season_year}</span>
        <div style={{ flex: 1 }} />
        <Link href="/grid" className="ps-nav-back">The Grid</Link>
        <Link href={`/picks/${currentUserId}`} className="ps-nav-back">My Profile</Link>
        <Link href="/picks" className="dash-picks-btn">Make Picks →</Link>
      </header>

      {/* Hero */}
      <div className="dash-hero pp-hero-grad">
        <div className="dash-hero-left">
          <div className="dash-hero-tag">SEASON {league.season_year} · STANDINGS</div>
          <div className="dash-hero-title">THE BOARD</div>
          <div className="dash-hero-sub">{league.name} · {standings.length} players</div>
        </div>
        <div className="dash-hero-divider" />
        <div className="dash-hero-kpis">
          {me && (
            <div className="dash-kpi">
              <div className="dash-kpi-label">Your Rank</div>
              <div className="dash-kpi-val good">#{me.rank}</div>
              <div className="dash-kpi-sub">{me.totalPoints} pts</div>
            </div>
          )}
          {gapToFirst !== null && (
            <div className="dash-kpi">
              <div className="dash-kpi-label">Points to 1st</div>
              <div className="dash-kpi-val">-{gapToFirst}</div>
              <div className="dash-kpi-sub">{leader?.displayName}</div>
            </div>
          )}
          {leader && (
            <div className="dash-kpi">
              <div className="dash-kpi-label">League Leader</div>
              <div className="dash-kpi-val accent">{leader.totalPoints}</div>
              <div className="dash-kpi-sub">{leader.displayName}</div>
            </div>
          )}
          <div className="dash-kpi">
            <div className="dash-kpi-label">Players</div>
            <div className="dash-kpi-val">{standings.length}</div>
            <div className="dash-kpi-sub">in the pool</div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div className="dash-ticker">
        <div className="dash-ticker-inner pp-ticker-track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="dash-ticker-item">
              <span className="pp-live-dot" style={{ animationDelay: `${i * 0.15}s` }} />
              {item}
            </span>
          ))}
        </div>
        <div className="dash-ticker-fade-l" />
        <div className="dash-ticker-fade-r" />
      </div>

      {/* Main */}
      <div className="dash-main-area">

        {/* Left: standings */}
        <div className="dash-main">
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title">League Standings</div>
                <div className="dash-card-sub">season · all weeks</div>
              </div>
              <div className="dash-card-spacer" />
            </div>

            {standings.length === 0 ? (
              <p className="dash-empty">No standings yet — picks lock when games start.</p>
            ) : (
              <table className="dash-table">
                <thead>
                  <tr>
                    <th className="dash-th dash-th-rank">#</th>
                    <th className="dash-th">Player</th>
                    <th className="dash-th dash-th-num">Correct</th>
                    <th className="dash-th dash-th-num">Pts</th>
                    <th className="dash-th dash-th-arrow" />
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, i) => (
                    <tr
                      key={row.userId}
                      className={`dash-row${row.isCurrentUser ? " dash-row-me" : " dash-row-link"}${i === 0 ? " dash-row-first" : ""}`}
                    >
                      <td className="dash-td dash-td-rank">{row.rank}</td>
                      <td className="dash-td dash-td-name">
                        <Link
                          href={row.isCurrentUser ? "/picks" : `/picks/${row.userId}`}
                          className="dash-player-link"
                        >
                          <span className="dash-avatar">{initials(row.displayName)}</span>
                          <span className="dash-player-name">
                            {row.displayName}
                            {row.isCurrentUser && <span className="dash-you">you</span>}
                            {row.isPaid && <span className="dash-paid">$</span>}
                          </span>
                        </Link>
                      </td>
                      <td className="dash-td dash-td-num">{row.correctPicks}</td>
                      <td className="dash-td dash-td-num">{row.totalPoints}</td>
                      <td className="dash-td dash-td-arrow">
                        <Link
                          href={row.isCurrentUser ? "/picks" : `/picks/${row.userId}`}
                          className="dash-arrow"
                          tabIndex={-1}
                          aria-hidden
                        >→</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: invite code + league board */}
        <div className="dash-sidebar">
          {isCommissioner && (
            <div className="dash-invite">
              <span className="dash-invite-label">Invite</span>
              <span className="dash-invite-code">{league.invite_code}</span>
              <button type="button" className="dash-invite-copy" onClick={copyCode}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
          <LeagueNotes
            leagueId={league.id}
            initialPosts={initialPosts}
            isCommissioner={isCommissioner}
            currentUserId={currentUserId}
          />
        </div>
      </div>

    </div>
  );
}
