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
    body: "Look at the columns in that screenshot: Monday spread, Tuesday spread, Wednesday spread, Final. Three updates all week — then frozen. Everything locks Thursday morning, including your Sunday 4:25 and Monday night games. By kickoff, sharp money has already moved the real market. You're picking off a number that hasn't budged in three days. thepickempool pulls spreads directly from The Odds API — sourced from DraftKings, FanDuel, and BetMGM — and each game locks at its actual kickoff. Sunday 1pm games lock Sunday at 1pm.",
    quote: {
      text: "I used it last year and biggest complaint was that spreads set on Tuesday didn't change throughout the week.",
      source: "r/fantasyfootball",
      url: "https://www.reddit.com/r/fantasyfootball/comments/paatr7/nfl_pickem_app_for_office_pool/",
    },
    competitorScreenshot: "/vs/Screenshot-2020-10-01-at-9.32.28-PM.png",
    competitorAlt: "Yahoo Pick'em picks page showing Mon/Tue/Wed/Final spread columns proving spreads only update 3x per week",
    tppScreenshot: "/vs/tpp-picks-spreads.png",
    tppAlt: "thepickempool picks page showing live market spreads from DraftKings and FanDuel",
  },
  {
    title: "Your League Is a Group of Usernames, Not People",
    body: "Yahoo gives you a leaderboard of display names and a week number. Figure out which \"HoustonFan_88\" owes you $300. Collecting entry fees, chasing payments, knowing who's in and who isn't — all of it happens in a group chat because Yahoo doesn't help. thepickempool's commissioner panel has every member's actual name, email, phone number, and Venmo handle. One click marks them paid. You always know exactly where the money stands.",
    quote: {
      text: "For the past ten years a portion of the payout would go to the winner of league pick'em… Thanks yahoo for removing something that we found highly entertaining and replaced it with your own bullshit app.",
      source: "r/FFCommish",
      url: "https://www.reddit.com/r/FFCommish/comments/1f8xe1q/yahoo_removes_in_league_pickem/",
    },
    competitorScreenshot: "/vs/77M3ppk.png",
    competitorAlt: "Yahoo Pro Pick'em group picks view showing cluttered table with usernames and no contact information",
    tppScreenshot: "/vs/tpp-commissioner.png",
    tppAlt: "thepickempool commissioner panel showing full member roster with names, emails, phone numbers, Venmo handles, and payment status",
  },
  {
    title: "Confidence Points Make Every Game Matter. Yahoo Has Them. Barely.",
    body: "Yahoo technically supports confidence scoring, but the interface buries it and gives you no visibility into the full picture — no way to see your whole budget at a glance, no league-wide view of who put what on which game. thepickempool puts confidence front and center. Assign 1–16 to each game. The confidence bar shows your full 136-point budget in real time. The Grid shows every player's picks and confidence the moment games kick off, so you can watch the leaderboard shift in real time on Sunday.",
    quote: {
      text: "There seems to be a setting which was checked off in error. It's greyed out in my commissioner settings. Could really use some help.",
      source: "r/YahooFantasy — Zero way to edit Pick'em league as Commissioner",
      url: "https://www.reddit.com/r/YahooFantasy/comments/pnm7kd/zero_way_to_edit_pick_ems_league_as_commissioner/",
    },
    competitorScreenshot: "/vs/yahoo-confidence.png",
    competitorAlt: "Yahoo Pick'em confidence interface",
    tppScreenshot: "/vs/tpp-grid.png",
    tppAlt: "thepickempool Grid showing all players picks and confidence points with live correct/wrong indicators",
  },
  {
    title: "The App Yahoo Shipped Is Not the App They're Maintaining",
    body: "Yahoo's pick'em is a side feature in a mega-portal built for a different era. The mobile app freezes, crashes, and has a layout that clearly wasn't designed for a 6-inch screen. And when things break — pick deadlines locked incorrectly, in-league pick'em suddenly removed, features paywalled — Yahoo's answer is a help article. thepickempool was built in 2025 for how people actually use their phones: fast, clean, and it works.",
    quote: {
      text: "The yahoo fantasy app is constantly freezing and crashing. This has been an issue all season so far. I've cleared the cache.",
      source: "r/YahooFantasy weekly tech support thread",
      url: "https://www.reddit.com/r/YahooFantasy/comments/1m5fw5m/tech_support_general_questions_weekly_thread/",
    },
    competitorScreenshot: "/vs/yahoo-mobile.png",
    competitorAlt: "Yahoo Fantasy app mobile experience",
    tppScreenshot: "/vs/tpp-mobile.png",
    tppAlt: "thepickempool mobile picks page on iPhone",
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
