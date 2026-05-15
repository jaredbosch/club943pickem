"use client";

import { useEffect } from "react";

type AdFormat = "auto" | "rectangle" | "horizontal" | "vertical";

type Props = {
  slot: string;
  format?: AdFormat;
  className?: string;
};

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

// Renders a Google AdSense ad unit. No-ops if NEXT_PUBLIC_ADSENSE_PUBLISHER_ID is not set.
export function AdUnit({ slot, format = "auto", className }: Props) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  useEffect(() => {
    if (!publisherId) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense not loaded yet
    }
  }, [publisherId]);

  if (!publisherId) return null;

  return (
    <div className={className} style={{ overflow: "hidden", textAlign: "center" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={publisherId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
