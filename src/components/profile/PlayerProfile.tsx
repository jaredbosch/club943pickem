import { AppHeader } from "@/components/nav/AppHeader";
import Link from "next/link";
import { NFL_COLORS } from "@/lib/nfl-colors";
import type { ProfileStats } from "@/lib/profile-stats";
import type { ScoringType } from "@/lib/scoring";
import { isAtsFormat, isConfidenceFormat, isPick5Format } from "@/lib/scoring";

type WeekStat = {
  week: number;
  correct: number;
  rank: number | null;
  points: number;
};

type PickItem = {
  week: number;
  pickedTeam: string;
  opponent: string;
  confidence: number | null;
  result: "won" | "lost" | "pending";
  pointsEarned: number | null;
};

type TeamTendency = {
  abbr: string;
  wins: number;
  total: number;
  pct: number;
};

type Props = {
  displayName: string;
  leagueName: string;
  leagueCode: string;
  seasonYear: number;
  seasonPoints: number;
  correctPicks: number;
  totalGraded: number;
  missedGames: number;
  rank: number | null;
  totalPlayers: number;
  leaderPoints: number;
  weekStats: WeekStat[];
  recentPicks: PickItem[];
  mostTrusted: TeamTendency[];
  blindSpots: TeamTendency[];
  profileStats: ProfileStats;
  scoringType: ScoringType;
  isCurrentUser: boolean;
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function TeamBadge({ abbr, size = 32 }: { abbr: string; size?: number }) {
  const color = NFL_COLORS[abbr]?.primary ?? "#333";
  const gradient = `linear-gradient(145deg, ${color}, color-mix(in oklab, ${color} 70%, #000))`;
  return (
    <div
      className="prof-team-badge"
      style={{ width: size, height: size, background: gradient }}
    >
      {abbr}
    </div>
  );
}

export function PlayerProfile({
  displayName,
  leagueName,
  leagueCode,
  seasonYear,
  seasonPoints,
  correctPicks,
  totalGraded,
  missedGames,
  rank,
  totalPlayers,
  leaderPoints,
  weekStats,
  recentPicks,
  mostTrusted,
  blindSpots,
  profileStats,
  scoringType,
  isCurrentUser,
}: Props) {
  const winRate = totalGraded > 0 ? Math.round((correctPicks / totalGraded) * 100) : 0;
  const gapToFirst = rank !== 1 && leaderPoints > seasonPoints ? leaderPoints - seasonPoints : null;
  const maxCorrect = weekStats.length > 0 ? Math.max(...weekStats.map((w) => w.correct), 1) : 1;

  const kpis = [
    { label: "SEASON PTS", value: seasonPoints, sub: `${totalGraded} picks graded`, accent: true },
    { label: "WIN RATE", value: `${winRate}%`, sub: `${correctPicks}-${totalGraded - correctPicks}` },
    { label: "MISSED", value: missedGames, sub: missedGames === 0 ? "perfect attendance" : `game${missedGames !== 1 ? "s" : ""} skipped`, warn: missedGames > 0 },
    { label: "RANK", value: rank ? `#${rank}` : "—", sub: `of ${totalPlayers}` },
    gapToFirst !== null
      ? { label: "TO 1ST", value: `-${gapToFirst}`, sub: "pts behind leader", warn: true }
      : { label: "LEADING", value: "🏆", sub: "top of the board", good: true },
    { label: "BEST WEEK", value: weekStats.length > 0 ? Math.max(...weekStats.map((w) => w.correct)) : "—", sub: weekStats.length > 0 ? `wk ${weekStats.find((w) => w.correct === Math.max(...weekStats.map((x) => x.correct)))?.week}` : "no data", good: true },
  ];

  return (
    <div className="prof-shell pp-gridbg">

      {/* Nav */}
      <AppHeader
        leagueCode={leagueCode}
        leagueName={leagueName}
        contextLabel="PLAYER PROFILE"
        action={
          isCurrentUser ? (
            <Link href={`/league/${leagueCode}/picks`} className="dash-picks-btn">Make Picks →</Link>
          ) : undefined
        }
      />

      {/* Hero */}
      <div className="prof-hero pp-hero-grad">
        <div className="prof-hero-identity">
          <div className="prof-avatar">{initials(displayName)}</div>
          <div>
            <div className="tag">PLAYER PROFILE · {seasonYear}</div>
            <div className="prof-name">{displayName}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              {isCurrentUser && <span className="pp-chip solid" style={{ fontSize: 10 }}>YOU</span>}
              {rank === 1 && <span className="pp-chip solid" style={{ fontSize: 10 }}>🏆 LEADER</span>}
            </div>
          </div>
        </div>

        <div className="prof-hero-divider" />

        <div className="prof-kpis">
          {kpis.map((k, i) => (
            <div key={i} className="prof-kpi">
              <div className="prof-kpi-label">{k.label}</div>
              <div className={`prof-kpi-val${k.accent ? " accent" : k.good ? " good" : k.warn ? " warn" : ""}`}>
                {String(k.value)}
              </div>
              <div className="prof-kpi-sub">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main two-column body */}
      <div className="prof-main">

        {/* LEFT: weekly chart + pick history */}
        <div className="prof-left">

          {/* Weekly performance bars */}
          <div className="prof-card">
            <div className="prof-card-header">
              <div>
                <div className="prof-card-title">WEEKLY PERFORMANCE</div>
                <div className="prof-card-sub">correct picks · all graded weeks</div>
              </div>
              <div className="prof-chart-legend">
                <span style={{ color: "var(--good)" }}>■ strong</span>
                <span style={{ color: "var(--accent)" }}>■ ok</span>
                <span style={{ color: "var(--bad)" }}>■ rough</span>
              </div>
            </div>

            {weekStats.length === 0 ? (
              <div className="prof-empty">No weeks graded yet</div>
            ) : (
              <div className="prof-chart">
                {weekStats.map((w) => {
                  const heightPct = maxCorrect > 0 ? (w.correct / maxCorrect) * 100 : 0;
                  const barColor = w.correct >= maxCorrect * 0.75
                    ? "linear-gradient(180deg, var(--good), color-mix(in oklab, var(--good) 60%, #000))"
                    : w.correct >= maxCorrect * 0.5
                      ? "linear-gradient(180deg, var(--accent), color-mix(in oklab, var(--accent) 60%, #000))"
                      : "linear-gradient(180deg, var(--bad), color-mix(in oklab, var(--bad) 60%, #000))";
                  return (
                    <div key={w.week} className="prof-bar-col">
                      <div className="prof-bar-num">{w.correct}</div>
                      <div className="prof-bar-wrap">
                        <div
                          className="prof-bar"
                          style={{ height: `${heightPct}%`, background: barColor }}
                        />
                      </div>
                      <div className="prof-bar-label">W{w.week}</div>
                      {w.rank && <div className="prof-bar-rank">#{w.rank}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pick history */}
          <div className="prof-card prof-card-grow">
            <div className="prof-card-header">
              <div className="prof-card-title">PICK HISTORY</div>
              <div className="prof-card-sub">most recent first</div>
            </div>

            {recentPicks.length === 0 ? (
              <div className="prof-empty">No picks yet</div>
            ) : (
              <div className="prof-pick-list">
                {recentPicks.map((p, i) => {
                  const confPct = p.confidence ? (p.confidence / 16) * 100 : 0;
                  return (
                    <div key={i} className="prof-pick-row">
                      <span className="prof-pick-week">W{p.week}</span>
                      <TeamBadge abbr={p.pickedTeam} size={30} />
                      <div className="prof-pick-info">
                        <div className="prof-pick-matchup">
                          <span className="prof-pick-team">{p.pickedTeam}</span>
                          <span className="prof-pick-opp">vs {p.opponent}</span>
                        </div>
                        <div className="prof-pick-conf-bar">
                          <div
                            className="prof-pick-conf-fill"
                            style={{
                              width: `${confPct}%`,
                              background: p.result === "won" ? "var(--good)" : p.result === "lost" ? "var(--bad)" : "var(--accent)",
                            }}
                          />
                        </div>
                        <span className="prof-pick-conf-num">conf {p.confidence ?? "—"}</span>
                      </div>
                      <div className={`prof-pick-chip ${p.result}`}>
                        {p.result === "won" && `✓ +${p.pointsEarned ?? p.confidence}`}
                        {p.result === "lost" && "✗ LOST"}
                        {p.result === "pending" && "◌ PENDING"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: advanced stats + tendencies */}
        <div className="prof-right">

          {/* Advanced stats */}
          <div className="prof-card">
            <div className="prof-card-header">
              <div className="prof-card-title">ADVANCED</div>
            </div>
            <div className="prof-stats-grid">
              {[
                { k: "ATS RECORD", v: `${correctPicks}-${totalGraded - correctPicks}`, sub: `${winRate}% win rate` },
                { k: "TOTAL POINTS", v: seasonPoints, sub: "season cumulative" },
                { k: "CURRENT RANK", v: rank ? `#${rank}` : "—", sub: `of ${totalPlayers} players` },
                { k: "GRADED PICKS", v: totalGraded, sub: `${correctPicks} correct` },
                { k: "WEEKS PLAYED", v: weekStats.length, sub: "complete weeks" },
                { k: "BEST WEEK", v: weekStats.length > 0 ? Math.max(...weekStats.map((w) => w.correct)) : "—", sub: "correct picks" },
              ].map((s, i) => (
                <div key={i} className="prof-stat-cell">
                  <div className="prof-stat-label">{s.k}</div>
                  <div className="prof-stat-val">{String(s.v)}</div>
                  <div className="prof-stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tendencies */}
          <div className="prof-card prof-card-grow">
            <div className="prof-card-header">
              <div className="prof-card-title">TENDENCIES</div>
              <div className="prof-card-sub">pick frequency · season</div>
            </div>
            <div className="prof-tendencies">

              <div className="prof-tend-col">
                <div className="prof-tend-heading good">■ MOST TRUSTED</div>
                {mostTrusted.length === 0 && <div className="prof-empty" style={{ padding: "12px 0" }}>No data yet</div>}
                {mostTrusted.map((t) => (
                  <div key={t.abbr} className="prof-tend-row">
                    <TeamBadge abbr={t.abbr} size={26} />
                    <div className="prof-tend-info">
                      <div className="prof-tend-name">{NFL_COLORS[t.abbr]?.name ?? t.abbr}</div>
                      <div className="prof-tend-bar-wrap">
                        <div className="prof-tend-bar good" style={{ width: `${Math.round(t.pct * 100)}%` }} />
                      </div>
                    </div>
                    <div className="prof-tend-stat">
                      <div className="prof-tend-frac">{t.wins}/{t.total}</div>
                      <div className="prof-tend-pct good">{Math.round(t.pct * 100)}%</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="prof-tend-divider" />

              <div className="prof-tend-col">
                <div className="prof-tend-heading bad">■ BLIND SPOTS</div>
                {blindSpots.length === 0 && <div className="prof-empty" style={{ padding: "12px 0" }}>No data yet</div>}
                {blindSpots.map((t) => (
                  <div key={t.abbr} className="prof-tend-row">
                    <TeamBadge abbr={t.abbr} size={26} />
                    <div className="prof-tend-info">
                      <div className="prof-tend-name">{NFL_COLORS[t.abbr]?.name ?? t.abbr}</div>
                      <div className="prof-tend-bar-wrap">
                        <div className="prof-tend-bar bad" style={{ width: `${Math.max(Math.round(t.pct * 100), 6)}%` }} />
                      </div>
                    </div>
                    <div className="prof-tend-stat">
                      <div className="prof-tend-frac">{t.wins}/{t.total}</div>
                      <div className="prof-tend-pct bad">{Math.round(t.pct * 100)}%</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* ── Advanced Stats ── */}
      {(() => {
        const showConf  = isConfidenceFormat(scoringType);
        const showAts   = isAtsFormat(scoringType);
        const showTb    = !isPick5Format(scoringType);
        return (
      <div className="prof-adv-section">
          <div className="prof-adv-inner">

            {/* Confidence Calibration — confidence formats only */}
            {showConf && <div className="prof-adv-card prof-adv-full">
              <div className="prof-adv-title">Confidence Calibration</div>
              <div className="prof-adv-sub">Do your locks actually win more? A sharp player shows a rising curve.</div>
              <div className="prof-conf-bars">
                {profileStats.confTiers.map((tier) => {
                  const pct = Math.round(tier.winRate * 100);
                  const hasData = tier.picks > 0;
                  return (
                    <div key={tier.label} className="prof-conf-bar-col">
                      <div className="prof-conf-bar-track">
                        <div
                          className="prof-conf-bar-fill"
                          style={{ height: hasData ? `${Math.max(pct, 4)}%` : "4%", opacity: hasData ? 1 : 0.2 }}
                        />
                        <div className="prof-conf-bar-pct">{hasData ? `${pct}%` : "—"}</div>
                      </div>
                      <div className="prof-conf-bar-label">{tier.label}</div>
                      <div className="prof-conf-bar-range">{tier.range}</div>
                      {hasData && <div className="prof-conf-bar-count">{tier.wins}–{tier.picks - tier.wins}</div>}
                    </div>
                  );
                })}
              </div>
            </div>}

            {/* Favorite vs Underdog + Home vs Away — ATS formats show both; SU shows only home/away */}
            <div className="prof-adv-card">
              {showAts && <>
                <div className="prof-adv-title">Fav vs Dog</div>
                <div className="prof-split-rows">
                  {[
                    { label: "Favorites", stat: profileStats.fav },
                    { label: "Underdogs", stat: profileStats.dog },
                  ].map(({ label, stat }) => (
                    <div key={label} className="prof-split-row">
                      <div className="prof-split-label">{label}</div>
                      <div className="prof-split-bar-wrap">
                        <div className="prof-split-bar" style={{ width: `${stat.picks > 0 ? Math.round(stat.winRate * 100) : 0}%` }} />
                      </div>
                      <div className="prof-split-stat">
                        {stat.picks > 0 ? `${Math.round(stat.winRate * 100)}%` : "—"}
                        <span className="prof-split-count"> ({stat.picks})</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="prof-adv-divider" />
              </>}
              <div className="prof-adv-title" style={{ marginTop: 14 }}>Home vs Away</div>
              <div className="prof-split-rows">
                {[
                  { label: "Home teams", stat: profileStats.home },
                  { label: "Away teams", stat: profileStats.away },
                ].map(({ label, stat }) => (
                  <div key={label} className="prof-split-row">
                    <div className="prof-split-label">{label}</div>
                    <div className="prof-split-bar-wrap">
                      <div className="prof-split-bar" style={{ width: `${stat.picks > 0 ? Math.round(stat.winRate * 100) : 0}%` }} />
                    </div>
                    <div className="prof-split-stat">
                      {stat.picks > 0 ? `${Math.round(stat.winRate * 100)}%` : "—"}
                      <span className="prof-split-count"> ({stat.picks})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Line size — ATS formats only */}
            {showAts && <div className="prof-adv-card">
              <div className="prof-adv-title">Performance by Line Size</div>
              <div className="prof-line-grid">
                {[profileStats.lineShort, profileStats.lineMid, profileStats.lineBig].map((g) => (
                  <div key={g.range} className="prof-line-cell">
                    <div className="prof-line-range">{g.range}</div>
                    <div className="prof-line-pct">{g.picks > 0 ? `${Math.round(g.winRate * 100)}%` : "—"}</div>
                    <div className="prof-line-record">{g.picks > 0 ? `${g.wins}–${g.picks - g.wins}` : "No picks"}</div>
                  </div>
                ))}
              </div>
            </div>}

            {/* Primetime vs Regular + Divisional — all formats */}
            <div className="prof-adv-card">
              <div className="prof-adv-title">Primetime vs Regular</div>
              <div className="prof-split-rows">
                {[
                  { label: "Primetime (THU/SNF/MNF)", stat: profileStats.primetime },
                  { label: "Regular (SUN)", stat: profileStats.regular },
                ].map(({ label, stat }) => (
                  <div key={label} className="prof-split-row">
                    <div className="prof-split-label">{label}</div>
                    <div className="prof-split-bar-wrap">
                      <div className="prof-split-bar" style={{ width: `${stat.picks > 0 ? Math.round(stat.winRate * 100) : 0}%` }} />
                    </div>
                    <div className="prof-split-stat">
                      {stat.picks > 0 ? `${Math.round(stat.winRate * 100)}%` : "—"}
                      <span className="prof-split-count"> ({stat.picks})</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="prof-adv-divider" />
              <div className="prof-adv-title" style={{ marginTop: 14 }}>Divisional Games</div>
              <div className="prof-split-rows">
                {[
                  { label: "Division games", stat: profileStats.divisional },
                  { label: "Non-division", stat: profileStats.nonDivisional },
                ].map(({ label, stat }) => (
                  <div key={label} className="prof-split-row">
                    <div className="prof-split-label">{label}</div>
                    <div className="prof-split-bar-wrap">
                      <div className="prof-split-bar" style={{ width: `${stat.picks > 0 ? Math.round(stat.winRate * 100) : 0}%` }} />
                    </div>
                    <div className="prof-split-stat">
                      {stat.picks > 0 ? `${Math.round(stat.winRate * 100)}%` : "—"}
                      <span className="prof-split-count"> ({stat.picks})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Streaks + MNF */}
            <div className="prof-adv-card">
              <div className="prof-adv-title">Streaks</div>
              <div className="prof-streak-row">
                <div className="prof-streak-item">
                  <div className="prof-streak-val" style={{ color: profileStats.currentStreakType === "W" ? "var(--good)" : profileStats.currentStreakType === "L" ? "var(--bad)" : "var(--ink3)" }}>
                    {profileStats.currentStreak > 0 ? `${profileStats.currentStreak}${profileStats.currentStreakType}` : "—"}
                  </div>
                  <div className="prof-streak-label">Current Streak</div>
                </div>
                <div className="prof-streak-item">
                  <div className="prof-streak-val" style={{ color: "var(--good)" }}>{profileStats.longestWinStreak || "—"}</div>
                  <div className="prof-streak-label">Longest Win Streak</div>
                </div>
              </div>
              {showTb && profileStats.tbCount > 0 && (
                <>
                  <div className="prof-adv-divider" />
                  <div className="prof-adv-title" style={{ marginTop: 14 }}>MNF Tiebreaker</div>
                  <div className="prof-streak-row">
                    <div className="prof-streak-item">
                      <div className="prof-streak-val">{profileStats.tbAvgError != null ? `±${profileStats.tbAvgError.toFixed(1)}` : "—"}</div>
                      <div className="prof-streak-label">Avg error (pts)</div>
                    </div>
                    <div className="prof-streak-item">
                      <div className="prof-streak-val">{profileStats.tbCount}</div>
                      <div className="prof-streak-label">Guesses made</div>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
        );
      })()}

    </div>
  );
}
