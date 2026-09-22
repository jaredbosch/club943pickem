"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { NavData } from "@/lib/nav-data";

type NavContextValue = NavData & {
  /** Code the league-scoped tabs link to, or null when the user has no league. */
  code: string | null;
  /**
   * Lets the pick sheet report its live unpicked count between server
   * refreshes, so the PICKS badge tracks picks as they're made. Reset
   * whenever the server sends a fresh value.
   */
  setLiveUnpickedCount: (n: number | null) => void;
};

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ value, children }: { value: NavData; children: React.ReactNode }) {
  const [live, setLive] = useState<number | null>(null);

  // A router refresh re-renders the layout with a fresh server count; drop the
  // live override then (but not on mount — child effects run first).
  const serverKey = `${value.current?.code ?? ""}:${value.unpickedCount}`;
  const prevKey = useRef(serverKey);
  useEffect(() => {
    if (prevKey.current !== serverKey) {
      prevKey.current = serverKey;
      setLive(null);
    }
  }, [serverKey]);

  const setLiveUnpickedCount = useCallback((n: number | null) => setLive(n), []);

  const ctx = useMemo<NavContextValue>(() => ({
    ...value,
    code: value.current?.code ?? null,
    unpickedCount: live ?? value.unpickedCount,
    setLiveUnpickedCount,
  }), [value, live, setLiveUnpickedCount]);

  return <NavContext.Provider value={ctx}>{children}</NavContext.Provider>;
}

export function useNav(): NavContextValue | null {
  return useContext(NavContext);
}
