import { AppShell } from "@/components/nav/AppShell";

// Persists across tab navigations within a league. Membership is still
// enforced by each page (non-members are redirected to /league there); a
// non-member simply gets nav data pointing at their own last league.
export default function LeagueLayout({
  params,
  children,
}: {
  params: { code: string };
  children: React.ReactNode;
}) {
  return <AppShell leagueCode={params.code.toUpperCase()}>{children}</AppShell>;
}
