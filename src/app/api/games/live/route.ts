import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lightweight live-score feed for the grid. Scores are public data and the
// payload is identical for every viewer, so the response is CDN-cached: all
// open grid tabs share one function execution per cache window instead of
// each re-rendering the full server component on a timer. The pinger only
// refreshes scores every ~2 min, so a 45s window loses nothing.
const CACHE_HEADER = "public, s-maxage=45, stale-while-revalidate=120";

export type LiveGamePayload = {
  id: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  period: number | null;
  displayClock: string | null;
  updatedAt: string;
};

export async function GET(request: NextRequest) {
  const season = Number(request.nextUrl.searchParams.get("season"));
  const week = Number(request.nextUrl.searchParams.get("week"));
  if (!Number.isInteger(season) || season < 2020 || season > 2100 || !Number.isInteger(week) || week < 1 || week > 22) {
    return NextResponse.json({ error: "bad season/week" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("games")
    .select("id, status, home_score, away_score, period, display_clock, updated_at")
    .eq("season_year", season)
    .eq("week", week);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }

  const games: LiveGamePayload[] = (data ?? []).map((g) => ({
    id: g.id,
    status: g.status,
    homeScore: g.home_score ?? null,
    awayScore: g.away_score ?? null,
    period: g.period ?? null,
    displayClock: g.display_clock ?? null,
    updatedAt: g.updated_at,
  }));

  return NextResponse.json({ games }, { headers: { "Cache-Control": CACHE_HEADER } });
}
