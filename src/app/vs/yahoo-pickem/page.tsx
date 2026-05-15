import type { Metadata } from "next";
import { VsPage } from "@/components/vs/VsPage";

export const metadata: Metadata = {
  title: "Yahoo Pro Football Pick'em Alternative | thepickempool",
  description: "Tired of Yahoo's stale spreads, Thursday lockouts, and 2005 interface? thepickempool gives your league live ATS spreads, confidence scoring, and real commissioner tools. Free.",
  openGraph: {
    title: "The Better Yahoo Pick'em | thepickempool",
    description: "Live spreads. Kickoff locks. Real commissioner tools. Everything Yahoo gets wrong, we get right.",
    url: "https://thepickempool.com/vs/yahoo-pickem",
    siteName: "thepickempool",
    type: "website",
  },
  alternates: {
    canonical: "https://thepickempool.com/vs/yahoo-pickem",
  },
};

const PAIN_POINTS = [
  {
    title: "Yahoo's Spreads Are Three Days Stale by Sunday",
    body: "Yahoo updates their lines three times during the week — then freezes them. Everything locks Thursday morning, including your Sunday 4:25 games. By the time those kick off, the market has moved. Sharp bettors have already adjusted. You're picking off a line that hasn't budged in three days. thepickempool pulls directly from live market data via The Odds API. Each game locks at its actual kickoff time. Sunday 1pm locks at Sunday 1pm. Monday night locks at Monday night. You always pick against where the market actually is.",
    competitorScreenshot: "/vs/yahoo-spreads.png",
    competitorAlt: "Yahoo Pick'em showing Thursday lock and outdated spreads",
    tppScreenshot: "/vs/tpp-picks-spreads.png",
    tppAlt: "thepickempool picks page showing live market spreads",
  },
  {
    title: "Your League Is a Group of Usernames, Not People",
    body: "Yahoo shows you a leaderboard of display names. Great — now figure out which \"SportsFan1987\" owes you $300. Collecting entry fees, chasing payments, tracking Venmo handles, and knowing who's actually in your league is an annual nightmare. thepickempool's commissioner panel is built for real humans. Every member shows their actual name, email, phone number, and Venmo handle. Payment status is tracked with one click. Paid or unpaid — you always know exactly where things stand.",
    competitorScreenshot: "/vs/yahoo-roster.png",
    competitorAlt: "Yahoo Pick'em roster showing usernames without contact info",
    tppScreenshot: "/vs/tpp-commissioner.png",
    tppAlt: "thepickempool commissioner panel with full member details and payment tracking",
  },
  {
    title: "Confidence Points Make Every Game Matter. Yahoo Has Them. Barely.",
    body: "Yahoo technically supports confidence scoring, but the interface makes it a chore — and there's no way to see the full picture of how your confidence is distributed against what everyone else is doing. thepickempool puts confidence front and center. Assign 1–16 to each game. See your full budget at a glance. The Grid shows every player's picks and confidence the moment games kick off, so you can watch the leaderboard shift in real time. Confidence scoring is the reason this format is addictive — we built everything around it.",
    competitorScreenshot: "/vs/yahoo-confidence.png",
    competitorAlt: "Yahoo Pick'em confidence interface",
    tppScreenshot: "/vs/tpp-grid.png",
    tppAlt: "thepickempool grid view showing all players' picks and confidence",
  },
  {
    title: "The Interface Hasn't Changed Since the Obama Administration",
    body: "Yahoo's pick'em product is a side-feature of a mega-portal. It's buried under news, ads, fantasy sports, and a navigation structure designed in 2009. The mobile app is barely functional — small tap targets, slow loads, and a layout that clearly wasn't designed for a 6-inch screen. thepickempool was built in 2025, for the phone in your pocket right now. The picks page, the grid, the standings — everything works the way you'd expect a modern app to work.",
    competitorScreenshot: "/vs/yahoo-mobile.png",
    competitorAlt: "Yahoo Pick'em mobile experience",
    tppScreenshot: "/vs/tpp-mobile.png",
    tppAlt: "thepickempool mobile-optimized picks page",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Spread source",
    them: { value: "Proprietary, updated 3× per week", good: false },
    tpp: { value: "Live market via The Odds API", good: true },
  },
  {
    feature: "Pick lock time",
    them: { value: "All games lock Thursday morning", good: false },
    tpp: { value: "Each game locks at kickoff", good: true },
  },
  {
    feature: "Confidence scoring",
    them: { value: "Basic — limited interface", good: false },
    tpp: { value: "1–16 per game, full budget view", good: true },
  },
  {
    feature: "The Grid (full picks matrix)",
    them: { value: "Not available", good: false },
    tpp: { value: "Every player's picks, live updates", good: true },
  },
  {
    feature: "Commissioner tools",
    them: { value: "Minimal — no payment tracking", good: false },
    tpp: { value: "Roster, payments, phone, Venmo", good: true },
  },
  {
    feature: "Member contact info",
    them: { value: "Usernames only", good: false },
    tpp: { value: "Name, email, phone, Venmo", good: true },
  },
  {
    feature: "Custom entry fees & prize pools",
    them: { value: "Not supported", good: false },
    tpp: { value: "Full control", good: true },
  },
  {
    feature: "Mobile experience",
    them: { value: "Dated, slow, hard to use", good: false },
    tpp: { value: "Built for mobile-first", good: true },
  },
  {
    feature: "League type",
    them: { value: "ATS picks", good: true },
    tpp: { value: "ATS picks", good: true },
  },
  {
    feature: "Cost",
    them: { value: "Free", good: true },
    tpp: { value: "Free", good: true },
  },
];

export default function YahooVsPage() {
  return (
    <VsPage
      competitor="Yahoo"
      competitorFull="Yahoo Pro Football Pick'em"
      slug="yahoo-pickem"
      heroHeadline={<>Done With Yahoo Pick&apos;em?<br /><span className="vs-headline-accent">You&apos;re Not Alone.</span></>}
      heroSub="Live spreads that move with the market. Games that lock at kickoff, not Thursday. A commissioner panel that actually helps you run a league. Everything Yahoo gets wrong, we get right — and it's free."
      painPoints={PAIN_POINTS}
      comparisonRows={COMPARISON_ROWS}
    />
  );
}
