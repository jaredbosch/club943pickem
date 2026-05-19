"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type LeagueEntry = {
  id: string;
  name: string;
  invite_code: string;
  season_year: number;
};

type Props = {
  currentLeagueCode: string;
  currentLeagueName: string;
};

export function LeagueSwitcher({ currentLeagueCode, currentLeagueName }: Props) {
  const [open, setOpen] = useState(false);
  const [leagues, setLeagues] = useState<LeagueEntry[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("league_members")
        .select("leagues(id, name, invite_code, season_year)")
        .eq("user_id", user.id)
        .then(({ data }) => {
          const entries = (data ?? [])
            .map((m) => m.leagues as unknown as LeagueEntry)
            .filter(Boolean);
          setLeagues(entries);
        });
    });
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const otherLeagues = leagues.filter((l) => l.invite_code !== currentLeagueCode);

  // Single league — just show the name chip, no dropdown
  if (otherLeagues.length === 0) {
    return <span className="pp-chip solid">{currentLeagueName}</span>;
  }

  return (
    <div className="ls-wrap" ref={ref}>
      <button
        type="button"
        className={`ls-trigger pp-chip solid${open ? " open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {currentLeagueName}
        <span className="ls-chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="ls-dropdown" role="listbox">
          <div className="ls-dropdown-label">Switch League</div>
          {otherLeagues.map((l) => (
            <Link
              key={l.id}
              href={`/league/${l.invite_code}/dashboard`}
              className="ls-item"
              onClick={() => setOpen(false)}
            >
              <span className="ls-item-name">{l.name}</span>
              <span className="ls-item-year">{l.season_year}</span>
            </Link>
          ))}
          <Link href="/home" className="ls-all" onClick={() => setOpen(false)}>
            All leagues →
          </Link>
        </div>
      )}
    </div>
  );
}
