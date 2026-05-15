import type { Metadata } from "next";
import { VsPage } from "@/components/vs/VsPage";

export const metadata: Metadata = {
  title: "RunYourPool Alternative — Modern NFL Pick'em | thepickempool",
  description: "RunYourPool runs on ColdFusion-era technology with a design to match. thepickempool gives your private league live ATS spreads, confidence scoring, The Grid, and real commissioner tools — built in 2025.",
  openGraph: {
    title: "The Modern RunYourPool Alternative | thepickempool",
    description: "Live spreads. Confidence scoring. A picks matrix that updates in real time. Everything RunYourPool supports, built for how people actually use their phones in 2025.",
    url: "https://thepickempool.com/vs/runyourpool",
    siteName: "thepickempool",
    type: "website",
  },
  alternates: { canonical: "https://thepickempool.com/vs/runyourpool" },
};

const PAIN_POINTS = [
  {
    title: "Built on Technology From 2002. The Interface Shows It.",
    body: "RunYourPool's URL ends in `.cfm` — that's ColdFusion, a web framework that peaked in the early 2000s. The interface reflects that history: functional tables, text-heavy layouts, and a design that hasn't fundamentally changed in over a decade. It works. It's just not 2025. thepickempool was built from scratch in 2025, specifically for NFL pick'em. The picks page, The Grid, the commissioner panel, and the mobile experience are all designed with the way people actually use their phones today — not the way they used their desktop browsers when the Patriots were winning Super Bowls.",
    quote: {
      text: "Most of the other platforms that have an app and are easy to use cost approx $200 for 200 entries — like RunYourPool or Gridiron Games.",
      source: "r/fantasyfootball — Survivor Pool Platform",
      url: "https://www.reddit.com/r/fantasyfootball/comments/1m6pidi/survivor_pool_platform/",
    },
    competitorScreenshot: "/vs/ryp-interface.png",
    competitorAlt: "RunYourPool NFL pick'em interface showing dated, text-heavy layout",
    tppScreenshot: "/vs/tpp-picks-spreads.png",
    tppAlt: "thepickempool picks page — modern interface with live spreads and clean game rows",
  },
  {
    title: "Jack of All Formats, Optimized for None",
    body: "RunYourPool supports straight picks, ATS picks, confidence pools, survivor, squares, bracket pools, and more. That breadth is their pitch — one platform for every office pool type. The tradeoff is that each format gets a fraction of the product attention it deserves. The ATS confidence pick'em experience is supported but not specialized. thepickempool does one thing: ATS confidence pick'em for private leagues. The confidence assignment, The Grid, the live spread sourcing, and the commissioner tools are all built with one format in mind. When you specialize, you build it right.",
    competitorScreenshot: "/vs/ryp-formats.png",
    competitorAlt: "RunYourPool showing multiple pool formats competing for interface space",
    tppScreenshot: "/vs/tpp-confidence.png",
    tppAlt: "thepickempool confidence budget bar — the entire product is built around this format",
  },
  {
    title: "Live Market Spreads vs. Platform-Managed Lines",
    body: "RunYourPool manages their own spreads rather than sourcing from the live betting market. The lines are functional, but there's no transparency into when they update, how they compare to the actual market, or how much they've moved since you last checked. For a pool where every half-point matters, picking against a stale number is a real disadvantage. thepickempool sources every line directly from The Odds API — pulling from DraftKings, FanDuel, and BetMGM in real time. Each game shows the market consensus, updates throughout the week, and locks at actual kickoff.",
    competitorScreenshot: "/vs/ryp-spreads.png",
    competitorAlt: "RunYourPool picks showing platform-managed spreads without market sourcing transparency",
    tppScreenshot: "/vs/tpp-picks-spreads.png",
    tppAlt: "thepickempool showing live ATS spreads sourced from major sportsbooks",
  },
  {
    title: "The Grid: The Feature RunYourPool Doesn't Have",
    body: "After games kick off, thepickempool's Grid unlocks — a full matrix of every player's pick and confidence for every game that week. Green for correct, red for wrong, live as the scores come in. Watch the leaderboard shift in real time. Know exactly who needs what to happen in the late window. RunYourPool shows you standings and pick reports after the fact — but it doesn't give your whole group a shared live view of Sunday unfolding. The Grid is what turns pick'em from a Monday morning email into a Sunday event.",
    competitorScreenshot: "/vs/ryp-standings.png",
    competitorAlt: "RunYourPool standings page showing final results table without live picks visibility",
    tppScreenshot: "/vs/tpp-grid.png",
    tppAlt: "thepickempool Grid showing all players' picks and confidence with live correct/wrong indicators",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Design / tech stack",
    them: { value: "ColdFusion-era, unchanged for 20+ years", good: false },
    tpp: { value: "Built in 2025, mobile-first", good: true },
  },
  {
    feature: "ATS confidence scoring",
    them: { value: "Supported (one of many formats)", good: true },
    tpp: { value: "Core format — built around it", good: true },
  },
  {
    feature: "Spread source",
    them: { value: "Platform-managed lines", good: false },
    tpp: { value: "Live market via The Odds API", good: true },
  },
  {
    feature: "The Grid (picks matrix)",
    them: { value: "Not available", good: false },
    tpp: { value: "Full live picks matrix after kickoff", good: true },
  },
  {
    feature: "Commissioner tools",
    them: { value: "Good — RunYourPool's strength", good: true },
    tpp: { value: "Roster, payments, phone, Venmo", good: true },
  },
  {
    feature: "Entry cap",
    them: { value: "Capped — pricing becomes prohibitive", good: false },
    tpp: { value: "No cap", good: true },
  },
  {
    feature: "Playoff pick'em",
    them: { value: "Supported", good: true },
    tpp: { value: "Supported", good: true },
  },
  {
    feature: "Multiple formats",
    them: { value: "Straight, ATS, survivor, squares, more", good: true },
    tpp: { value: "ATS confidence, ATS flat, straight-up", good: true },
  },
];

export default function RunYourPoolVsPage() {
  return (
    <VsPage
      competitor="RunYourPool"
      competitorFull="RunYourPool NFL Pick'em"
      slug="runyourpool"
      heroHeadline={<>RunYourPool Has Been Around<br /><span className="vs-headline-accent">Since ColdFusion Was Cool.</span></>}
      heroSub="Functional pick'em software built on 2002-era technology with a design to match. RunYourPool does the job — but it doesn't do it in 2025. thepickempool gives your private league live market spreads, confidence scoring, The Grid, and a mobile experience built for the phone you're already holding."
      painPoints={PAIN_POINTS}
      comparisonRows={COMPARISON_ROWS}
    />
  );
}
