import Link from "next/link";
import { NFL_COLORS } from "@/lib/nfl-colors";

type GameCol = {
  id: string;
  away: string;
  home: string;
  status: string;
  timeSlot: string;
  kickoffTime: string;
};

type PlayerRow = {
  userId: string;
  displayName: string;
  weekPoints: number;
  weekCorrect: number;
  rank: number | null;
  isCurrentUser: boolean;
  picks: Record<string, { pickedTeam: string; isCorrect: boolean | null; confidence: number | null }>;
};

type Props = {
  leagueName: string;
  week: number;
  seasonYear: number;
  availableWeeks: number[];
  games: GameCol[];
  players: PlayerRow[];
  consensus: Record<string, { team: string; count: number; total: number }>;
  currentUserId: string;
  hasGames: boolean;
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const SLOT_LABELS: Record<string, string> = {
  thursday: "THU",
  intl: "INTL",
  sunday_early: "SUN",
  sunday_late: "SUN",
  sunday_night: "SNF",
  monday: "MNF",
};

function gameLabel(game: GameCol): string {
  if (game.status === "final" || game.status === "complete") return "FINAL";
  if (game.status === "live" || game.status === "in_progress") return "LIVE";
  return SLOT_LABELS[game.timeSlot] ?? "SUN";
}

function HeatCell({
  pick,
  gameStatus,
}: {
  pick: { pickedTeam: string; isCorrect: boolean | null; confidence: number | null } | undefined;
  gameStatus: string;
}) {
  if (!pick) {
    return <div className="grid-cell grid-cell-empty" />;
  }

  const color = NFL_COLORS[pick.pickedTeam]?.primary ?? "#333";
  const isLive = gameStatus === "live" || gameStatus === "in_progress";
  const isGraded = pick.isCorrect !== null;
  const isWin = pick.isCorrect === true;
  const isLoss = pick.isCorrect === false;

  let bg: string;
  let cellClass = "grid-cell";

  if (isWin) {
    bg = `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 70%, #000))`;
    cellClass += " grid-cell-win";
  } else if (isLoss) {
    bg = `color-mix(in oklab, ${color} 30%, var(--bg2))`;
    cellClass += " grid-cell-loss";
  } else if (isLive) {
    bg = `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 75%, #000))`;
    cellClass += " grid-cell-live";
  } else {
    bg = `color-mix(in oklab, ${color} 28%, var(--bg2))`;
    cellClass += " grid-cell-pending";
  }

  return (
    <div className={cellClass} style={{ background: bg }}>
      <span className="grid-cell-abbr">{pick.pickedTeam}</span>
      {isWin  && <span className="grid-cell-icon win">✓</span>}
      {isLoss && <span className="grid-cell-icon loss">✗</span>}
      {isLive && !isGraded && <span className="pp-live-dot grid-cell-dot" />}
    </div>
  );
}

function GameHeader({ game }: { game: GameCol }) {
  const label = gameLabel(game);
  const isLive = game.status === "live" || game.status === "in_progress";
  const isFinal = game.status === "final" || game.status === "complete";

  const awayColor = NFL_COLORS[game.away]?.primary ?? "#333";
  const homeColor = NFL_COLORS[game.home]?.primary ?? "#333";
  const awayGrad = `linear-gradient(145deg, ${awayColor}, color-mix(in oklab, ${awayColor} 70%, #000))`;
  const homeGrad = `linear-gradient(145deg, ${homeColor}, color-mix(in oklab, ${homeColor} 70%, #000))`;

  return (
    <div className="grid-game-header">
      <div className="grid-game-logos">
        <div className="grid-mini-logo" style={{ background: awayGrad }}>{game.away}</div>
        <span className="grid-game-at">@</span>
        <div className="grid-mini-logo" style={{ background: homeGrad }}>{game.home}</div>
      </div>
      <div className="grid-game-matchup">{game.away}·{game.home}</div>
      <div className={`grid-game-status${isLive ? " live" : isFinal ? " final" : ""}`}>
        {label}
      </div>
    </div>
  );
}

export function WeeklyGrid({
  leagueName,
  week,
  seasonYear,
  availableWeeks,
  games,
  players,
  consensus,
  hasGames,
}: Props) {
  const maxPoints = players.length > 0 ? Math.max(...players.map((p) => p.weekPoints), 1) : 1;
  const prevWeek = availableWeeks.findIndex((w) => w === week) > 0
    ? availableWeeks[availableWeeks.findIndex((w) => w === week) - 1]
    : null;
  const nextWeek = availableWeeks.findIndex((w) => w === week) < availableWeeks.length - 1
    ? availableWeeks[availableWeeks.findIndex((w) => w === week) + 1]
    : null;

  return (
    <div className="wg-shell pp-gridbg">

      {/* Nav */}
      <header className="app-nav">
        <Link href="/dashboard" className="app-nav-logo">
          <div className="app-nav-badge">TPP</div>
          <span className="app-nav-name">thepickempool</span>
        </Link>
        <div style={{ width: 1, height: 24, background: "var(--line)" }} />
        <span className="pp-chip solid">{leagueName}</span>
        <div style={{ flex: 1 }} />
        <Link href="/dashboard" className="ps-nav-back">← Standings</Link>
        <Link href="/picks" className="dash-picks-btn">Make Picks →</Link>
      </header>

      {/* Hero */}
      <div className="wg-hero pp-hero-grad">
        <div>
          <div className="tag">WEEK {week} · {seasonYear} · PICKS MATRIX</div>
          <div className="wg-hero-title">THE GRID</div>
          <div className="wg-hero-legend">
            <span style={{ color: "var(--good)" }}>■ correct</span>
            <span style={{ color: "var(--bad)" }}>■ wrong</span>
            <span style={{ color: "var(--accent)" }}>■ live</span>
            <span style={{ color: "var(--ink3)" }}>■ pending</span>
          </div>
        </div>
        <div className="wg-week-nav">
          {prevWeek !== null
            ? <Link href={`/grid?week=${prevWeek}`} className="pp-btn ghost">← Wk {prevWeek}</Link>
            : <span className="pp-btn ghost" style={{ opacity: 0.3, cursor: "default" }}>← Wk {week - 1}</span>
          }
          <span className="pp-chip solid" style={{ padding: "6px 14px", fontSize: 12 }}>WEEK {week}</span>
          {nextWeek !== null
            ? <Link href={`/grid?week=${nextWeek}`} className="pp-btn ghost">Wk {nextWeek} →</Link>
            : <span className="pp-btn ghost" style={{ opacity: 0.3, cursor: "default" }}>Wk {week + 1} →</span>
          }
        </div>
      </div>

      {/* Grid */}
      {!hasGames ? (
        <div style={{ padding: "40px 24px", textAlign: "center" }}>
          <div className="disp-900" style={{ fontSize: 24, color: "var(--ink3)" }}>No games this week yet</div>
        </div>
      ) : (
        <div className="wg-scroll-area">
          <div className="wg-grid-wrap">

            {/* Sticky left column */}
            <div className="wg-left-col">
              <div className="wg-left-header">
                <span className="tag">RANK · PLAYER · PTS</span>
              </div>
              {players.map((p, i) => (
                <Link
                  key={p.userId}
                  href={`/picks/${p.userId}`}
                  className={`wg-player-row${p.isCurrentUser ? " me" : ""}${i === 0 ? " first" : ""}`}
                >
                  {i === 0 && <div className="wg-player-leader-bar" />}
                  <span className="wg-player-rank">{String(i + 1).padStart(2, "0")}</span>
                  <div className="wg-player-avatar">{initials(p.displayName)}</div>
                  <div className="wg-player-info">
                    <div className="wg-player-name">
                      {p.displayName}
                      {p.isCurrentUser && <span className="wg-you">you</span>}
                    </div>
                    <div className="wg-player-bar-wrap">
                      <div
                        className="wg-player-bar"
                        style={{
                          width: `${(p.weekPoints / maxPoints) * 100}%`,
                          background: i === 0 ? "var(--accent)" : "var(--ink2)",
                        }}
                      />
                    </div>
                  </div>
                  <div className={`wg-player-pts${i === 0 ? " accent" : ""}`}>{p.weekPoints}</div>
                </Link>
              ))}
            </div>

            {/* Right: game columns */}
            <div className="wg-right-col">
              {/* Game headers */}
              <div className="wg-game-headers">
                {games.map((g) => <GameHeader key={g.id} game={g} />)}
              </div>

              {/* Player pick rows */}
              {players.map((p, i) => (
                <div
                  key={p.userId}
                  className={`wg-pick-row${p.isCurrentUser ? " me" : ""}${i === 0 ? " first" : ""}${i % 2 === 0 ? " even" : ""}`}
                >
                  {games.map((g) => (
                    <HeatCell
                      key={g.id}
                      pick={p.picks[g.id]}
                      gameStatus={g.status}
                    />
                  ))}
                </div>
              ))}

              {/* Consensus footer */}
              {players.length > 0 && (
                <div className="wg-consensus-row">
                  {games.map((g) => {
                    const c = consensus[g.id];
                    if (!c) return <div key={g.id} className="grid-cell grid-cell-empty" />;
                    const color = NFL_COLORS[c.team]?.primary ?? "#333";
                    const pct = Math.round((c.count / c.total) * 100);
                    return (
                      <div key={g.id} className="wg-consensus-cell">
                        <div className="tag" style={{ fontSize: 7 }}>TOP</div>
                        <div
                          className="wg-consensus-logo"
                          style={{ background: `linear-gradient(145deg, ${color}, color-mix(in oklab, ${color} 70%, #000))` }}
                        >
                          {c.team}
                        </div>
                        <div className="wg-consensus-pct">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
