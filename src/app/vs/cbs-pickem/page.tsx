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
    body: "CBS Pick'em awards exactly 1 point for every correct pick, no matter how obvious or how much of a gamble. Miss a lock, nail a steal — it evens out over the season. There's no mechanism to separate the players who actually study the lines from the ones picking based on favorite teams. thepickempool uses confidence scoring: assign each game a number from 1 to 16. Your locks get 16. Your coin flips get 1. Every week has 16 picks worth a combined 136 points — the sharp players and the fish sort themselves out fast.",
    quote: {
      text: "CBS is one of the few if not the only platform that still charges for fantasy leagues.",
      source: "r/fantasyfootball — Is CBS the worst fantasy platform?",
      url: "https://www.reddit.com/r/fantasyfootball/comments/pltxgq/is_cbs_the_worst_fantasy_platform/",
    },
    competitorScreenshot: "/vs/images.jpeg",
    competitorAlt: "CBS Sports Pick'em mobile app showing flat pick slip with no confidence scoring and State Farm ad",
    tppScreenshot: "/vs/tpp-confidence.png",
    tppAlt: "thepickempool confidence budget bar showing 1-16 assignment with full budget view",
  },
  {
    title: "CBS Sets the Spreads. You Don't Know How, When, or Why.",
    body: "CBS's official rules state that spreads are set \"at the sponsor's sole discretion\" with no information on sourcing, timing, or update frequency. You're picking against a number CBS decided — not the actual betting market. This isn't a small detail. A spread that's even half a point off market can systematically favor underdogs or favorites week after week. thepickempool pulls every line directly from The Odds API, sourcing from DraftKings, FanDuel, and BetMGM. You see the market. You pick against the market.",
    quote: {
      text: "I must say the new revamp of the CBS Sports Pools and Pool Manager tools is terrible. Took away necessary manager options. Can't even remove players who don't pay from the pool without needing to delete all pool members picks?",
      source: "r/CBSSportsPools, 2024",
      url: "https://www.reddit.com/r/CBSSportsPools/comments/1f91fmm/2024_cbs_sports_app/",
    },
    competitorScreenshot: "/vs/cbs-spreads.png",
    competitorAlt: "CBS Pick'em spreads with no sourcing transparency",
    tppScreenshot: "/vs/tpp-picks-spreads.png",
    tppAlt: "thepickempool picks page showing live market spreads sourced from DraftKings and FanDuel",
  },
  {
    title: "Removing One Non-Payer Deletes the Whole League's Picks",
    body: "This is not a hypothetical. CBS's 2024 redesign introduced a bug — or feature, depending on how you look at it — where removing a non-paying member from your pool deletes every other member's picks along with them. Entire leagues lost weeks of data. Commissioners were left with nothing. thepickempool is built for commissioners. Remove a member, change a setting, edit anything — it affects only what you intend to affect. Individual picks are always preserved.",
    quote: {
      text: "Can't even remove players who don't pay from the pool without needing to delete all pool members picks? The new site has lost so much functionality. CBS is so bad now.",
      source: "r/CBSSportsPools",
      url: "https://www.reddit.com/r/CBSSportsPools/comments/1f91fmm/2024_cbs_sports_app/",
    },
    competitorScreenshot: "/vs/cbs-public.png",
    competitorAlt: "CBS Pick'em interface",
    tppScreenshot: "/vs/tpp-commissioner.png",
    tppAlt: "thepickempool commissioner panel with member management that doesn't affect other users picks",
  },
  {
    title: "The Grid: See Everyone's Picks the Moment Games Kick Off",
    body: "CBS has no equivalent to The Grid. Once games kick off on thepickempool, The Grid unlocks — a full matrix showing every player's pick and confidence for every game that week. Watch the leaderboard shift in real time as Sunday unfolds. See who needs what in the late games. Know where you stand before Monday night. It turns watching NFL Sunday from a solo activity into a live competition with your whole group.",
    competitorScreenshot: "/vs/cbs-picks-view.png",
    competitorAlt: "CBS Pick'em showing no league-wide picks visibility",
    tppScreenshot: "/vs/tpp-grid.png",
    tppAlt: "thepickempool Grid showing all 26 players picks and confidence with live correct wrong indicators",
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
