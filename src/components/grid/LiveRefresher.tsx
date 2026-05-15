"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Refreshes server component data every 90s when there are live games.
// Dropped into WeeklyGrid as a zero-UI client island.
export function LiveRefresher({ hasLiveGames }: { hasLiveGames: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!hasLiveGames) return;
    const id = setInterval(() => router.refresh(), 90_000);
    return () => clearInterval(id);
  }, [hasLiveGames, router]);

  if (!hasLiveGames) return null;

  return (
    <div className="live-indicator">
      <span className="pp-live-dot" />
      LIVE · updating every 90s
    </div>
  );
}
