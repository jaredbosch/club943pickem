import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { league_id, week, predicted_total } = (await req
    .json()
    .catch(() => ({}))) as {
    league_id?: string;
    week?: number;
    predicted_total?: number;
  };

  if (
    !league_id ||
    typeof week !== "number" ||
    typeof predicted_total !== "number" ||
    predicted_total < 0 ||
    predicted_total > 200
  ) {
    return NextResponse.json(
      { error: "league_id, week, predicted_total required" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("mnf_tiebreakers")
    .select("id, is_locked")
    .eq("user_id", userId)
    .eq("league_id", league_id)
    .eq("week", week)
    .maybeSingle();

  if (existing?.is_locked) {
    return NextResponse.json({ error: "tiebreaker locked" }, { status: 400 });
  }

  const { error } = await supabase.from("mnf_tiebreakers").upsert(
    {
      user_id: userId,
      league_id,
      week,
      predicted_total,
      is_locked: false,
    },
    { onConflict: "user_id,league_id,week" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
