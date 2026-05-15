import Link from "next/link";

type Partner = "draftkings" | "fanduel";

type Props = {
  partner: Partner;
  placement?: "sidebar" | "inline" | "post-picks";
};

const PARTNERS = {
  draftkings: {
    name: "DraftKings",
    url: process.env.NEXT_PUBLIC_AFFILIATE_DRAFTKINGS_URL ?? "https://draftkings.com",
    cta: "Bet on DraftKings",
    tagline: "Bet the same games you just picked.",
    color: "#1b5e3b",
    textColor: "#fff",
  },
  fanduel: {
    name: "FanDuel",
    url: process.env.NEXT_PUBLIC_AFFILIATE_FANDUEL_URL ?? "https://fanduel.com",
    cta: "Bet on FanDuel",
    tagline: "Put real money behind your picks.",
    color: "#1153a5",
    textColor: "#fff",
  },
};

// Renders an affiliate link banner. No-ops if the affiliate URL env var is not set.
export function AffiliateBanner({ partner, placement = "sidebar" }: Props) {
  const p = PARTNERS[partner];
  const urlEnvKey = partner === "draftkings"
    ? process.env.NEXT_PUBLIC_AFFILIATE_DRAFTKINGS_URL
    : process.env.NEXT_PUBLIC_AFFILIATE_FANDUEL_URL;

  if (!urlEnvKey) return null;

  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`affiliate-banner affiliate-banner-${placement}`}
      style={{ background: p.color, color: p.textColor }}
      aria-label={`${p.cta} — affiliate link`}
    >
      <div className="affiliate-banner-tag">AD · Affiliate</div>
      <div className="affiliate-banner-name">{p.name}</div>
      <div className="affiliate-banner-tagline">{p.tagline}</div>
      <div className="affiliate-banner-cta">{p.cta} →</div>
    </a>
  );
}
