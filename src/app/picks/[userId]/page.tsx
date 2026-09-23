import { redirect } from "next/navigation";
import { getLastLeague } from "@/lib/nav-data";

export default async function PlayerProfileRedirect({
  params,
}: {
  params: { userId: string };
}) {
  const last = await getLastLeague();
  if (last === "signed-out") redirect("/sign-in");
  if (!last) redirect("/league");

  redirect(`/league/${last.code}/picks/${params.userId}`);
}
