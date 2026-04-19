import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data: member } = await supabase
    .from("league_members")
    .select("id")
    .eq("league_id", params.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const week = url.searchParams.get("week");
  const targetWeek = week ? parseInt(week, 10) : 0; // 0 = season

  const { data, error } = await supabase
    .from("standings")
    .select(
      "user_id, total_points, correct_picks, rank, users:user_id(display_name, avatar_url)",
    )
    .eq("league_id", params.id)
    .eq("week", targetWeek)
    .order("rank", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ week: targetWeek, standings: data });
}
