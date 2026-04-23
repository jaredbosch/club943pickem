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

export function LeagueDashboard({ league, standings, isCommissioner, currentUserId, initialPosts }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(league.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="ps-shell">
      <div className="dash-wide-container">
        {/* Header */}
        <div className="dash-header">
          <div>
            <div className="ps-title">{league.name}</div>
            <div className="ps-subtitle">{league.season_year} season · {league.status}</div>
          </div>
          <Link href="/picks" className="dash-picks-btn">
            My Picks →
          </Link>
        </div>

        {/* Invite code (commissioner only) */}
        {isCommissioner && (
          <div className="dash-invite">
            <span className="dash-invite-label">Invite code</span>
            <span className="dash-invite-code">{league.invite_code}</span>
            <button type="button" className="dash-invite-copy" onClick={copyCode}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}

        {/* Two-column layout */}
        <div className="dash-columns">
          {/* Left: Standings */}
          <div className="dash-main">
            <div className="dash-card">
              <div className="dash-section-label">Season standings</div>
              {standings.length === 0 ? (
                <p className="dash-empty">No standings yet — picks lock when games start.</p>
              ) : (
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th className="dash-th dash-th-rank">#</th>
                      <th className="dash-th dash-th-name">Player</th>
                      <th className="dash-th dash-th-num">Pts</th>
                      <th className="dash-th dash-th-num">W-L</th>
                      <th className="dash-th dash-th-arrow" />
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row) => (
                      <tr key={row.userId} className={`dash-row${row.isCurrentUser ? " dash-row-me" : " dash-row-link"}`}>
                        <td className="dash-td dash-td-rank">{row.rank}</td>
                        <td className="dash-td dash-td-name">
                          <Link
                            href={row.isCurrentUser ? "/picks" : `/picks/${row.userId}`}
                            className="dash-player-link"
                          >
                            {row.displayName}
                            {row.isCurrentUser && <span className="dash-you">you</span>}
                            {row.isPaid && <span className="dash-paid">$</span>}
                          </Link>
                        </td>
                        <td className="dash-td dash-td-num">{row.totalPoints}</td>
                        <td className="dash-td dash-td-num">{row.correctPicks}</td>
                        <td className="dash-td dash-td-arrow">
                          <Link
                            href={row.isCurrentUser ? "/picks" : `/picks/${row.userId}`}
                            className="dash-arrow"
                            tabIndex={-1}
                            aria-hidden
                          >
                            →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right: League board */}
          <div className="dash-sidebar">
            <LeagueNotes
              leagueId={league.id}
              initialPosts={initialPosts}
              isCommissioner={isCommissioner}
              currentUserId={currentUserId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
