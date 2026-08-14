import type { EspnScoreboard } from "./types";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";

// ESPN abbreviations that differ from ours
const ESPN_ABBR_MAP: Record<string, string> = {
  WAS: "WSH", // Washington sometimes appears as WAS
  JAC: "JAX", // Jacksonville sometimes JAC
};

export function normalizeEspnAbbr(abbr: string): string {
  return ESPN_ABBR_MAP[abbr] ?? abbr;
}

export async function fetchEspnScoreboard(week: number, seasonYear: number): Promise<EspnScoreboard> {
  const url = new URL(BASE);
  url.searchParams.set("seasontype", "2"); // regular season
  url.searchParams.set("week", String(week));
  url.searchParams.set("dates", String(seasonYear));

  // ESPN's CDN 403s minimal/bot user agents from datacenter IPs (seen from
  // Vercel with "thepickempool/1.0"); a browser-style UA gets through.
  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      Referer: "https://www.espn.com/",
    },
  });

  if (!res.ok) throw new Error(`ESPN scoreboard ${res.status}: ${await res.text()}`);
  return res.json() as Promise<EspnScoreboard>;
}
