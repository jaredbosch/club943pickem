import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";

export default async function Home() {
  const userId = await getUserId();
  redirect(userId ? "/leagues" : "/sign-in");
}
