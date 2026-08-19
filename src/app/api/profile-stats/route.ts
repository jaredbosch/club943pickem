import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeProfileStats } from "@/lib/profile-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/profile-stats?league=<uuid>&season=<year>[&user=<uuid>]
 *
 * Calibration and tendency stats for the iOS Me screen.
 *
 * This is a route handler rather than an RPC on purpose: computeProfileStats
 * already exists in TypeScript and is what the web profile page renders.
 * Porting it to SQL would create a second definition of the same statistics
 * that could drift from the first, which is the problem the endpoint exists
 * to avoid.
 *
 * Auth is the Supabase access token in the Authorization header. Membership is
 * checked for both the caller and the subject before any pick data is read.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  const leagueId = request.nextUrl.searchParams.get("league");
  const seasonRaw = request.nextUrl.searchParams.get("season");
  const season = seasonRaw ? parseInt(seasonRaw, 10) : NaN;

  if (!leagueId || Number.isNaN(season)) {
    return NextResponse.json(
      { error: "league and season are required" },
      { status: 400 },
    );
  }

  // Verify the token against Supabase before trusting any identity claim.
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: { user }, error: authError } = await anon.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const subjectId = request.nextUrl.searchParams.get("user") ?? user.id;

  // Service role from here on, because the subject's unlocked picks are hidden
  // from the caller by picks_select_own_or_locked_leaguemate. The two
  // membership checks below are what replaces that policy.
  const admin = createAdminClient();

  const { data: members, error: memberError } = await admin
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId)
    .in("user_id", [user.id, subjectId]);

  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const memberIds = new Set((members ?? []).map((m) => m.user_id));
  if (!memberIds.has(user.id)) {
    return NextResponse.json({ error: "Not a member of this league" }, { status: 403 });
  }
  if (!memberIds.has(subjectId)) {
    return NextResponse.json({ error: "Subject is not a member of this league" }, { status: 404 });
  }

  const [picksRes, gamesRes, tbRes] = await Promise.all([
    admin
      .from("picks")
      .select("game_id, picked_team, confidence, is_correct, points_earned, week")
      .eq("user_id", subjectId)
      .eq("league_id", leagueId)
      .eq("season_year", season),
    admin
      .from("games")
      .select("id, home_team, away_team, spread_home, time_slot, week")
      .eq("season_year", season),
    admin
      .from("tiebreaker_guesses")
      .select("guess, actual_total")
      .eq("user_id", subjectId)
      .eq("league_id", leagueId)
      .eq("season_year", season),
  ]);

  const failure = picksRes.error ?? gamesRes.error ?? tbRes.error;
  if (failure) {
    return NextResponse.json({ error: failure.message }, { status: 500 });
  }

  const stats = computeProfileStats(
    picksRes.data ?? [],
    gamesRes.data ?? [],
    tbRes.data ?? [],
  );

  return NextResponse.json({
    userId: subjectId,
    leagueId,
    season,
    ...stats,
  });
}
