import { redirect } from "next/navigation";
import { getLastLeague } from "@/lib/nav-data";

export default async function DashboardRedirect() {
  const last = await getLastLeague();
  if (last === "signed-out") redirect("/sign-in");
  if (!last) redirect("/league");

  redirect(`/league/${last.code}/dashboard`);
}
