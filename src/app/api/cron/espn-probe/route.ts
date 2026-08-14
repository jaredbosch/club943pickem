import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// TEMPORARY diagnostic: which ESPN hosts are reachable from Vercel's egress
// IPs? site.api.espn.com 403s (Akamai bot filter); these are the candidates.
// Remove once a working host is chosen.
const CANDIDATES: Record<string, string> = {
  site_api: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
  site_web_api: "https://site.web.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
  cdn_core: "https://cdn.espn.com/core/nfl/scoreboard?xhr=1",
  sports_core: "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events?limit=5",
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  for (const [name, url] of Object.entries(CANDIDATES)) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "User-Agent": UA, Accept: "application/json, text/plain, */*" },
      });
      const body = await res.text();
      results[name] = {
        status: res.status,
        looksJson: body.trimStart().startsWith("{"),
        bytes: body.length,
      };
    } catch (err) {
      results[name] = { error: err instanceof Error ? err.message : String(err) };
    }
  }
  return NextResponse.json(results);
}
