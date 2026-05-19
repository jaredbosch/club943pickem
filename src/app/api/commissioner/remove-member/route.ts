import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { leagueId, memberId } = await request.json();
  if (!leagueId || !memberId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Verify the requester is the commissioner of this league
  const { data: membership } = await supabase
    .from("league_members")
    .select("is_commissioner")
    .eq("league_id", leagueId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.is_commissioner) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Prevent removing yourself
  const { data: targetMember } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("id", memberId)
    .eq("league_id", leagueId)
    .maybeSingle();

  if (!targetMember) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (targetMember.user_id === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  // Delete via admin client (bypasses RLS)
  const admin = createAdminClient();
  const { error } = await admin
    .from("league_members")
    .delete()
    .eq("id", memberId)
    .eq("league_id", leagueId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
