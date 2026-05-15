import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CommissionerRedirect() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: membership } = await supabase
    .from("league_members")
    .select("is_commissioner, leagues(invite_code)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/league");

  const code = (membership.leagues as unknown as { invite_code: string } | null)?.invite_code;
  if (!code) redirect("/league");

  if (!membership.is_commissioner) redirect(`/league/${code}/dashboard`);

  redirect(`/league/${code}/commissioner`);
}
