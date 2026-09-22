"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useNav } from "@/components/nav/NavProvider";
import { switchLeagueHref } from "@/lib/nav";

/**
 * League chip + context eyebrow. Always a dropdown (even with one league) so
 * Create/Join is always reachable. Leagues come from server-provided nav
 * context — no client re-fetch.
 */
export function LeagueSwitcher({ contextLabel }: { contextLabel?: string | null }) {
  const nav = useNav();
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Close on outside pointerdown; Esc closes and returns focus to the chip
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!nav) return null;
  const current = nav.current;
  const eyebrow = contextLabel ?? nav.contextLabel;

  return (
    <div className="ls-wrap" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`ls-trigger${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={menuId}
      >
        <span className="ls-trigger-name">
          <span className="ls-trigger-text">{current ? current.name : "No league"}</span>
          <span className="ls-chevron" aria-hidden>▾</span>
        </span>
        {eyebrow && <span className="app-nav-context">{eyebrow}</span>}
      </button>

      <div id={menuId} className="ls-dropdown" hidden={!open}>
        {nav.leagues.length > 0 && (
          <>
            <div className="ls-dropdown-label">Switch league</div>
            <ul className="ls-list">
              {nav.leagues.map((l) => {
                const isCurrent = l.code === current?.code;
                return (
                  <li key={l.code}>
                    <Link
                      href={switchLeagueHref(pathname, nav.userId, l.code)}
                      className={`ls-item${isCurrent ? " current" : ""}`}
                      aria-current={isCurrent ? "true" : undefined}
                      onClick={() => setOpen(false)}
                    >
                      <span className="ls-item-name">{l.name}</span>
                      <span className="ls-item-year">{l.season_year}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        <ul className="ls-list ls-actions">
          <li>
            <Link href="/league" className="ls-action" onClick={() => setOpen(false)}>
              + Create or join a league
            </Link>
          </li>
          <li>
            <Link href="/home" className="ls-action" onClick={() => setOpen(false)}>
              All leagues
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
