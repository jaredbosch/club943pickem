import type { Metadata } from "next";
import { VsPage } from "@/components/vs/VsPage";

export const metadata: Metadata = {
  title: "Sleeper NFL Pick'em Pools Alternative | thepickempool",
  description: "Sleeper launched pick'em pools in 2024 and is still missing confidence scoring, playoff pick'em, real tiebreakers, and a usable desktop. thepickempool has all of it. Free.",
  openGraph: {
    title: "The Pick'em Pools Sleeper Can't Build | thepickempool",
    description: "Confidence scoring. Playoff pick'em. A desktop that works. Everything Sleeper's pick'em pools promised and hasn't delivered.",
    url: "https://thepickempool.com/vs/sleeper-pickem",
    siteName: "thepickempool",
    type: "website",
  },
  alternates: { canonical: "https://thepickempool.com/vs/sleeper-pickem" },
};

const PAIN_POINTS = [
  {
    title: "Sleeper Has No Confidence Scoring. A Year After Launch.",
    body: "Sleeper launched NFL Pick'em Pools in 2024 with flat 1-point scoring. One year later, there's still no confidence pool format. If you want to assign different point values to different games based on how sure you are, Sleeper isn't the product. Their roadmap has more pressing priorities — their core business is fantasy sports, not pick'em. thepickempool was built from the ground up specifically for ATS confidence pools. Confidence scoring isn't a feature request in our backlog; it's what the entire product is designed around.",
    quote: {
      text: "NFL Pick'em: could you make the weekly tiebreakers count towards the whole season so that one winner for a pool could be determined?",
      source: "r/SleeperApp — Sleeper App Suggestions",
      url: "https://www.reddit.com/r/SleeperApp/comments/1q5nbzs/sleeper_app_suggestions/",
    },
    competitorScreenshot: "/vs/sleeper-scoring.png",
    competitorAlt: "Sleeper Pick'em Pools showing flat 1-point scoring with no confidence assignment",
    tppScreenshot: "/vs/tpp-confidence.png",
    tppAlt: "thepickempool confidence budget bar showing 1–16 assignment with full distribution view",
  },
  {
    title: "No Playoff Pick'em. No Season Finish Line.",
    body: "Sleeper's pick'em pools cover the regular season — and then stop. There's no playoff bracket, no playoff confidence pool, no way to run the most exciting eight weeks of NFL football through the same platform your league used all season. Commissioners have to either stop the pool or find another platform for the postseason. thepickempool covers the full season including playoffs. The same league, the same commissioner panel, the same Grid — from Week 1 through the Super Bowl.",
    quote: {
      text: "For pickem pool please let us pick the playoffs as well!",
      source: "r/SleeperApp — Sleeper App Suggestions",
      url: "https://www.reddit.com/r/SleeperApp/comments/1q5nbzs/sleeper_app_suggestions/",
    },
    competitorScreenshot: "/vs/sleeper-playoffs.png",
    competitorAlt: "Sleeper Pick'em showing regular season only with no playoff pick'em support",
    tppScreenshot: "/vs/tpp-dashboard.png",
    tppAlt: "thepickempool dashboard showing full season standings including playoffs",
  },
  {
    title: "The Desktop Is 'Borderline Unusable.' Their Words.",
    body: "Sleeper is a mobile-first fantasy app. Their desktop experience for pick'em is an afterthought — users describe it as \"borderline unusable\" and compare it to early-2000s web design. If half your league does picks on a laptop, they're working with a broken experience. thepickempool was designed for both. The picks page, The Grid, the commissioner panel, and the dashboard all work on any screen size — phone, tablet, or desktop — with the same layout and the same functionality.",
    quote: {
      text: "The desktop version is borderline unusable. It's like it was made in the early 2000s. The app is better but the UI is too busy.",
      source: "r/DynastyFF — Sleeper App Feedback 2025",
      url: "https://www.reddit.com/r/DynastyFF/comments/1hw1xob/sleeper_app_feedback_2025/",
    },
    competitorScreenshot: "/vs/sleeper-desktop.png",
    competitorAlt: "Sleeper desktop pick'em experience showing cluttered, difficult-to-use layout",
    tppScreenshot: "/vs/tpp-picks-desktop.png",
    tppAlt: "thepickempool picks page on desktop showing clean, full-featured layout",
  },
  {
    title: "250-Entry Cap. Your Big Pool Has Nowhere to Go.",
    body: "Sleeper caps pick'em pools at 250 entries — half the limit of their own survivor pools. If your office pool grows past that, Sleeper can't host it. The cap also creates uncertainty: build your league on a platform that has arbitrary limits and you're one good recruiting season away from being told you can't add any more players. thepickempool has no arbitrary entry cap. Run a 25-person friend group or a 500-person office tournament — the platform doesn't punish you for growing.",
    quote: {
      text: "Pick'em: Increase the pool size to match the Survivor Pool size. I understand this is also a server issue, but having it be half the survivor pool size seems odd.",
      source: "r/SleeperApp — Feedback for Improving Next Season",
      url: "https://www.reddit.com/r/SleeperApp/comments/1i9tdfh/feedback_for_improving_the_experience_next_season/",
    },
    competitorScreenshot: "/vs/sleeper-cap.png",
    competitorAlt: "Sleeper Pick'em pool showing 250-entry limit warning",
    tppScreenshot: "/vs/tpp-commissioner.png",
    tppAlt: "thepickempool commissioner panel showing league roster management with no entry cap",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Confidence scoring",
    them: { value: "Not available", good: false },
    tpp: { value: "1–16 per game — built around it", good: true },
  },
  {
    feature: "Playoff pick'em",
    them: { value: "Not available", good: false },
    tpp: { value: "Full postseason support", good: true },
  },
  {
    feature: "Desktop experience",
    them: { value: "\"Borderline unusable\" — users' own words", good: false },
    tpp: { value: "Full desktop layout, same features as mobile", good: true },
  },
  {
    feature: "Entry cap",
    them: { value: "250 max", good: false },
    tpp: { value: "No cap", good: true },
  },
  {
    feature: "Season tiebreakers",
    them: { value: "Weekly tiebreakers don't carry to season total", good: false },
    tpp: { value: "MNF tiebreaker tracked across full season", good: true },
  },
  {
    feature: "Spread source",
    them: { value: "Sleeper proprietary", good: false },
    tpp: { value: "Live market via The Odds API", good: true },
  },
  {
    feature: "The Grid (picks matrix)",
    them: { value: "Not available", good: false },
    tpp: { value: "Every player, every pick, live after kickoff", good: true },
  },
  {
    feature: "Commissioner tools",
    them: { value: "Basic — no payment tracking", good: false },
    tpp: { value: "Roster, payments, phone, Venmo", good: true },
  },
  {
    feature: "Mobile experience",
    them: { value: "Strong — Sleeper's core strength", good: true },
    tpp: { value: "Mobile-first, works on all devices", good: true },
  },
  {
    feature: "Cost",
    them: { value: "Free", good: true },
    tpp: { value: "Free", good: true },
  },
];

export default function SleeperVsPage() {
  return (
    <VsPage
      competitor="Sleeper"
      competitorFull="Sleeper NFL Pick'em Pools"
      slug="sleeper-pickem"
      heroHeadline={<>Sleeper Launched Pick&apos;em Pools.<br /><span className="vs-headline-accent">A Year Later, Still No Confidence Scoring.</span></>}
      heroSub="Great fantasy app. Pick'em pools launched in 2024 with flat scoring, no playoffs, a broken desktop, a 250-entry cap, and tiebreakers that don't carry through the season. thepickempool has everything Sleeper's pick'em hasn't built yet. Free."
      painPoints={PAIN_POINTS}
      comparisonRows={COMPARISON_ROWS}
    />
  );
}
