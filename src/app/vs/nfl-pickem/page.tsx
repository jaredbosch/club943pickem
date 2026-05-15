import type { Metadata } from "next";
import { VsPage } from "@/components/vs/VsPage";

export const metadata: Metadata = {
  title: "NFL.com Pick'em Challenge Alternative | thepickempool",
  description: "NFL.com's Pick'em Challenge freezes spreads on Tuesday and calls it a week. No confidence scoring, no commissioner tools, and now migrating to ESPN's backend. thepickempool is the private league upgrade. Free.",
  openGraph: {
    title: "The Better NFL.com Pick'em | thepickempool",
    description: "Live spreads. Confidence scoring. Real private leagues. Everything NFL.com Pick'em isn't.",
    url: "https://thepickempool.com/vs/nfl-pickem",
    siteName: "thepickempool",
    type: "website",
  },
  alternates: { canonical: "https://thepickempool.com/vs/nfl-pickem" },
};

const PAIN_POINTS = [
  {
    title: "Spreads Posted Tuesday. Frozen Until Sunday. That's Your Line.",
    body: "NFL.com sets their challenge spreads early in the week and doesn't touch them again. By the time Sunday rolls around, injuries have been announced, weather has shifted, and the betting market has moved — but your pick is still against Tuesday's number. A line that opened at -3 might be -6.5 by kickoff. You'd never know. thepickempool pulls live spreads from The Odds API throughout the week, sourcing from DraftKings, FanDuel, and BetMGM. Each game's spread reflects the actual market at the time you pick — and locks at kickoff.",
    quote: {
      text: "I used it last year and biggest complaint was that spreads set on Tuesday didn't change throughout the week.",
      source: "r/fantasyfootball — NFL Pickem App for Office Pool",
      url: "https://www.reddit.com/r/fantasyfootball/comments/paatr7/nfl_pickem_app_for_office_pool/",
    },
    competitorScreenshot: "/vs/nfl-spreads.png",
    competitorAlt: "NFL.com Pick'em Challenge showing static spreads that don't update throughout the week",
    tppScreenshot: "/vs/tpp-picks-spreads.png",
    tppAlt: "thepickempool picks page showing live market spreads from DraftKings and FanDuel",
  },
  {
    title: "Straight Picks Only. No Confidence. No Skill Gap.",
    body: "NFL.com Pick'em Challenge is pick-the-winner, 1 point per correct pick. No confidence scoring, no ATS nuance — just pick a team and hope. In a pool without skill differentiation, the winner is whoever gets lucky on the most coin-flip games. Over a full season, the leaderboard looks like a random number generator. thepickempool's confidence scoring adds a layer of real decision-making: 16 unique values to distribute across 16 games. The players who study the lines and pick their spots earn it. The ones who pick blind get exposed by Thanksgiving.",
    competitorScreenshot: "/vs/nfl-picks.png",
    competitorAlt: "NFL.com Pick'em showing straight picks with no confidence scoring",
    tppScreenshot: "/vs/tpp-confidence.png",
    tppAlt: "thepickempool confidence assignment showing 1–16 budget with full distribution view",
  },
  {
    title: "The NFL Handed Their Product to ESPN. Now No One Knows What They Have.",
    body: "NFL.com has been migrating fantasy and pick'em infrastructure to ESPN's backend, creating confusion for commissioners who built their leagues on NFL.com. Features disappear, league history doesn't transfer cleanly, and the long-term direction is unclear. Your commissioner shouldn't have to worry about whether their league exists next August. thepickempool is a focused, independent platform. Your league data is yours, it stays consistent year over year, and we're not going to hand it to a sports media conglomerate mid-season.",
    competitorScreenshot: "/vs/nfl-migration.png",
    competitorAlt: "NFL.com platform migration notice affecting existing pick'em leagues",
    tppScreenshot: "/vs/tpp-dashboard.png",
    tppAlt: "thepickempool dashboard showing stable private league standings with full season history",
  },
  {
    title: "No Commissioner Tools. No Payment Tracking. No League Management.",
    body: "NFL.com's challenge is a public competition product that happens to offer private groups as a feature. There's no payment tracking, no way to manage who's in and who owes money, no contact info for members, and no tools to handle the real work of running an office pool. thepickempool's commissioner panel exists specifically to solve these problems: real names, emails, phone numbers, Venmo handles, and paid/unpaid status tracked per member. The Grid shows every player's picks and confidence after kickoff so Sunday stops being a mystery.",
    competitorScreenshot: "/vs/nfl-roster.png",
    competitorAlt: "NFL.com Pick'em group page showing minimal member management with no commissioner tools",
    tppScreenshot: "/vs/tpp-commissioner.png",
    tppAlt: "thepickempool commissioner panel with full member roster, payment tracking, and contact information",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Spread updates",
    them: { value: "Set Tuesday, frozen for the week", good: false },
    tpp: { value: "Live market, locks at kickoff", good: true },
  },
  {
    feature: "Scoring format",
    them: { value: "Straight picks — 1 pt per correct", good: false },
    tpp: { value: "ATS confidence 1–16, ATS flat, or straight-up", good: true },
  },
  {
    feature: "Platform stability",
    them: { value: "Migrating to ESPN backend — unclear future", good: false },
    tpp: { value: "Independent, focused on pick'em only", good: true },
  },
  {
    feature: "Commissioner tools",
    them: { value: "Not available", good: false },
    tpp: { value: "Roster, payments, phone, Venmo", good: true },
  },
  {
    feature: "The Grid (picks matrix)",
    them: { value: "Not available", good: false },
    tpp: { value: "Every player, every pick, live after kickoff", good: true },
  },
  {
    feature: "Custom prize pools",
    them: { value: "Not available", good: false },
    tpp: { value: "Full commissioner control", good: true },
  },
  {
    feature: "Pick lock time",
    them: { value: "Individual kickoff", good: true },
    tpp: { value: "Individual kickoff", good: true },
  },
  {
    feature: "Cost",
    them: { value: "Free", good: true },
    tpp: { value: "Free", good: true },
  },
];

export default function NflVsPage() {
  return (
    <VsPage
      competitor="NFL.com"
      competitorFull="NFL.com Pick'em Challenge"
      slug="nfl-pickem"
      heroHeadline={<>NFL.com Pick&apos;em:<br /><span className="vs-headline-accent">The League That Makes the Rules<br />Can&apos;t Update a Spread.</span></>}
      heroSub="Spreads frozen from Tuesday. Straight picks with no confidence scoring. Platform migrating to ESPN's backend. The NFL makes the greatest product in sports — their pick'em challenge isn't it. thepickempool is. Free."
      painPoints={PAIN_POINTS}
      comparisonRows={COMPARISON_ROWS}
    />
  );
}
