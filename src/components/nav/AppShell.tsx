import { getNavData } from "@/lib/nav-data";
import { NavProvider } from "@/components/nav/NavProvider";
import { TabBar } from "@/components/nav/NavTabs";

/**
 * Server wrapper for every authenticated app screen: resolves nav data once,
 * provides it to AppHeader/TabBar via context, and renders the mobile tab bar.
 * Signed-out requests render the children untouched (pages redirect).
 */
export async function AppShell({
  leagueCode,
  children,
}: {
  leagueCode: string | null;
  children: React.ReactNode;
}) {
  const nav = await getNavData(leagueCode);
  if (!nav) return <>{children}</>;
  return (
    <NavProvider value={nav}>
      {children}
      <TabBar />
    </NavProvider>
  );
}
