import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data: payout } = await supabase
    .from("payouts")
    .select("id, league_id, is_distributed")
    .eq("id", params.id)
    .maybeSingle();
  if (!payout) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: commish } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", payout.league_id)
    .eq("user_id", userId)
    .eq("is_commissioner", true)
    .maybeSingle();
  if (!commish) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("payouts")
    .update({ is_distributed: true, status: "distributed" })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
