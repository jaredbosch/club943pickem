import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { invite_code } = (await req.json().catch(() => ({}))) as {
    invite_code?: string;
  };
  if (!invite_code) {
    return NextResponse.json(
      { error: "invite_code is required" },
      { status: 400 },
    );
  }

  const code = invite_code.trim().toUpperCase();
  const supabase = createAdminClient();

  const { data: league, error } = await supabase
    .from("leagues")
    .select("id, max_players, status")
    .eq("invite_code", code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!league) {
    return NextResponse.json({ error: "invalid invite code" }, { status: 404 });
  }
  if (league.status === "completed") {
    return NextResponse.json({ error: "league is closed" }, { status: 400 });
  }

  const { count } = await supabase
    .from("league_members")
    .select("id", { count: "exact", head: true })
    .eq("league_id", league.id);

  if (count !== null && count >= league.max_players) {
    return NextResponse.json({ error: "league is full" }, { status: 400 });
  }

  const { error: joinErr } = await supabase
    .from("league_members")
    .insert({ league_id: league.id, user_id: userId })
    .select("id")
    .single();

  if (joinErr) {
    if (joinErr.code === "23505") {
      return NextResponse.json({ league_id: league.id, already_member: true });
    }
    return NextResponse.json({ error: joinErr.message }, { status: 500 });
  }

  return NextResponse.json({ league_id: league.id });
}
