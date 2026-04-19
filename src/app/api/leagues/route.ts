import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteCode } from "@/lib/invite-code";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    season_year?: number;
    entry_fee_cents?: number;
    max_players?: number;
    weekly_pool_pct?: number;
    season_pool_pct?: number;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Retry a few times on invite-code collisions.
  let league: { id: string; invite_code: string } | null = null;
  let lastError: string | null = null;
  for (let i = 0; i < 5; i++) {
    const invite_code = generateInviteCode();
    const { data, error } = await supabase
      .from("leagues")
      .insert({
        name,
        invite_code,
        commissioner_id: userId,
        season_year: body.season_year ?? new Date().getFullYear(),
        entry_fee_cents: body.entry_fee_cents ?? 30000,
        max_players: body.max_players ?? 50,
        weekly_pool_pct: body.weekly_pool_pct ?? 36.0,
        season_pool_pct: body.season_pool_pct ?? 64.0,
      })
      .select("id, invite_code")
      .single();
    if (!error) {
      league = data;
      break;
    }
    lastError = error.message;
    if (!error.message.toLowerCase().includes("invite_code")) break;
  }

  if (!league) {
    return NextResponse.json({ error: lastError ?? "failed" }, { status: 500 });
  }

  // Auto-add commissioner as paid member.
  const { error: memErr } = await supabase.from("league_members").insert({
    league_id: league.id,
    user_id: userId,
    is_commissioner: true,
    is_paid: true,
    paid_at: new Date().toISOString(),
  });
  if (memErr) {
    return NextResponse.json({ error: memErr.message }, { status: 500 });
  }

  return NextResponse.json(league, { status: 201 });
}
