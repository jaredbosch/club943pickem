import { NextResponse } from "next/server";
import { authorizeCron } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchOdds, medianHomeSpread } from "@/lib/odds-api";
import { classifySlot } from "@/lib/slots";
import { nflWeekFor } from "@/lib/nfl-week";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily job: pull the current odds board and upsert into `games`.
 * Spreads on already-locked games are left alone.
 */
export async function GET(req: Request) {
  const unauth = authorizeCron(req);
  if (unauth) return unauth;

  const games = await fetchOdds();
  const supabase = createAdminClient();

  // Existing rows so we can avoid clobbering spreads on locked/final games.
  const externalIds = games.map((g) => g.id);
  const { data: existing } = await supabase
    .from("games")
    .select("external_id, status")
    .in("external_id", externalIds);

  const statusByExt = new Map(
    (existing ?? []).map((r) => [r.external_id as string, r.status as string]),
  );

  const inserts: Record<string, unknown>[] = [];

  for (const g of games) {
    const kickoff = new Date(g.commence_time);
    const { season_year, week } = nflWeekFor(kickoff);
    const row = {
      external_id: g.id,
      week,
      season_year,
      home_team: g.home_team,
      away_team: g.away_team,
      kickoff_time: kickoff.toISOString(),
      time_slot: classifySlot(kickoff),
      spread_home: medianHomeSpread(g),
    };

    const prev = statusByExt.get(g.id);
    if (!prev) {
      inserts.push(row);
    } else if (prev === "scheduled") {
      // Update everything, spreads can still move.
      inserts.push(row);
    } else {
      // Game is locked/in_progress/final — leave row alone.
      continue;
    }
  }

  if (inserts.length > 0) {
    const { error } = await supabase
      .from("games")
      .upsert(inserts, { onConflict: "external_id", ignoreDuplicates: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    synced: inserts.length,
    skipped_locked: games.length - inserts.length,
  });
}
