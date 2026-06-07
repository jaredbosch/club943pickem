# Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship three high-ROI, low-effort wins before July: a public pick consensus page, league creation templates, and Resend email activation.

**Architecture:** Three independent changes — a new public Next.js route that aggregates pick data from Supabase, a template-selection UI step added to the existing `LeagueSetup` component, and Resend env var activation. No new DB tables. No schema changes.

**Tech Stack:** Next.js 14 App Router, Supabase (server client + admin client), Tailwind CSS, Resend (already integrated in `src/app/api/cron/weekly-report/route.ts`)

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/app/picks/week-[n]/page.tsx` | **Create** | Public consensus page — server component, no auth |
| `src/components/league/LeagueSetup.tsx` | **Modify** | Add template selection step before the create form |
| `src/app/sitemap.ts` | **Modify** | Add consensus page URLs for weeks 1–18 |
| Vercel env vars | **Manual** | Add `RESEND_API_KEY` to activate weekly digest |

---

## Task 1: Public Pick Consensus Page

**Files:**
- Create: `src/app/picks/week-[n]/page.tsx`
- Modify: `src/app/sitemap.ts`

This page aggregates `picks` rows across all leagues for a given week and shows away%/home% per game. No auth required. Uses the Supabase admin client (bypasses RLS) since picks span all leagues.

- [ ] **Step 1: Create the page file**

Create `src/app/picks/week-[n]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { nflSeasonYear } from "@/lib/nfl/week";
import type { Metadata } from "next";

type Props = { params: { n: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const week = parseInt(params.n, 10);
  if (isNaN(week) || week < 1 || week > 18) return {};
  return {
    title: `NFL Week ${week} Pick'em Consensus | The Pickem Pool`,
    description: `See what percentage of NFL pick'em pool players are picking each team in Week ${week}. Aggregate pick data from The Pickem Pool.`,
    alternates: { canonical: `https://thepickempool.com/picks/week-${week}` },
    openGraph: {
      title: `NFL Week ${week} Pick'em Consensus`,
      description: `Who is everyone picking in Week ${week}?`,
      url: `https://thepickempool.com/picks/week-${week}`,
    },
  };
}

export default async function ConsensusPage({ params }: Props) {
  const week = parseInt(params.n, 10);
  if (isNaN(week) || week < 1 || week > 18) notFound();

  const seasonYear = nflSeasonYear(new Date());
  const supabase = createAdminClient();

  const { data: games } = await supabase
    .from("games")
    .select("id, home_team, away_team, spread_home, kickoff_time, time_slot, status")
    .eq("week", week)
    .eq("season_year", seasonYear)
    .order("kickoff_time", { ascending: true });

  if (!games || games.length === 0) notFound();

  const { data: pickRows } = await supabase
    .from("picks")
    .select("game_id, picked_team")
    .in("game_id", games.map((g) => g.id))
    .not("picked_team", "is", null);

  const gameStats = games.map((game) => {
    const gamePicks = (pickRows ?? []).filter((p) => p.game_id === game.id);
    const awayPicks = gamePicks.filter((p) => p.picked_team === game.away_team).length;
    const homePicks = gamePicks.filter((p) => p.picked_team === game.home_team).length;
    const total = gamePicks.length;
    const awayPct = total > 0 ? Math.round((awayPicks / total) * 100) : 50;
    const homePct = total > 0 ? 100 - awayPct : 50;
    return { ...game, awayPicks, homePicks, total, awayPct, homePct };
  });

  const totalPicks = gameStats.reduce((sum, g) => sum + g.total, 0);

  return (
    <main className="min-h-screen bg-[#0d0d12] text-white px-4 py-10 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="text-xs font-black tracking-widest text-yellow-400 mb-1">THEPICKEMPOOL.COM</div>
        <h1 className="text-3xl font-black mb-2">NFL Week {week} Consensus Picks</h1>
        <p className="text-sm text-gray-400">
          Based on {totalPicks.toLocaleString()} picks across all active TPP leagues.
        </p>
      </div>

      <div className="flex flex-col gap-3 mb-12">
        {gameStats.map((game) => {
          const spread = game.spread_home !== null
            ? (game.spread_home > 0 ? `+${game.spread_home}` : `${game.spread_home}`)
            : "PK";
          return (
            <div key={game.id} className="bg-[#14141e] border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-stretch">
                <div className="flex-1 p-4">
                  <div className="text-xs text-gray-500 mb-1">{game.away_team}</div>
                  <div className="text-2xl font-black">{game.awayPct}%</div>
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${game.awayPct}%` }} />
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center px-4 border-x border-white/10">
                  <div className="text-[10px] text-gray-600 mb-1">@</div>
                  <div className="text-xs text-yellow-400 font-black">{spread}</div>
                  {game.total > 0 && (
                    <div className="text-[10px] text-gray-600 mt-1">{game.total} picks</div>
                  )}
                </div>
                <div className="flex-1 p-4 text-right">
                  <div className="text-xs text-gray-500 mb-1">{game.home_team}</div>
                  <div className="text-2xl font-black">{game.homePct}%</div>
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full ml-auto" style={{ width: `${game.homePct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center border border-yellow-400/30 rounded-xl p-8 bg-yellow-400/5">
        <div className="text-lg font-black mb-2">Run your own NFL pick&apos;em pool</div>
        <p className="text-sm text-gray-400 mb-4">
          Free, no ads. ATS, Confidence, Pick 5, and more. Set up in 2 minutes.
        </p>
        <a
          href="/league"
          className="inline-block bg-yellow-400 text-black font-black px-6 py-3 rounded-lg text-sm"
        >
          Create Your League →
        </a>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify it renders**

```bash
cd /Users/jaredbosch/club943pickem && npm run dev
```

Open `http://localhost:3000/picks/week-1`. Expected: consensus page renders (or 404 if no week-1 games in DB — that's correct). No auth redirect. No console errors.

- [ ] **Step 3: Add consensus URLs to sitemap**

In `src/app/sitemap.ts`, add inside the return array after the `...blogPosts` line:

```ts
// Weeks 1–18 consensus pages
...(Array.from({ length: 18 }, (_, i) => i + 1).map((week) => ({
  url: `${base}/picks/week-${week}`,
  lastModified: now,
  changeFrequency: "weekly" as const,
  priority: 0.85,
}))),
```

- [ ] **Step 4: Commit**

```bash
cd /Users/jaredbosch/club943pickem
git add src/app/picks src/app/sitemap.ts
git commit -m "feat: add public NFL week consensus picks page at /picks/week-[n]"
```

---

## Task 2: League Creation Templates

**Files:**
- Modify: `src/components/league/LeagueSetup.tsx`

Add a template-selection UI before the existing create form fields. Clicking a template pre-fills `scoringType`, `maxPlayers`, and `entryFeeDollars`. No DB changes.

- [ ] **Step 1: Add `TEMPLATES` constant to `LeagueSetup.tsx`**

After the existing imports at the top of `src/components/league/LeagueSetup.tsx`, add:

```ts
const TEMPLATES = [
  {
    id: "office",
    label: "Office Pool",
    emoji: "🏢",
    description: "Straight Up · 10–20 players · Weekly winner",
    scoring_type: "straight_up" as ScoringType,
    max_players: 20,
    entry_fee_dollars: 20,
    popular: false,
  },
  {
    id: "confidence",
    label: "Confidence ATS",
    emoji: "🎯",
    description: "Against the spread · Confidence points · Season winner",
    scoring_type: "ats_confidence" as ScoringType,
    max_players: 30,
    entry_fee_dollars: 300,
    popular: true,
  },
  {
    id: "friends",
    label: "Friend Group",
    emoji: "👥",
    description: "Pick 5 ATS · 4–8 players · Casual format",
    scoring_type: "pick5_ats" as ScoringType,
    max_players: 8,
    entry_fee_dollars: 50,
    popular: false,
  },
] as const;
```

- [ ] **Step 2: Add `selectedTemplate` state and `applyTemplate` handler**

Inside `LeagueSetup`, after the existing `useState` declarations:

```ts
const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

function applyTemplate(templateId: string) {
  const t = TEMPLATES.find((tmpl) => tmpl.id === templateId);
  if (!t) return;
  setSelectedTemplate(templateId);
  setScoringType(t.scoring_type);
  setMaxPlayers(t.max_players);
  setEntryFeeDollars(t.entry_fee_dollars);
}
```

- [ ] **Step 3: Insert template picker UI into the create form**

In the JSX, find `<form onSubmit={handleCreate}>`. Immediately after that opening tag (before the first input field), insert:

```tsx
{/* Template picker */}
<div className="mb-6">
  <div className="text-xs font-black tracking-widest text-gray-500 mb-3">
    START WITH A TEMPLATE
  </div>
  <div className="flex flex-col gap-2">
    {TEMPLATES.map((t) => (
      <button
        key={t.id}
        type="button"
        onClick={() => applyTemplate(t.id)}
        className={`text-left p-3 rounded-lg border transition-colors ${
          selectedTemplate === t.id
            ? "border-yellow-400 bg-yellow-400/10"
            : "border-white/10 bg-[#14141e] hover:border-white/20"
        }`}
      >
        <div className="flex items-center gap-2">
          <span>{t.emoji}</span>
          <span className="font-black text-sm">{t.label}</span>
          {t.popular && (
            <span className="text-[10px] bg-yellow-400 text-black font-black px-2 py-0.5 rounded">
              POPULAR
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 ml-6">{t.description}</div>
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 4: Verify in browser**

With dev server running, go to `http://localhost:3000/league` (must be signed in).

Expected:
- Three template buttons appear above the name/fee/players fields
- Clicking "Confidence ATS" sets scoring type to `ats_confidence`, max players to 30, entry fee to 300
- Clicking "Friend Group" sets scoring type to `pick5_ats`, max players to 8, entry fee to 50
- Submitting the form still creates the league correctly
- The "Join" tab is unaffected

- [ ] **Step 5: Commit**

```bash
cd /Users/jaredbosch/club943pickem
git add src/components/league/LeagueSetup.tsx
git commit -m "feat: add league creation templates (Office Pool, Confidence ATS, Friend Group)"
```

---

## Task 3: Resend Activation

**Files:** None (env var only)

The weekly digest cron is fully built at `src/app/api/cron/weekly-report/route.ts`. It sends to `REPORT_EMAIL` (defaults to `boschtj@gmail.com`). It only needs `RESEND_API_KEY`.

- [ ] **Step 1: Sign up and verify sender domain**

1. Go to resend.com → create account
2. Domains → Add domain → `thepickempool.com`
3. Add the DNS records shown (TXT + MX) in your domain registrar
4. Wait for verification (usually under 5 minutes)
5. API Keys → Create Key → name "TPP Production" → Sending access → Copy key (starts with `re_`)

- [ ] **Step 2: Add env vars to Vercel**

Vercel dashboard → thepickempool.com project → Settings → Environment Variables:

| Name | Value | Environments |
|------|-------|-------------|
| `RESEND_API_KEY` | `re_your_key_here` | Production, Preview, Development |
| `REPORT_EMAIL` | `boschtj@gmail.com` | Production (already default, but make explicit) |

Redeploy from the Deployments tab to pick up the new env var.

- [ ] **Step 3: Test the route**

Add to `.env.local` (never commit):
```
RESEND_API_KEY=re_your_key_here
```

Then test locally:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/weekly-report
```

Expected:
```json
{"ok":true,"stats":{"newLeagues":0,"totalLeagues":5,...}}
```

Check `boschtj@gmail.com` for the weekly digest email.

- [ ] **Step 4: Confirm cron schedule in `vercel.json`**

Check that `vercel.json` includes:
```json
{
  "crons": [
    { "path": "/api/cron/weekly-report", "schedule": "0 13 * * 1" }
  ]
}
```

If missing, add it and commit:
```bash
git add vercel.json
git commit -m "chore: ensure weekly-report cron is scheduled in vercel.json"
```

---

## Done

After all three tasks:
- `/picks/week-1` through `/picks/week-18` are live, indexable, and showing real pick consensus data
- League creation has templates reducing commissioner friction  
- Weekly digest emails fire every Monday at 9am ET
