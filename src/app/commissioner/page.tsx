import { redirect } from "next/navigation";
import { getLastLeague } from "@/lib/nav-data";

export default async function CommissionerRedirect() {
  const last = await getLastLeague();
  if (last === "signed-out") redirect("/sign-in");
  if (!last) redirect("/league");

  if (!last.isCommissioner) redirect(`/league/${last.code}/dashboard`);

  redirect(`/league/${last.code}/commissioner`);
}
