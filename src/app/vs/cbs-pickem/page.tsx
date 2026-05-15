import type { Metadata } from "next";
import { VsPage } from "@/components/vs/VsPage";

export const metadata: Metadata = {
  title: "CBS Sports NFL Pick'em Alternative | thepickempool",
  description: "CBS Pick'em gives you 1 point per correct pick with spreads CBS controls. thepickempool gives your private league confidence scoring, live market spreads, and real commissioner tools. Free.",
  openGraph: {
    title: "The Better CBS Pick'em | thepickempool",
    description: "Confidence points. Live market spreads. Private leagues with real commissioner tools. Everything CBS Pick'em isn't.",
    url: "https://thepickempool.com/vs/cbs-pickem",
    siteName: "thepickempool",
    type: "website",
  },
  alternates: {
    canonical: "https://thepickempool.com/vs/cbs-pickem",
  },
};

const PAIN_POINTS = [
  {
    title: "One Point Per Pick Is Not a Strategy. It's a Coin Flip.",
    body: "CBS Pick'em awards exactly 1 point for every correct pick, regardless of how confident you are. Miss a lock, gain a steal — it evens out. There's no way to separate the players who actually study the lines from the ones who pick based on jersey colors. thepickempool uses confidence scoring: you assign each game a number from 1 to 16. Games you're sure about get your highest numbers. Games you're guessing on get your lowest. Every week has 16 picks worth a combined 136 points — the sharp players and the fish sort themselves out fast.",
    competitorScreenshot: "/vs/cbs-scoring.png",
    competitorAlt: "CBS Pick'em showing flat 1-point scoring with no confidence",
    tppScreenshot: "/vs/tpp-confidence.png",
    tppAlt: "thepickempool confidence point assignment interface",
  },
  {
    title: "CBS Sets the Spreads. You Don't Know How, When, or Why.",
    body: "CBS's official rules state that spreads are set \"at the sponsor's sole discretion\" with no information on sourcing, timing, or update frequency. You're picking against a number CBS decided on — not the actual betting market. thepickempool pulls spreads directly from The Odds API, sourcing from DraftKings, FanDuel, BetMGM, and other major sportsbooks. Each game shows the actual market consensus line, updated as the market moves, locking at kickoff.",
    competitorScreenshot: "/vs/cbs-spreads.png",
    competitorAlt: "CBS Pick'em spreads with no sourcing information",
    tppScreenshot: "/vs/tpp-picks-spreads.png",
    tppAlt: "thepickempool showing live market spread sourced from major sportsbooks",
  },
  {
    title: "CBS Pick'em Is CBS's Contest. Not Your League.",
    body: "CBS Pick'em is built as a public nationwide contest with CBS's own prize pools ($1,000/week, $5,000 for the season). Your \"private\" league is a secondary feature in a system designed for a completely different product. There's no commissioner. No payment tracking. No way to manage who owes what or how to reach anyone. thepickempool is built exclusively for private leagues. Commissioner tools, payment tracking, roster management, and custom prize pools are the main event — not an afterthought.",
    competitorScreenshot: "/vs/cbs-public.png",
    competitorAlt: "CBS Pick'em public contest structure",
    tppScreenshot: "/vs/tpp-commissioner.png",
    tppAlt: "thepickempool commissioner panel with payment and roster management",
  },
  {
    title: "The Grid: See Everyone's Picks the Second Games Kick Off",
    body: "CBS has no equivalent to The Grid. Once games kick off on thepickempool, The Grid unlocks — a full matrix of every player's pick and confidence for every game that week. Watch the leaderboard shift in real time as Sunday unfolds. Know exactly what everyone needs to happen in the late games. It turns watching NFL Sunday into an active experience for your whole group.",
    competitorScreenshot: "/vs/cbs-picks-view.png",
    competitorAlt: "CBS Pick'em picks view with no league-wide visibility",
    tppScreenshot: "/vs/tpp-grid.png",
    tppAlt: "thepickempool Grid showing all players' picks with live correct/wrong indicators",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Confidence scoring",
    them: { value: "None — 1 point per correct pick", good: false },
    tpp: { value: "1–16 per game, 136 pts per week", good: true },
  },
  {
    feature: "Spread source",
    them: { value: "CBS proprietary, no transparency", good: false },
    tpp: { value: "Live market via The Odds API", good: true },
  },
  {
    feature: "Pick lock time",
    them: { value: "Individual kickoff", good: true },
    tpp: { value: "Individual kickoff", good: true },
  },
  {
    feature: "Private leagues",
    them: { value: "Secondary — built for CBS's contest", good: false },
    tpp: { value: "Private leagues only", good: true },
  },
  {
    feature: "The Grid (picks matrix)",
    them: { value: "Not available", good: false },
    tpp: { value: "Every player, every pick, live", good: true },
  },
  {
    feature: "Commissioner tools",
    them: { value: "Not available", good: false },
    tpp: { value: "Roster, payments, phone, Venmo", good: true },
  },
  {
    feature: "Custom entry fees & prize pools",
    them: { value: "Not available", good: false },
    tpp: { value: "Full control", good: true },
  },
  {
    feature: "League scoring format",
    them: { value: "ATS only, flat scoring", good: false },
    tpp: { value: "ATS confidence, ATS flat, or straight-up", good: true },
  },
  {
    feature: "Mobile experience",
    them: { value: "Dated CBS Sports app", good: false },
    tpp: { value: "Built mobile-first", good: true },
  },
  {
    feature: "Cost",
    them: { value: "Free", good: true },
    tpp: { value: "Free", good: true },
  },
];

export default function CbsVsPage() {
  return (
    <VsPage
      competitor="CBS"
      competitorFull="CBS Sports Pro Football Pick'em"
      slug="cbs-pickem"
      heroHeadline={<>CBS Pick&apos;em Was Fine in 2008.<br /><span className="vs-headline-accent">It&apos;s 2025.</span></>}
      heroSub="Flat 1-point scoring with no confidence. Spreads CBS controls with no transparency. A system built for CBS's nationwide contest, not your private league. Your crew deserves better — and it's free."
      painPoints={PAIN_POINTS}
      comparisonRows={COMPARISON_ROWS}
    />
  );
}
