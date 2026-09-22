import { redirect } from "next/navigation";
import { getLastLeague } from "@/lib/nav-data";

export default async function GridRedirect({
  searchParams,
}: {
  searchParams: { week?: string };
}) {
  const last = await getLastLeague();
  if (last === "signed-out") redirect("/sign-in");
  if (!last) redirect("/league");

  const weekParam = searchParams.week ? `?week=${searchParams.week}` : "";
  redirect(`/league/${last.code}/grid${weekParam}`);
}
