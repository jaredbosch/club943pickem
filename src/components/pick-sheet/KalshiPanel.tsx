"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Game } from "./types";
import { teamColor } from "@/lib/nfl-colors";
import { appTeamAbbr, kalshiMarketUrl, kalshiTeamCode } from "@/lib/kalshi/client";
import type { KalshiGamePanelData } from "@/lib/kalshi/types";

type Props = {
  game: Game;
  onClose: () => void;
};

const CHART_W = 292;
const CHART_H = 96;
const PAD = { top: 8, right: 8, bottom: 16, left: 30 };

function fmtDay(ts: number): string {
  return new Date(ts * 1000)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })
    .toUpperCase();
}

// Parse "−3.5" / "+3.5" / "PK" back to the home-spread number.
function homeSpreadNumber(spread: string): number | null {
  if (spread === "PK") return 0;
  const n = parseFloat(spread);
  return Number.isNaN(n) ? null : n;
}

export function KalshiPanel({ game, onClose }: Props) {
  const [data, setData] = useState<KalshiGamePanelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<{ x: number; ts: number; prob: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const homeCode = kalshiTeamCode(game.home.abbr);

  useEffect(() => {
    if (!game.kalshiTicker) return;
    const ctrl = new AbortController();
    fetch(`/api/kalshi/game/${game.kalshiTicker}?home=${homeCode}`, {
      signal: ctrl.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`market data unavailable (${res.status})`);
        setData((await res.json()) as KalshiGamePanelData);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : String(err));
      });
    return () => ctrl.abort();
  }, [game.kalshiTicker, homeCode]);

  // Close on Escape, like the confidence picker.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const homeProb = data?.home.prob ?? game.kalshiProb ?? null;
  const homeFav = homeProb !== null && homeProb >= 0.5;
  const favAbbr = homeFav ? game.home.abbr : game.away.abbr;
  const favColor = teamColor(favAbbr);

  // The graph tracks the current favorite so the line reads "chance the
  // favorite wins" — one series, one identity, no mid-series flips.
  const series = useMemo(() => {
    const points = (data?.history ?? []).map((p) => ({
      ts: p.ts,
      prob: homeFav ? p.homeProb : 1 - p.homeProb,
    }));
    if (points.length < 2) return null;
    const probs = points.map((p) => p.prob);
    const lo = Math.max(0, Math.min(...probs) - 0.03);
    const hi = Math.min(1, Math.max(...probs) + 0.03);
    const t0 = points[0].ts;
    const t1 = points[points.length - 1].ts;
    const x = (ts: number) =>
      PAD.left + ((ts - t0) / Math.max(1, t1 - t0)) * (CHART_W - PAD.left - PAD.right);
    const y = (p: number) =>
      PAD.top + (1 - (p - lo) / Math.max(0.0001, hi - lo)) * (CHART_H - PAD.top - PAD.bottom);
    return { points, lo, hi, t0, t1, x, y };
  }, [data, homeFav]);

  // ATS at our line: map the book spread onto Kalshi's half-point strike
  // ladder. Integer lines average the two neighboring strikes.
  const ats = useMemo(() => {
    if (!data?.spread.length) return null;
    const s = homeSpreadNumber(game.home.spread);
    if (s === null || s === 0) return null;
    const favIsHome = s < 0;
    const favTeamAbbr = favIsHome ? game.home.abbr : game.away.abbr;
    const dogAbbr = favIsHome ? game.away.abbr : game.home.abbr;
    const line = Math.abs(s);
    const strikes = data.spread.filter(
      (k) => appTeamAbbr(k.team) === favTeamAbbr,
    );
    const at = (pts: number) => strikes.find((k) => k.overPoints === pts)?.prob;
    let prob: number | undefined;
    if (Math.round(line * 2) % 2 === 1) {
      prob = at(line);
    } else {
      const below = at(line - 0.5);
      const above = at(line + 0.5);
      prob =
        below !== undefined && above !== undefined
          ? (below + above) / 2
          : below ?? above;
    }
    if (prob === undefined) return null;
    return { favAbbr: favTeamAbbr, dogAbbr, line, favProb: prob };
  }, [data, game.home.spread, game.home.abbr, game.away.abbr]);

  function onChartMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!series || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * CHART_W;
    let best = series.points[0];
    for (const p of series.points) {
      if (Math.abs(series.x(p.ts) - px) < Math.abs(series.x(best.ts) - px)) best = p;
    }
    setHover({ x: series.x(best.ts), ts: best.ts, prob: best.prob });
  }

  const referral = process.env.NEXT_PUBLIC_KALSHI_REFERRAL_CODE;

  return createPortal(
    <>
      <div className="pp-kalshi-backdrop" onClick={onClose} />
      <div className="pp-kalshi-panel" role="dialog" aria-label={`Kalshi market — ${game.away.abbr} at ${game.home.abbr}`}>
        <div className="pp-kalshi-head">
          <span className="pp-kalshi-title">
            {game.away.abbr} @ {game.home.abbr} · Market
          </span>
          <button type="button" className="pp-kalshi-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Current win probabilities */}
        <div className="pp-kalshi-probs">
          {([
            [game.away.abbr, homeProb !== null ? 1 - homeProb : null],
            [game.home.abbr, homeProb],
          ] as const).map(([abbr, prob]) => (
            <div key={abbr} className={`pp-kalshi-prob${prob !== null && prob >= 0.5 ? " fav" : ""}`}>
              <span className="pp-kalshi-dot" style={{ background: teamColor(abbr) }} />
              <span className="pp-kalshi-prob-team">{abbr}</span>
              <span className="pp-kalshi-prob-num">
                {prob !== null ? `${Math.round(prob * 100)}%` : "—"}
              </span>
            </div>
          ))}
        </div>

        {/* Win-probability history, last 7 days */}
        {series ? (
          <div className="pp-kalshi-chart-wrap">
            <div className="pp-kalshi-section">{favAbbr} WIN % · 7 DAYS</div>
            <svg
              ref={svgRef}
              className="pp-kalshi-chart"
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              onMouseMove={onChartMove}
              onMouseLeave={() => setHover(null)}
            >
              {[series.lo, (series.lo + series.hi) / 2, series.hi].map((p, i) => (
                <g key={i}>
                  <line
                    x1={PAD.left} x2={CHART_W - PAD.right}
                    y1={series.y(p)} y2={series.y(p)}
                    className="pp-kalshi-grid"
                  />
                  <text x={PAD.left - 4} y={series.y(p) + 3} className="pp-kalshi-tick" textAnchor="end">
                    {Math.round(p * 100)}
                  </text>
                </g>
              ))}
              <text x={PAD.left} y={CHART_H - 4} className="pp-kalshi-tick">{fmtDay(series.t0)}</text>
              <text x={CHART_W - PAD.right} y={CHART_H - 4} className="pp-kalshi-tick" textAnchor="end">{fmtDay(series.t1)}</text>
              <polyline
                fill="none"
                stroke={favColor}
                strokeWidth="2"
                strokeLinejoin="round"
                points={series.points.map((p) => `${series.x(p.ts)},${series.y(p.prob)}`).join(" ")}
              />
              <circle
                cx={series.x(series.points[series.points.length - 1].ts)}
                cy={series.y(series.points[series.points.length - 1].prob)}
                r="3"
                fill={favColor}
                stroke="var(--bg2)"
                strokeWidth="2"
              />
              {hover && (
                <line x1={hover.x} x2={hover.x} y1={PAD.top} y2={CHART_H - PAD.bottom} className="pp-kalshi-crosshair" />
              )}
            </svg>
            {hover && (
              <div className="pp-kalshi-tooltip" style={{ left: `${(hover.x / CHART_W) * 100}%` }}>
                {Math.round(hover.prob * 100)}% · {fmtDay(hover.ts)}
              </div>
            )}
          </div>
        ) : (
          <div className="pp-kalshi-empty">{error ?? (data ? "No price history yet" : "Loading market…")}</div>
        )}

        {/* Spread market at our line */}
        {ats && (
          <div className="pp-kalshi-ats">
            <div className="pp-kalshi-section">AGAINST THE SPREAD · KALSHI</div>
            <div className="pp-kalshi-ats-rows">
              <div className="pp-kalshi-ats-row">
                <span className="pp-kalshi-dot" style={{ background: teamColor(ats.favAbbr) }} />
                <span className="pp-kalshi-ats-team">{ats.favAbbr} −{ats.line}</span>
                <span className="pp-kalshi-ats-num">{Math.round(ats.favProb * 100)}%</span>
              </div>
              <div className="pp-kalshi-ats-row">
                <span className="pp-kalshi-dot" style={{ background: teamColor(ats.dogAbbr) }} />
                <span className="pp-kalshi-ats-team">{ats.dogAbbr} +{ats.line}</span>
                <span className="pp-kalshi-ats-num">{100 - Math.round(ats.favProb * 100)}%</span>
              </div>
            </div>
          </div>
        )}

        <div className="pp-kalshi-foot">
          <span className="pp-kalshi-attrib">market data via Kalshi</span>
          {game.kalshiTicker && (
            <a
              className="pp-kalshi-link"
              href={kalshiMarketUrl(game.kalshiTicker, referral)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Trade on Kalshi ↗
            </a>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
