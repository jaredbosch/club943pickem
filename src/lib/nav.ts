// Single source of truth for the app's primary navigation (DESIGN.md → Navigation).
//
// Four destinations, fixed order, same words on every authenticated screen.
// Nothing here takes per-page input: the tab set never changes shape. Pages
// only influence which tab is *active*, and that is derived from the URL.

export type NavTabId = "picks" | "grid" | "league" | "me";

export type NavTab = {
  id: NavTabId;
  label: string;
  /** Destination for this tab. `code` is null when the user has no league. */
  href: (code: string | null, userId?: string | null) => string;
};

/** Create/join page — where league-scoped tabs go when there is no league. */
export const NO_LEAGUE_HREF = "/league";

export const NAV_TABS: readonly NavTab[] = [
  {
    id: "picks",
    label: "Picks",
    href: (code) => (code ? `/league/${code}/picks` : NO_LEAGUE_HREF),
  },
  {
    id: "grid",
    label: "Grid",
    href: (code) => (code ? `/league/${code}/grid` : NO_LEAGUE_HREF),
  },
  {
    id: "league",
    label: "League",
    href: (code) => (code ? `/league/${code}/dashboard` : NO_LEAGUE_HREF),
  },
  {
    id: "me",
    label: "Me",
    href: (code) => (code ? `/league/${code}/me` : "/home"),
  },
] as const;

const LEAGUE_PATH = /^\/league\/([^/]+)(?:\/([^/]+))?(?:\/([^/]+))?\/?$/;

/**
 * Which tab a path belongs to. Deep pages highlight their parent tab:
 * another player's picks → GRID, your own picks history → ME,
 * Commissioner → LEAGUE, /home and /settings → ME.
 */
export function activeTab(pathname: string, myUserId: string | null | undefined): NavTabId | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/home" || path === "/settings") return "me";

  const m = path.match(LEAGUE_PATH);
  if (!m || !m[2]) return null;
  const section = m[2];
  const sub = m[3];

  switch (section) {
    case "picks":
      if (!sub) return "picks";
      return myUserId && sub === myUserId ? "me" : "grid";
    case "grid":
      return "grid";
    case "dashboard":
    case "commissioner":
      return "league";
    case "me":
      return "me";
    default:
      return null;
  }
}

/**
 * Where the league switcher sends you: the same tab in the other league.
 * Deep pages (someone's picks, Commissioner) fall back to their tab's root.
 */
export function switchLeagueHref(
  pathname: string,
  myUserId: string | null | undefined,
  nextCode: string,
): string {
  const tab = activeTab(pathname, myUserId) ?? "league";
  return NAV_TABS.find((t) => t.id === tab)!.href(nextCode, myUserId);
}
