import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { is_paid } = (await req.json().catch(() => ({}))) as { is_paid?: boolean };
  if (typeof is_paid !== "boolean") {
    return NextResponse.json({ error: "is_paid required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Confirm membership record exists and caller is commissioner of that league.
  const { data: member } = await supabase
    .from("league_members")
    .select("id, league_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: commish } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", member.league_id)
    .eq("user_id", userId)
    .eq("is_commissioner", true)
    .maybeSingle();
  if (!commish) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { error } = await supabase
    .from("league_members")
    .update({
      is_paid,
      paid_at: is_paid ? new Date().toISOString() : null,
    })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
