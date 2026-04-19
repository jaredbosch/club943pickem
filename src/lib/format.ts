import { LOCK_LEAD_MS } from "./slots";

export function formatSpread(spreadHome: number | null, side: "home" | "away"): string {
  if (spreadHome === null || spreadHome === undefined) return "—";
  const homeSign = spreadHome > 0 ? "+" : "";
  if (side === "home") return `${homeSign}${spreadHome}`;
  const away = -spreadHome;
  const awaySign = away > 0 ? "+" : "";
  return `${awaySign}${away}`;
}

export function formatCountdown(kickoffMs: number, nowMs: number): string {
  const remaining = kickoffMs - LOCK_LEAD_MS - nowMs;
  if (remaining <= 0) return "locking…";
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  return `locks in ${hours}h ${minutes}m`;
}
