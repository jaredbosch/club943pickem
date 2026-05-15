import type { Metadata } from "next";
import { VsPage } from "@/components/vs/VsPage";

export const metadata: Metadata = {
  title: "ESPN Pigskin Pick'em Alternative | thepickempool",
  description: "ESPN's pick'em UX is so bad someone built a Chrome extension to fix it. Forced video ads, no commissioner tools, and a cluttered mega-portal experience. thepickempool is the private league alternative. Free.",
  openGraph: {
    title: "The Better ESPN Pigskin Pick'em | thepickempool",
    description: "Confidence scoring that works. No forced video ads. Real commissioner tools. The private league ESPN never built.",
    url: "https://thepickempool.com/vs/espn-pickem",
    siteName: "thepickempool",
    type: "website",
  },
  alternates: {
    canonical: "https://thepickempool.com/vs/espn-pickem",
  },
};

const PAIN_POINTS = [
  {
    title: "The UX Is So Bad Someone Built a Browser Extension to Fix It",
    body: "ESPN Pigskin Pick'em's drag-and-drop confidence interface on desktop is genuinely unusable — slow to respond, easy to misclick, and prone to resetting. A third-party developer got frustrated enough to build and publish a Chrome extension specifically to fix the pick-submission experience. That's not a minor complaint. That's the community telling ESPN their product is broken and waiting for a fix that never came. thepickempool's confidence interface was designed for the way you actually pick games: tap a number, see it lock, move on. No drag targets. No accidental resets.",
    quote: {
      text: "For anyone who plays the Pigskin Pick'em league in ESPN on desktop, they know that the UX is lacking when it comes to changing your picks.",
      source: "r/Fantasy_Football — ESPN Pigskin Pick'em drag-and-drop extension",
      url: "https://www.reddit.com/r/Fantasy_Football/comments/1n8hbt4/i_made_an_espn_pigskin_pickem_drag_and_drop/",
    },
    competitorScreenshot: "/vs/espn-desktop.png",
    competitorAlt: "ESPN Pigskin Pick'em desktop interface showing the broken drag-and-drop confidence UI",
    tppScreenshot: "/vs/tpp-confidence.png",
    tppAlt: "thepickempool confidence assignment — tap a number to lock it, full budget visible at a glance",
  },
  {
    title: "Forced Video Ads Before You Can Make Your Picks",
    body: "ESPN monetizes their pick'em product by forcing video ads into the flow of making picks. Users have documented specific tricks — minimizing the player, fast-forwarding, timing the bypass — just to submit their weekly selections. You shouldn't need a workaround to use a product you signed up for. thepickempool shows no ads in the picks flow. The picks page is the picks page. No pre-rolls, no interstitials, nothing to bypass.",
    quote: {
      text: "Drag the video down to the corner of your screen to minimize the video and maneuver the background apps, it'll let you fast forward through the ads in 15 seconds.",
      source: "r/fantasyfootball — Bypassing ESPN Fantasy Football Video Ads",
      url: "https://www.reddit.com/r/fantasyfootball/comments/rc3iiu/bypassing_espn_fantasy_football_video_ads/",
    },
    competitorScreenshot: "/vs/espn-ads.png",
    competitorAlt: "ESPN Pick'em showing forced video advertisement before picks can be submitted",
    tppScreenshot: "/vs/tpp-picks-clean.png",
    tppAlt: "thepickempool clean picks page with no ads or interruptions",
  },
  {
    title: "It's ESPN's Contest. Your Private League Is an Afterthought.",
    body: "ESPN Pigskin Pick'em is built around ESPN's own public $100,000 prize contest. Your private group league — the one you actually care about — is a secondary feature in a product designed to generate ESPN+ sign-ups, ad views, and app opens. There's no real commissioner panel. No payment tracking. No way to manage your group's roster or know who owes what. thepickempool has no public contest. It's built entirely for private leagues. Commissioner tools are the main feature, not something bolted on after the ad revenue dashboard.",
    quote: {
      text: "Its become very cluttered, they're trying to force the pigskin pick and college pick em leagues down your throat, the waiver order is almost impossible to find.",
      source: "r/fantasyfootball — The new ESPN app is garbage",
      url: "https://www.reddit.com/r/fantasyfootball/comments/503ttz/the_new_espn_app_is_garbage/",
    },
    competitorScreenshot: "/vs/espn-cluttered.png",
    competitorAlt: "ESPN app showing cluttered interface with college pickem, ESPN+ promotions, and other content alongside NFL picks",
    tppScreenshot: "/vs/tpp-commissioner.png",
    tppAlt: "thepickempool commissioner panel showing full private league management with roster, payment tracking, and contact info",
  },
  {
    title: "Picks Marked Wrong. No Audit Trail. No Accountability.",
    body: "ESPN has a documented, recurring history of incorrectly grading picks — marking correct selections as wrong and vice versa. When it happens, there's no pick history, no timestamp log, and no way to prove what you submitted. ESPN's answer is usually silence. thepickempool uses The Odds API for real-time scoring with a clear ATS determination based on the actual final score versus the posted spread. Every pick is stored with its game, confidence, and result. The Grid shows exactly how every game graded after the fact. No mystery.",
    quote: {
      text: "Is anyone else getting incorrectly marked with an X instead of a checkmark on games they picked correctly? I know of 2 games in week 3 counted incorrectly.",
      source: "r/fantasyfootball — Problems with ESPN Pigskin Pick'em",
      url: "https://www.reddit.com/r/fantasyfootball/comments/2hrl6y/problems_with_espn_pigskin_pickem/",
    },
    competitorScreenshot: "/vs/espn-scoring.png",
    competitorAlt: "ESPN Pick'em showing incorrectly graded picks with no audit trail",
    tppScreenshot: "/vs/tpp-grid.png",
    tppAlt: "thepickempool Grid showing transparent pick grading with correct and incorrect clearly marked per game and player",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Desktop UX",
    them: { value: "Broken drag-and-drop — users built extensions to fix it", good: false },
    tpp: { value: "Tap to assign confidence, instant lock", good: true },
  },
  {
    feature: "Video ads in pick flow",
    them: { value: "Forced before picks — users document bypass tricks", good: false },
    tpp: { value: "None — ever", good: true },
  },
  {
    feature: "Confidence scoring",
    them: { value: "Available but painful to use", good: false },
    tpp: { value: "1–16 per game, full budget view, built around it", good: true },
  },
  {
    feature: "Spread source",
    them: { value: "ESPN proprietary", good: false },
    tpp: { value: "Live market via The Odds API (DraftKings, FanDuel)", good: true },
  },
  {
    feature: "Commissioner tools",
    them: { value: "Minimal — no payment tracking", good: false },
    tpp: { value: "Roster, payments, phone, Venmo", good: true },
  },
  {
    feature: "Pick accuracy / audit trail",
    them: { value: "Documented grading bugs, no timestamp log", good: false },
    tpp: { value: "Transparent ATS scoring, full pick history", good: true },
  },
  {
    feature: "The Grid (picks matrix)",
    them: { value: "No league-wide picks view", good: false },
    tpp: { value: "Every player, every pick, live after kickoff", good: true },
  },
  {
    feature: "Private league focus",
    them: { value: "ESPN's $100K public contest is the main product", good: false },
    tpp: { value: "Private leagues only — no public contest", good: true },
  },
  {
    feature: "Mobile experience",
    them: { value: "Cluttered — ESPN+ promos, college content, ads", good: false },
    tpp: { value: "Pick'em only, built mobile-first", good: true },
  },
  {
    feature: "Cost",
    them: { value: "Free", good: true },
    tpp: { value: "Free", good: true },
  },
];

export default function EspnVsPage() {
  return (
    <VsPage
      competitor="ESPN"
      competitorFull="ESPN Pigskin Pick'em"
      slug="espn-pickem"
      heroHeadline={<>ESPN Built a Pick&apos;em Product.<br /><span className="vs-headline-accent">Someone Built an Extension to Fix It.</span></>}
      heroSub="A drag-and-drop confidence interface that doesn't work. Forced video ads before your picks. No commissioner tools. Buried inside a mega-portal that wants you to subscribe to ESPN+. Your group deserves better — and it's free."
      painPoints={PAIN_POINTS}
      comparisonRows={COMPARISON_ROWS}
    />
  );
}
