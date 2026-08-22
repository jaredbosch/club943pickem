import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "NFL Pick'em Pool with Live Spreads & Confidence Scoring | thepickempool",
  description:
    "Run a private NFL pick'em pool with live ATS spreads, confidence point scoring, and real commissioner tools. Six formats, free to start, no ads. Set up your league in 30 seconds.",
  alternates: { canonical: "https://thepickempool.com" },
  openGraph: {
    title: "NFL Pick'em Pool with Live Spreads & Confidence Scoring | thepickempool",
    description:
      "Private NFL pick'em pools with live ATS spreads, confidence scoring, and real commissioner tools. Six formats. Free.",
    url: "https://thepickempool.com",
    siteName: "thepickempool",
    type: "website",
    images: [{ url: "https://thepickempool.com/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NFL Pick'em Pool with Live Spreads & Confidence Scoring | thepickempool",
    description:
      "Private NFL pick'em pools with live ATS spreads, confidence scoring, and real commissioner tools. Six formats. Free.",
    images: ["https://thepickempool.com/og-image.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://thepickempool.com/#organization",
      name: "thepickempool",
      url: "https://thepickempool.com",
      logo: "https://thepickempool.com/tpp-logo.svg",
      description:
        "Independent, free platform for private NFL pick'em pools with confidence scoring, live ATS spreads, and commissioner tools.",
      email: "admin@thepickempool.com",
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "admin@thepickempool.com",
          url: "https://thepickempool.com/support",
          availableLanguage: "English",
        },
      ],
      sameAs: ["https://x.com/thepickempool"],
    },
    {
      "@type": "WebSite",
      "@id": "https://thepickempool.com/#website",
      url: "https://thepickempool.com",
      name: "thepickempool",
      publisher: { "@id": "https://thepickempool.com/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://thepickempool.com/#app",
      name: "thepickempool",
      url: "https://thepickempool.com",
      description:
        "Run a private NFL pick'em pool with live ATS spreads, confidence point scoring, and real commissioner tools. Six formats, free to start, no ads.",
      applicationCategory: "SportsApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      publisher: { "@id": "https://thepickempool.com/#organization" },
      featureList:
        "Live ATS spreads, confidence scoring, six pool formats, commissioner payment tracking, real-time picks grid, player analytics",
    },
  ],
};

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Two separate queries — nested joins can silently return null
    const { data: memberships } = await supabase
      .from("league_members")
      .select("league_id")
      .eq("user_id", user.id);

    const leagueIds = (memberships ?? []).map((m) => m.league_id).filter(Boolean);

    if (leagueIds.length === 0) redirect("/league");

    const { data: leagueRows } = await supabase
      .from("leagues")
      .select("invite_code")
      .in("id", leagueIds);

    const codes = (leagueRows ?? []).map((l) => l.invite_code).filter(Boolean);

    if (codes.length === 0) redirect("/league");
    if (codes.length === 1) redirect(`/league/${codes[0]}/dashboard`);
    redirect("/home");
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPage />
    </>
  );
}
