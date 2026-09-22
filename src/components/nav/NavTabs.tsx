"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_TABS, activeTab } from "@/lib/nav";
import { useNav } from "@/components/nav/NavProvider";

/**
 * The four primary tabs. `variant="header"` renders the desktop text links
 * inside AppHeader; `variant="bar"` renders the fixed mobile bottom bar.
 * CSS shows exactly one of them per breakpoint.
 */
export function NavTabs({ variant }: { variant: "header" | "bar" }) {
  const nav = useNav();
  const pathname = usePathname() ?? "";
  if (!nav) return null;

  const active = activeTab(pathname, nav.userId);
  const showBadge = nav.unpickedCount > 0;

  return (
    <nav aria-label="Primary" className={variant === "bar" ? "tabbar" : "app-tabs"}>
      {NAV_TABS.map((t) => {
        const isActive = t.id === active;
        const badge = t.id === "picks" && showBadge ? nav.unpickedCount : null;
        return (
          <Link
            key={t.id}
            href={t.href(nav.code, nav.userId)}
            className={`${variant === "bar" ? "tabbar-tab" : "app-tab"}${isActive ? " active" : ""}`}
            aria-current={isActive ? "page" : undefined}
            aria-label={badge ? `${t.label}, ${badge} unpicked` : undefined}
          >
            <span>{t.label}</span>
            {badge !== null && <span className="nav-badge" aria-hidden>{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile bottom tab bar plus an in-flow spacer so page content clears it. */
export function TabBar() {
  const nav = useNav();
  if (!nav) return null;
  return (
    <>
      <div className="tabbar-spacer" aria-hidden />
      <NavTabs variant="bar" />
    </>
  );
}
