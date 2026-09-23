"use client";

import Link from "next/link";
import { LeagueSwitcher } from "@/components/nav/LeagueSwitcher";
import { NavTabs } from "@/components/nav/NavTabs";
import { useNav } from "@/components/nav/NavProvider";

type Props = {
  /** Mono eyebrow under the league chip, e.g. "WEEK 8 · CONFIDENCE". Defaults to the nav's own. */
  contextLabel?: string;
  /** Status badges only (SCHEDULE ONLY, save errors). Never actions — Save Picks lives in the sticky bottom bar. */
  extra?: React.ReactNode;
};

/**
 * The one app header (DESIGN.md → Navigation). Everything but the eyebrow and
 * status badges comes from NavProvider, so the header is identical on every
 * screen. Desktop: logo · league chip · four tabs · badges. Mobile: logo +
 * league chip only; the tabs live in the bottom TabBar.
 */
export function AppHeader({ contextLabel, extra }: Props) {
  const nav = useNav();
  const logoHref = nav?.code ? `/league/${nav.code}/dashboard` : "/home";

  return (
    <header className="app-nav">
      <Link href={logoHref} className="app-nav-logo" aria-label="thepickempool — league home">
        <div className="app-nav-badge" aria-hidden>TPP</div>
      </Link>
      <LeagueSwitcher contextLabel={contextLabel} />
      <NavTabs variant="header" />
      <div className="app-nav-spacer" />
      {extra}
    </header>
  );
}
