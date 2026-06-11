"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LeagueSwitcher } from "@/components/nav/LeagueSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SignOutButton } from "@/components/ui/SignOutButton";

type Props = {
  leagueCode?: string;
  leagueName?: string;
  /** Mono eyebrow under the league name, e.g. "WEEK 8 · CONFIDENCE" */
  contextLabel?: string;
  /** For the My Profile menu link */
  currentUserId?: string;
  /** Page-specific primary action (e.g. Make Picks →). Save Picks never goes here — it lives in the sticky bottom bar. */
  action?: React.ReactNode;
  /** Status badges (SCHEDULE ONLY, save errors) */
  extra?: React.ReactNode;
  /** Shows the Commissioner menu item */
  isCommissioner?: boolean;
};

export function AppHeader({ leagueCode, leagueName, contextLabel, currentUserId, action, extra, isCommissioner }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className="app-nav">
      <Link href={leagueCode ? `/league/${leagueCode}/dashboard` : "/"} className="app-nav-logo">
        <div className="app-nav-badge">TPP</div>
        <span className="app-nav-name">thepickempool</span>
      </Link>
      {leagueCode && leagueName && (
        <div className="app-nav-league">
          <LeagueSwitcher currentLeagueCode={leagueCode} currentLeagueName={leagueName} />
          {contextLabel && <div className="app-nav-context">{contextLabel}</div>}
        </div>
      )}
      <div className="app-nav-spacer" />
      {extra}
      {action}
      {leagueCode && (
        <Link
          href={`/league/${leagueCode}/grid`}
          className="app-icon-btn"
          title="The Grid"
          aria-label="The Grid"
        >
          ▦
        </Link>
      )}
      <div className="app-menu-wrap" ref={ref}>
        <button
          type="button"
          className="app-icon-btn"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={open}
        >
          ⋯
        </button>
        {open && (
          <div className="app-menu">
            {leagueCode && (
              <Link className="app-menu-item" href={`/league/${leagueCode}/dashboard`} onClick={close}>
                Standings
              </Link>
            )}
            {leagueCode && (
              <Link className="app-menu-item" href={`/league/${leagueCode}/picks`} onClick={close}>
                Make Picks
              </Link>
            )}
            {leagueCode && currentUserId && (
              <Link className="app-menu-item" href={`/league/${leagueCode}/picks/${currentUserId}`} onClick={close}>
                My Profile
              </Link>
            )}
            <Link className="app-menu-item" href="/settings" onClick={close}>
              Settings
            </Link>
            {leagueCode && isCommissioner && (
              <Link className="app-menu-item" href={`/league/${leagueCode}/commissioner`} onClick={close}>
                ⚙ Commissioner
              </Link>
            )}
            <div className="app-menu-divider" />
            <div className="app-menu-row">
              <span>Theme</span>
              <ThemeToggle />
            </div>
            <div className="app-menu-row">
              <SignOutButton />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
