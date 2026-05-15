"use client";

import Link from "next/link";
import { useState } from "react";
import { LeagueNotes } from "./LeagueNotes";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SignOutButton } from "@/components/ui/SignOutButton";

type StandingRow = {
  userId: string;
  rank: number;
  displayName: string;
  isPaid: boolean;
  totalPoints: number;
  correctPicks: number;
  losses: number;
  form: ("W" | "L")[];
  streak: number;
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
  body: string | null;
  image_url: string | null;
  is_pinned: boolean;
  created_at: string;
  user_id: string;
  authorName: string;
  isCurrentUser: boolean;
  comments: unknown[];
};

type WeeklyPlayerRow = {
  userId: string;
  displayName: string;
  isCurrentUser: boolean;
  totalSeasonPts: number;
  weekPts: Record<number, number>;
  weekRank: Record<number, number>;
};

type Props = {
  league: League;
  leagueCode: string;
  standings: StandingRow[];
  isCommissioner: boolean;
  currentUserId: string;
  initialPosts: Post[];
  weeklyPlayerRows: WeeklyPlayerRow[];
  allWeeks: number[];
  viewingSeason: number;
  currentSeasonYear: number;
  availableSeasons: number[];
  isArchive: boolean;
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const BUMP_COLORS = [
  "#3B82F6","#EF4444","#10B981","#F59E0B","#8B5CF6",
  "#EC4899","#06B6D4","#F97316","#84CC16","#6366F1",
  "#D946EF","#14B8A6","#78716C",
];

function WeeklyTable({ weeklyRows, weeks }: { weeklyRows: WeeklyPlayerRow[]; weeks: number[] }) {
  if (weeks.length === 0) return null;

  const weekWinners = new Map<number, string>();
  for (const row of weeklyRows) {
    for (const [wStr, rank] of Object.entries(row.weekRank)) {
      if (rank === 1) weekWinners.set(Number(wStr), row.userId);
    }
  }

  return (
    <div className="wt-scroll">
      <table className="wt-table">
        <thead>
          <tr>
            <th className="wt-th wt-th-player">Player</th>
            {weeks.map((w) => <th key={w} className="wt-th wt-th-week">Wk {w}</th>)}
            <th className="wt-th wt-th-total">Total</th>
          </tr>
        </thead>
        <tbody>
          {weeklyRows.map((row, i) => (
            <tr key={row.userId} className={`wt-row${row.isCurrentUser ? " me" : ""}${i === 0 ? " first" : ""}`}>
              <td className="wt-td wt-td-player">
                <span className="wt-rank">{i + 1}</span>
                <span className="wt-name">
                  {row.displayName}
                  {row.isCurrentUser && <span className="dash-you">you</span>}
                </span>
              </td>
              {weeks.map((w) => {
                const pts = row.weekPts[w];
                const isWinner = weekWinners.get(w) === row.userId;
                return (
                  <td key={w} className={`wt-td wt-td-week${isWinner ? " winner" : ""}${pts == null ? " empty" : ""}`}>
                    {pts ?? "—"}
                  </td>
                );
              })}
              <td className="wt-td wt-td-total">{row.totalSeasonPts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BumpChart({ weeklyRows, weeks }: { weeklyRows: WeeklyPlayerRow[]; weeks: number[] }) {
  if (weeks.length < 2) return null;

  const numPlayers = weeklyRows.length;
  const W = 900;
  const H = 320;
  const padL = 24;
  const padR = 110;
  const padT = 24;
  const padB = 32;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const xFor = (i: number) => padL + (i / (weeks.length - 1)) * plotW;
  const yFor = (rank: number) => padT + ((rank - 1) / Math.max(numPlayers - 1, 1)) * plotH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="bump-chart">
      {/* Horizontal rank grid lines */}
      {Array.from({ length: numPlayers }, (_, i) => i + 1).map((rank) => (
        <line
          key={rank}
          x1={padL} y1={yFor(rank)}
          x2={padL + plotW} y2={yFor(rank)}
          stroke="var(--line)" strokeWidth={0.5}
        />
      ))}

      {/* Week labels on x-axis */}
      {weeks.map((w, i) => (
        <text key={w} x={xFor(i)} y={H - 8} textAnchor="middle" className="bump-axis-label">
          Wk {w}
        </text>
      ))}

      {/* Rank labels on left */}
      {Array.from({ length: numPlayers }, (_, i) => i + 1).map((rank) => (
        <text key={rank} x={padL - 6} y={yFor(rank) + 4} textAnchor="end" className="bump-axis-label">
          {rank}
        </text>
      ))}

      {/* Player lines */}
      {weeklyRows.map((player, pi) => {
        const color = BUMP_COLORS[pi % BUMP_COLORS.length];
        const pts: [number, number][] = [];
        weeks.forEach((w, wi) => {
          const rank = player.weekRank[w];
          if (rank != null) pts.push([xFor(wi), yFor(rank)]);
        });
        if (pts.length === 0) return null;

        let d = `M ${pts[0][0]} ${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) {
          const mx = (pts[i - 1][0] + pts[i][0]) / 2;
          d += ` C ${mx} ${pts[i - 1][1]}, ${mx} ${pts[i][1]}, ${pts[i][0]} ${pts[i][1]}`;
        }

        const last = pts[pts.length - 1];
        const shortName = player.displayName.split(" ")[0];

        return (
          <g key={player.userId}>
            <path d={d} fill="none" stroke={color} strokeWidth={player.isCurrentUser ? 3 : 1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
            {pts.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={player.isCurrentUser ? 4 : 3} fill={color} />
            ))}
            <text x={last[0] + 10} y={last[1] + 4} className="bump-name-label" fill={color}>
              {shortName}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function LeagueDashboard({ league, leagueCode, standings, isCommissioner, currentUserId, initialPosts, weeklyPlayerRows, allWeeks, viewingSeason, currentSeasonYear, availableSeasons, isArchive }: Props) {
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
        <Link href={`/league/${leagueCode}/dashboard`} className="app-nav-logo">
          <div className="app-nav-badge">TPP</div>
          <span className="app-nav-name">thepickempool</span>
        </Link>
        <div className="app-nav-sep" />
        <span className="pp-chip solid app-nav-year">{league.season_year}</span>
        <div className="app-nav-spacer" />
        <nav className="app-nav-links">
          <Link href={`/league/${leagueCode}/grid`} className="ps-nav-back">The Grid</Link>
          <Link href={`/league/${leagueCode}/picks/${currentUserId}`} className="ps-nav-back">My Profile</Link>
          <Link href="/settings" className="ps-nav-back">Settings</Link>
          {isCommissioner && <Link href={`/league/${leagueCode}/commissioner`} className="ps-nav-back">⚙ Commissioner</Link>}
        </nav>
        <Link href={`/league/${leagueCode}/picks`} className="dash-picks-btn">Make Picks →</Link>
        <SignOutButton />
          <ThemeToggle />
      </header>

      {/* Archive banner */}
      {isArchive && (
        <div className="dash-archive-banner">
          <span>📁 Viewing {viewingSeason} season archive</span>
          <Link href={`/league/${leagueCode}/dashboard`} className="dash-archive-live">← Back to {currentSeasonYear}</Link>
        </div>
      )}

      {/* Hero */}
      <div className="dash-hero pp-hero-grad">
        <div className="dash-hero-left">
          <div className="dash-hero-tag">SEASON {viewingSeason} · {isArchive ? "FINAL STANDINGS" : "STANDINGS"}</div>
          <div className="dash-hero-title">{isArchive ? "ARCHIVE" : "THE BOARD"}</div>
          <div className="dash-hero-sub">{league.name} · {standings.length} players</div>
          {availableSeasons.length > 1 && (
            <div className="dash-season-nav">
              {availableSeasons.map((y) => (
                <Link
                  key={y}
                  href={y === currentSeasonYear ? `/league/${leagueCode}/dashboard` : `/league/${leagueCode}/dashboard?season=${y}`}
                  className={`dash-season-btn${y === viewingSeason ? " active" : ""}`}
                >
                  {y}
                </Link>
              ))}
            </div>
          )}
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
                    <th className="dash-th dash-th-num">W-L</th>
                    <th className="dash-th dash-th-pts">PTS</th>
                    <th className="dash-th dash-th-arrow" />
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, i) => {
                    return (
                      <tr
                        key={row.userId}
                        className={`dash-row${row.isCurrentUser ? " dash-row-me" : " dash-row-link"}${i === 0 ? " dash-row-first" : ""}`}
                      >
                        <td className="dash-td dash-td-rank">{row.rank}</td>
                        <td className="dash-td dash-td-name">
                          <Link
                            href={row.isCurrentUser ? `/league/${leagueCode}/picks` : `/league/${leagueCode}/picks/${row.userId}`}
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
                        <td className="dash-td dash-td-num">
                          <span className="dash-record">
                            <span style={{ color: "var(--good)" }}>{row.correctPicks}</span>
                            <span style={{ color: "var(--ink3)" }}>–</span>
                            <span style={{ color: "var(--bad)" }}>{row.losses}</span>
                          </span>
                        </td>
                        <td className="dash-td dash-td-pts">
                          <span className={`dash-pts${i === 0 ? " first" : ""}`}>{row.totalPoints}</span>
                        </td>
                        <td className="dash-td dash-td-arrow">
                          <Link
                            href={row.isCurrentUser ? `/league/${leagueCode}/picks` : `/league/${leagueCode}/picks/${row.userId}`}
                            className="dash-arrow"
                            tabIndex={-1}
                            aria-hidden
                          >→</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: invite code + league board */}
        <div className="dash-sidebar">
          {isCommissioner && !isArchive && (
            <div className="dash-invite">
              <span className="dash-invite-label">Invite</span>
              <span className="dash-invite-code">{league.invite_code}</span>
              <button type="button" className="dash-invite-copy" onClick={copyCode}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          )}
          {isArchive ? (
            <div className="dash-archive-sidebar">
              <div className="dash-archive-sidebar-title">📁 {viewingSeason} Archive</div>
              <div className="dash-archive-sidebar-body">
                Final standings and weekly results for the {viewingSeason} season.
                {availableSeasons.filter((y) => y !== viewingSeason).length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 10, color: "var(--ink3)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>Other seasons</div>
                    {availableSeasons.filter((y) => y !== viewingSeason).map((y) => (
                      <Link key={y} href={y === currentSeasonYear ? `/league/${leagueCode}/dashboard` : `/league/${leagueCode}/dashboard?season=${y}`} className="dash-archive-season-link">
                        {y} season →
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
          <LeagueNotes
            leagueId={league.id}
            // eslint-disable-next-line
            initialPosts={initialPosts as any}
            isCommissioner={isCommissioner}
            currentUserId={currentUserId}
          />
          )}
        </div>
      </div>

      {/* Weekly Results + Bump Chart */}
      {allWeeks.length > 0 && (
        <div className="wt-section">
          <div className="wt-section-header">
            <div>
              <div className="dash-card-title">Weekly Results</div>
              <div className="dash-card-sub">points per week · green = week winner</div>
            </div>
          </div>
          <WeeklyTable weeklyRows={weeklyPlayerRows} weeks={allWeeks} />

          {allWeeks.length >= 2 && (
            <>
              <div className="wt-chart-header">
                <div className="dash-card-title">Rankings Over Time</div>
                <div className="dash-card-sub">rank position by week — lower is better</div>
              </div>
              <BumpChart weeklyRows={weeklyPlayerRows} weeks={allWeeks} />
            </>
          )}
        </div>
      )}

    </div>
  );
}
