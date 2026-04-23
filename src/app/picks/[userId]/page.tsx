import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ReadOnlyPickSheet } from "@/components/pick-sheet/ReadOnlyPickSheet";

export default async function PlayerPicksPage({
  params,
}: {
  params: { userId: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Redirect to own picks page if viewing self
  if (params.userId === user.id) redirect("/picks");

  // Dummy user IDs get a placeholder name
  if (params.userId.startsWith("dummy-")) {
    const dummyNames: Record<string, string> = {
      "dummy-1": "Matty Ice",
      "dummy-2": "Big Ray",
      "dummy-3": "Kayla B",
      "dummy-4": "T-Bone",
      "dummy-5": "Sully",
    };
    return <ReadOnlyPickSheet playerName={dummyNames[params.userId] ?? "Player"} />;
  }

  // Look up the real player's display name
  const { data: profile } = await supabase
    .from("users")
    .select("display_name, email")
    .eq("id", params.userId)
    .maybeSingle();

  if (!profile) redirect("/dashboard");

  const playerName = profile.display_name ?? profile.email?.split("@")[0] ?? "Player";

  return <ReadOnlyPickSheet playerName={playerName} />;
}
