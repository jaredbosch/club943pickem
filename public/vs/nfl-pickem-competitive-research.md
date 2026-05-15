# NFL Pick'em Competitive Research

**Prepared for:** Jared Bosch
**Date:** 15 May 2026
**Purpose:** Map the NFL pick'em product landscape, surface user pain points from Reddit / forums / app stores, and identify the build opportunities a new competitor can attack.
**Scope:** Straight pick'em, ATS pick'em, confidence pools. Survivor is touched only where it intersects (often same platforms, often same pain).

---

## TL;DR

The NFL pick'em category is dominated by 5–6 incumbents (Yahoo, CBS, ESPN, NFL.com, OfficeFootballPool, RunYourPool), all of which users actively complain about. The two biggest free incumbents — **Yahoo Pro Pickem** and **CBS Sports Pickem** — are the most hated, for different reasons:

- **Yahoo** has been actively gutting the product (removed in-league pick'em, weak commish tools, 100-entry survivor cap, in-app ads turning aggressive, premium paywalls creeping in). The brand is coasting on inertia.
- **CBS** rolled out a 2024 redesign that broke functionality longtime commissioners relied on (e.g. removing a non-paying member nukes everyone's picks). The dedicated subreddit r/CBSSportsPools is a goldmine of complaints.
- **ESPN Pigskin Pick'em** has terrible desktop UX (a user built a Chrome extension to fix the drag-and-drop), can't show group picks until kickoff, and is ad-heavy.
- **OFP / RunYourPool / Splash Sports** are the paid pool incumbents — solid but pricey. Splash acquired both OFP (Nov 2021) and RYP (early 2021), and the platform consolidation continues to anger longtime users (especially OFP commishes pushed onto Splash for non-NFL contests).
- **Sleeper** launched pick'em pools in 2024 and is still missing playoff support, confidence pools, and decent tiebreakers — proof the category is wide open even for a well-loved fantasy app.
- **DraftKings Pick6 / Splash Quick Picks** are technically DFS-style pick'em — not real pools — and have heavy trust/withdrawal/payout-dilution complaints.

The five biggest opportunity wedges for a new entrant:

1. **Mobile-first, ad-free, fast** — every incumbent feels like a 2015 web product wrapped in a mobile shell. Build a real native app first.
2. **Commish tools that actually exist** — remove a non-payer without wiping picks, edit deadlines mid-season, retroactive picks with audit log, real group chat. The bar is on the floor.
3. **All formats in one product** — straight, ATS, confidence, survivor, playoff bracket, custom scoring. Today users juggle 2–3 platforms to get this.
4. **Pricing model that doesn't punish big pools** — RYP/OFP/Splash charge per entry which caps growth. A flat fee or free-with-optional-tip beats them on the long tail.
5. **Trust + transparency** — timestamped picks, public pick logs after lock, no hidden payout dilution. The Yahoo survivor "no server logs" excuse is a positioning gift.

The rest of this doc walks each platform, the specific complaints (with quotes + links), and what to actually build.

---

## The Landscape

| Platform | Format support | Price | Strengths | Where it bleeds |
|---|---|---|---|---|
| **Yahoo Pro Pickem** | Straight, ATS, confidence | Free | Huge install base, brand familiarity | Commish tools weak, removed in-league pickem, ad creep, 100-entry survivor cap, no playoff pickem |
| **CBS Sports Pickem** | Straight, ATS, survivor, confidence | Free (web/app); fantasy leagues paid | Best ATS support historically | 2024 redesign gutted commish controls; reliability issues; charges for fantasy leagues |
| **ESPN Pigskin Pickem** | Straight, ATS, confidence (3 modes) | Free | Big leaderboard prizes ($100K) | Garbage UX (3rd party Chrome extension exists to fix it), can't see group picks pre-kickoff, ad-heavy |
| **NFL.com Challenge** | Straight, playoff bracket | Free | Brand authority | Spreads don't update through the week, league migration to ESPN backend |
| **OfficeFootballPool (OFP)** | Straight, ATS, confidence, survivor, pick X | $20–$200 flat (now via Splash) | Long-time commish favourite for unlimited entries | Acquired by Splash (2021), platform consolidation has been bumpy — longtime OFP users complain about the migrated Splash experience |
| **RunYourPool (RYP)** | Straight, ATS, survivor, squares | ~$1/entry, capped | Solid app, clean UX | Per-entry pricing punishes large pools (e.g. $200 for 200 entries) |
| **PoolHost** | Confidence, survivor, brackets | Few $ flat | No site fee — popular with smaller commishes | Dated UI; limited mobile experience |
| **Splash Sports** | Survivor, pick'em, tiers, confidence, one & done | Real-money entries | Peer-to-peer real money, owns RYP + OFP | Payout dilution complaints, pick options thin vs Underdog/PrizePicks, support issues post-OFP acquisition |
| **Sleeper Pick'em Pools** | Straight, ATS | Free | Best-in-class mobile UX, group chat | Launched 2024 — still missing playoff pickem, confidence, real tiebreakers, 250-entry cap |
| **DraftKings Pick6** | DFS-style pick'em (over/under) | Real money | DK distribution, fast | Not a true pool format, heavy "scam" / withdrawal complaints |
| **All Chalk** | ATS only (6 picks/wk, double/triple risk) | Free | Mobile-first; built by someone who agrees with this thesis | Tiny, ATS-only, very early-stage |
| **Bookmakers Review NFL Pick'em** | Confidence ATS | Free (sportsbook-funded) | $2,500 prize pool, low friction | Pure marketing arm for sportsbooks, not a private-pool product |

---

## Pain Point Themes (with quotes & sources)

### 1. UX / Mobile / App Jank

**CBS 2024 app redesign — broadly hated**

> "I must say the new revamp of the CBS Sports Pools and Pool Manager tools is terrible. Took away necessary manager options. Can't even remove players who don't pay from the pool without needing to delete all pool members picks? The new site has lost so much functionality. CBS is so bad now."
> — [r/CBSSportsPools, 2024](https://www.reddit.com/r/CBSSportsPools/comments/1f91fmm/2024_cbs_sports_app/)

App Store reviewer on the same redesign:

> "The new layout is so much worse now. With a calendar format it's hard to find when my teams are playing… There's no longer standings and rankings tabs for leagues/conferences."
> — [CBS Sports app, App Store reviews](https://apps.apple.com/us/app/cbs-sports-live-scores-news/id307184892?see-all=reviews)

**Yahoo mobile app — long-standing crash & layout complaints**

> "The yahoo fantasy app is constantly freezing and crashing. This has been an issue all hockey season so far. I've cleared the cache."
> — [r/YahooFantasy weekly tech support thread](https://www.reddit.com/r/YahooFantasy/comments/1m5fw5m/tech_support_general_questions_weekly_thread/)

> "I'm not having crashes but it is horribly laid out. I hate how I got into the app and it's their default landing screen where I then need to..."
> — [r/fantasyfootball — "The New Yahoo! app is very poorly done"](https://www.reddit.com/r/fantasyfootball/comments/1faaqxv/the_new_yahoo_app_is_very_poorly_done/)

> "You click on another team and there is no 'start chat' feature. On the browser side, they took away the message board and also the league…"
> — [r/fantasyfootball — "What the hell happened to the Yahoo fantasy app?"](https://www.reddit.com/r/fantasyfootball/comments/1f4bw67/what_the_hell_happened_to_the_yahoo_fantasy_app/)

**ESPN — desktop UX so bad someone built a Chrome extension to fix it**

> "For anyone who plays the Pigskin Pick'em league in ESPN on desktop, they know that the UX is lacking when it comes to changing your [picks]."
> — [r/Fantasy_Football — Pigskin Pick'em drag-and-drop extension](https://www.reddit.com/r/Fantasy_Football/comments/1n8hbt4/i_made_an_espn_pigskin_pickem_drag_and_drop/)

> "Its become very cluttered, they're trying to force the pigskin pick and college pick em leagues down your throat, the waiver order is almost…"
> — [r/fantasyfootball — "The new ESPN app is garbage"](https://www.reddit.com/r/fantasyfootball/comments/503ttz/the_new_espn_app_is_garbage/)

ESPN's pre-kickoff group picks visibility was also removed:

> "You can only see group picks after kickoff. That way you can't copy people."
> — [r/fantasyfootball](https://www.reddit.com/r/fantasyfootball/comments/plupuq/did_espn_remove_the_option_to_view_group_picks_in/)

**Build wedge:** Mobile-first, native-feeling app with a clean web counterpart. The bar isn't "good design" — it's "doesn't actively make me angry."

---

### 2. Commissioner / League-Owner Tools

**Yahoo Pro Pickem — commish can't fix deadline mistakes**

> "There seems to be a setting which was checked off in error (Deadline 1PM EST on Sundays), when it should be (5min before gametime). It's greyed out in my commissioner settings. Could really use some help."
> — [r/YahooFantasy — Zero way to edit Pick'em league as Commissioner](https://www.reddit.com/r/YahooFantasy/comments/pnm7kd/zero_way_to_edit_pick_ems_league_as_commissioner/)

Yahoo's official help confirms it's a hard lock:

> "Pick deadlines in Pro and College Pick'em groups can't be edited once the first deadline of the season has passed and it isn't possible to retroactively apply individual picks."
> — [Yahoo Help — pick deadlines](http://help.yahoo.com/kb/SLN6638.html)

**CBS — removing a non-paying member nukes the whole pool's picks** (cited above in the r/CBSSportsPools quote)

**Yahoo removed in-league pickem entirely** — a feature longtime fantasy commissioners built payouts around

> "For the past ten years a portion of the payout (50% of buy in) would go to the winner of league pick'em… Thanks yahoo for removing something that we found highly entertaining and replaced it with your own bullshit app. Yahoo must be running low on server space."
> — [r/FFCommish — Yahoo removes in-league pick'em](https://www.reddit.com/r/FFCommish/comments/1f8xe1q/yahoo_removes_in_league_pickem/)

**Build wedge:** Real commish tools — edit deadlines mid-season with audit log, remove a non-payer without wiping picks, override picks with explicit annotation, retroactive entry for late joiners, custom scoring, custom payouts, in-league pick'em as a first-class feature.

---

### 3. Trust / Scoring / Tiebreakers / Integrity

**Yahoo Survivor pool — a documented cheating loophole, Yahoo refused to investigate**

> "On Friday we did contact Yahoo support with these concerns and they gave us the brush off saying there is no way to verify exactly when the picks were made and that there is no way to enter a pick after the game has started. I call bullshit. There certainly has to be some server logs they can get to to show a timestamp of when the pick was made."
> — [r/fantasyfootball — Major flaw in Yahoo survivor pool](https://www.reddit.com/r/fantasyfootball/comments/18lbx12/major_flaw_in_yahoo_survivor_pool/)

**Sleeper Pickem — tiebreakers don't carry over to season standings**

> "NFL Pick'em: could you make the weekly tiebreakers count towards the whole season so that one winner for a pool could be determined?"
> — [r/SleeperApp — Sleeper App Suggestions](https://www.reddit.com/r/SleeperApp/comments/1q5nbzs/sleeper_app_suggestions/)

**NFL.com Challenge — spreads frozen on Tuesday, don't update live**

> "I used it last year and biggest complaint was that spreads set on Tuesday didn't change throughout the week."
> — [r/fantasyfootball — NFL Pickem App for Office Pool](https://www.reddit.com/r/fantasyfootball/comments/paatr7/nfl_pickem_app_for_office_pool/)

**Yahoo scoring bugs** — historic and recurring

> "In my private Yahoo pickem group I have a problem with scoring. Week 1 of the playoffs for some reason gave one player an option to pick…"
> — [r/YahooFantasy — Yahoo Pro Football Pickem Scoring Problem](https://www.reddit.com/r/YahooFantasy/comments/lbm4u7/yahoo_pro_football_pickem_scoring_problem/)

**ESPN Pigskin — incorrect picks marked wrong**

> "Is anyone else getting incorrectly marked with an X instead of a checkmark on games they picked correctly? I know of 2 games in week 3 counted incorrectly."
> — [r/fantasyfootball — Problems with ESPN Pigskin Pick'em](https://www.reddit.com/r/fantasyfootball/comments/2hrl6y/problems_with_espn_pigskin_pickem/)

**Build wedge:** Server-side timestamped picks, public audit log post-lock, immutable scoring with version history, configurable tiebreakers (weekly carryover, MNF total, etc.). Position trust as a feature. "Picks signed and timestamped — no excuses."

---

### 4. Pricing / Ads / Paywall Creep

**Yahoo full-page ads**

> "Yahoo Sports added full page ads and it is *terrible*. Is anyone else… It's almost unusable. When I scroll past it half the time the ad opens."
> — [r/fantasybaseball — Yahoo Sports full page ads](https://www.reddit.com/r/fantasybaseball/comments/1t3zah6/yahoo_sports_added_full_page_ads_and_it_is/)

**Yahoo paywalling lineup features**

> "Greediness is getting out of hand… They moved behind a paywall the option to put active lineups for the week. That is simply gross and will lose them much more users than convert to Premium subscribers."
> — [Yahoo Fantasy app reviews, App Store](https://apps.apple.com/fi/app/yahoo-fantasy-sports-nba-mlb/id328415391)

(Yahoo reversed this one after backlash — the developer response in that listing confirms it.)

**ESPN — video ads forced before key features**

> "Bypassing ESPN Fantasy Football Video Ads… Drag the video down to the corner of your screen to minimize the video and maneuver the background apps, it'll let you fast forward through the ads in 15…"
> — [r/fantasyfootball — Bypassing ESPN ads](https://www.reddit.com/r/fantasyfootball/comments/rc3iiu/bypassing_espn_fantasy_football_video_ads/)

**CBS — still charges for fantasy leagues, which sets a pricing tone the pickem side carries**

> "CBS is one of the few if not the only platform that still charges for fantasy leagues."
> — [r/fantasyfootball — Is CBS the worst fantasy platform?](https://www.reddit.com/r/fantasyfootball/comments/pltxgq/is_cbs_the_worst_fantasy_platform/)

**RunYourPool / Gridiron Games — per-entry pricing breaks big pools**

> "Most of the other platforms that have an app and are easy to use cost approx $200 for 200 entries/teams — like RunYourPool or Gridiron Games."
> — [r/fantasyfootball — Survivor Pool Platform](https://www.reddit.com/r/fantasyfootball/comments/1m6pidi/survivor_pool_platform/)

**Splash Sports — peer-to-peer payouts split when multiple players hit, customer feels mugged**

> "I was set to win 60$ and I had a 50% boost and thought I hit a 90$ play but alas…. Someone in my pool won and we had to split my 90$ and I got 45$. 15$ was site credit even. Didn't like it one bit."
> — [Splash Sports app, App Store reviews](https://apps.apple.com/us/app/splash-sports-survivor-dfs/id6451190245?see-all=reviews&platform=iphone)

**Build wedge:** Pick a clean pricing story and own it. Options worth testing:
- Free, no ads, sponsor-funded prize pools (Bookmakers Review model — but cleaner)
- Free for players, flat ~$20 per pool for commish (PoolHost model)
- Per-pool not per-entry — uncap large pools
- Optional "tip the commish / tip the developer" — Discord-style soft monetisation

Whatever you pick, position against Yahoo's ad creep and RYP's per-entry scaling.

---

### 5. Format Gaps & Missing Features

**Sleeper doesn't have playoff pick'em yet**

> "For pickem pool please let us pick the playoffs as well!"
> — [r/SleeperApp — Sleeper App Suggestions](https://www.reddit.com/r/SleeperApp/comments/1q5nbzs/sleeper_app_suggestions/)

**Sleeper pickem capped at half the survivor pool size**

> "Pick'em: Increase the pool size to match the Survivor Pool size. I understand this is also a server issue, but having it be half the survivor…"
> — [r/SleeperApp — Feedback for Improving Next Season](https://www.reddit.com/r/SleeperApp/comments/1i9tdfh/feedback_for_improving_the_experience_next_season/)

**Yahoo Survivor capped at 100 entries — drives large pools off-platform**

> "So I host a big survivor pool yearly and it's outgrown Yahoo's platform as they cap their entries at 100 for some odd reason."
> — [r/fantasyfootball — Survivor Pool Platform](https://www.reddit.com/r/fantasyfootball/comments/1m6pidi/survivor_pool_platform/)

**Confidence pool ATS — niche but underserved**, mostly served by PoolHost and OFP. Niche but high-LTV (these commishes run the same pool for 10+ years).

**Sleeper desktop is "borderline unusable"** — opportunity even for mobile-led competitors to win web

> "The desktop version is borderline unusable. It's like it was made in the early 2000s. The app is better but the UI is too busy."
> — [r/DynastyFF — Sleeper App Feedback 2025](https://www.reddit.com/r/DynastyFF/comments/1hw1xob/sleeper_app_feedback_2025/)

**Build wedge:** Ship one product that covers the full menu — straight, ATS, confidence, survivor, playoff bracket, custom scoring — and treat both web and mobile as first-class.

---

### 6. Support / Customer Service

**CBS support routinely escalates to the commish, leaving commishes stranded**

> "As a team owner of a privately managed league, you must direct all league questions to your League Commissioner or Manager… What if a player needs to be added to the player pool? Are you supposed to tell the commish… CBS has a long history of poor, poor customer service."
> — [r/fantasybaseball — CBS Sports fantasy customer service](https://www.reddit.com/r/fantasybaseball/comments/1wqg1d/cbs_sports_fantasy_baseball_bullht_customer/)

**Splash Sports — broken FedEx points contest, no live standings**

> "We opted to use one of Splash Sports' four available scoring settings (in this case FedEx points) and to our surprise once the tournament started, there was no way to track live standings via FedEx Points. Only strokes and purse. I reached out to support and they said the FedEx points should not have been made available and this was an error on their end…"
> — [Splash Sports app, App Store reviews](https://apps.apple.com/us/app/splash-sports-survivor-dfs/id6451190245?see-all=reviews&platform=iphone)

**Officepools (different product, similar pattern) — bug-ridden, slow fixes, rude support**

> "Persistent bugs remain unresolved for long periods despite user feedback; updates are infrequent or ineffective at addressing problems… Reports indicate poor customer service with rude responses and no satisfactory resolutions to issues raised by users."
> — [Officepools reviews aggregator](https://officepools.tenereteam.com/)

**Build wedge:** A real support presence. Discord or in-app chat, public changelog, response SLAs. This alone will differentiate against incumbents.

---

### 7. Real-Money / Trust Issues with Pick6 & Splash Quick Picks

These aren't traditional pool products, but they appear in the search every time and bleed reputation onto the category.

> "After hitting the overs on my bet, Pick six only paid out half of what they estimated my winnings to be."
> — [r/DraftKingsDiscussion — Pick six halved my winnings](https://www.reddit.com/r/DraftKingsDiscussion/comments/18tgh5m/pick_six_halved_my_winnings_deleting_app/)

> "Hi guys, I'm trying to withdraw money from my Pick6 account to my cashapp account, however it's not giving me the debit card option…"
> — [r/DraftKingsDiscussion — Withdrawal issues on Pick6](https://www.reddit.com/r/DraftKingsDiscussion/comments/1frakhn/withdrawal_issues_on_pick6/)

Splash's peer-to-peer payout dilution is the same vibe in a different wrapper. If you ever go real-money, this is exactly what to differentiate against: clear payout logic shown before entry, no "we changed our minds on payouts" surprises.

---

## Competitor Already Doing the Thesis: All Chalk

Worth flagging — a founder posted to r/roastmystartup last year with almost exactly this thesis:

> "Current pick 'em options are exclusionary and only accessible to fantasy bros on fantasy platforms. They exist as a way to upsell pick em users into more profitable channels like their sports book, casino games and daily fantasy contests."
> — [r/roastmystartup — All Chalk launch](https://www.reddit.com/r/roastmystartup/comments/1oqddbt/i_built_a_free_nfl_pick_em_app_its_better_than/)

His version is ATS-only with 6 picks/week and a "risk double/triple" mechanic. Worth a download to study positioning before you build something different/better.

---

## What to Build — Recommended Wedge

If I were building against this landscape, the differentiated product looks like this:

1. **Mobile-first** native app (iOS + Android) with a fast web companion. Sleeper-quality polish.
2. **Every format in one app**: straight, ATS (with live-updating spreads), confidence, survivor, playoff bracket. Free format-switching when starting a pool.
3. **Commish tools that actually exist**: edit deadlines mid-season with audit log, remove non-payers without nuking picks, override picks with annotation, retroactive picks for new joiners, custom scoring, custom payouts (weekly + season + side pots), in-app payment tracking.
4. **Trust-first**: server-timestamped picks, public pick log after lock, immutable scoring history, configurable tiebreakers.
5. **Group chat + trash talk** as first-class — not bolted on. Reactions on picks. Weekly recap auto-posts.
6. **Pricing**: free for players, flat per-pool fee for commish (~$20), unlimited entries. Position against RYP's per-entry scaling and Yahoo's ad creep.
7. **No ads, ever, in-app** — even on free pools. This is the single loudest signal in the data.
8. **Optional sportsbook tie-in later** — but never as a default. Burned by Pick6/Splash trust issues, this market is allergic to it.

The smallest viable launch wedge is probably **the office commissioner running a 30–60 person mixed-format pool** — someone who currently glues together Yahoo + a Google Sheet + Venmo + a group chat. Win them and they bring their whole pool to you.

---

## Sources

- [r/CBSSportsPools — 2024 CBS Sports app](https://www.reddit.com/r/CBSSportsPools/comments/1f91fmm/2024_cbs_sports_app/)
- [r/FFCommish — Yahoo removes in-league pick'em](https://www.reddit.com/r/FFCommish/comments/1f8xe1q/yahoo_removes_in_league_pickem/)
- [r/YahooFantasy — Zero way to edit Pick em's league as Commissioner](https://www.reddit.com/r/YahooFantasy/comments/pnm7kd/zero_way_to_edit_pick_ems_league_as_commissioner/)
- [r/YahooFantasy — Yahoo Pro Football Pickem Scoring Problem](https://www.reddit.com/r/YahooFantasy/comments/lbm4u7/yahoo_pro_football_pickem_scoring_problem/)
- [r/YahooFantasy — Tech Support weekly thread](https://www.reddit.com/r/YahooFantasy/comments/1m5fw5m/tech_support_general_questions_weekly_thread/)
- [r/fantasyfootball — Major flaw in Yahoo survivor pool](https://www.reddit.com/r/fantasyfootball/comments/18lbx12/major_flaw_in_yahoo_survivor_pool/)
- [r/fantasyfootball — Survivor Pool Platform](https://www.reddit.com/r/fantasyfootball/comments/1m6pidi/survivor_pool_platform/)
- [r/fantasyfootball — Best Platform For a Survivor Pool](https://www.reddit.com/r/fantasyfootball/comments/pccxmg/best_platform_for_a_survivor_pool/)
- [r/fantasyfootball — NFL Pickem App for Office Pool](https://www.reddit.com/r/fantasyfootball/comments/paatr7/nfl_pickem_app_for_office_pool/)
- [r/fantasyfootball — Is CBS the worst fantasy platform?](https://www.reddit.com/r/fantasyfootball/comments/pltxgq/is_cbs_the_worst_fantasy_platform/)
- [r/fantasyfootball — The New Yahoo! app is very poorly done](https://www.reddit.com/r/fantasyfootball/comments/1faaqxv/the_new_yahoo_app_is_very_poorly_done/)
- [r/fantasyfootball — What the hell happened to the Yahoo fantasy app?](https://www.reddit.com/r/fantasyfootball/comments/1f4bw67/what_the_hell_happened_to_the_yahoo_fantasy_app/)
- [r/fantasyfootball — The new ESPN app is garbage](https://www.reddit.com/r/fantasyfootball/comments/503ttz/the_new_espn_app_is_garbage/)
- [r/fantasyfootball — Problems with ESPN Pigskin Pick'em](https://www.reddit.com/r/fantasyfootball/comments/2hrl6y/problems_with_espn_pigskin_pickem/)
- [r/fantasyfootball — Did ESPN remove the option to view Group Picks?](https://www.reddit.com/r/fantasyfootball/comments/plupuq/did_espn_remove_the_option_to_view_group_picks_in/)
- [r/fantasyfootball — Bypassing ESPN Fantasy Football Video Ads](https://www.reddit.com/r/fantasyfootball/comments/rc3iiu/bypassing_espn_fantasy_football_video_ads/)
- [r/Fantasy_Football — ESPN Pigskin Pick'em drag-and-drop Chrome extension](https://www.reddit.com/r/Fantasy_Football/comments/1n8hbt4/i_made_an_espn_pigskin_pickem_drag_and_drop/)
- [r/fantasybaseball — Yahoo Sports full page ads](https://www.reddit.com/r/fantasybaseball/comments/1t3zah6/yahoo_sports_added_full_page_ads_and_it_is/)
- [r/fantasybaseball — CBS Sports fantasy customer service](https://www.reddit.com/r/fantasybaseball/comments/1wqg1d/cbs_sports_fantasy_baseball_bullht_customer/)
- [r/DynastyFF — NFL Pick'em Pools: New on Sleeper](https://www.reddit.com/r/DynastyFF/comments/1efagig/nfl_pickem_pools_new_on_sleeper/)
- [r/DynastyFF — Sleeper App Feedback 2025](https://www.reddit.com/r/DynastyFF/comments/1hw1xob/sleeper_app_feedback_2025/)
- [r/SleeperApp — Feedback for Improving the Experience Next Season](https://www.reddit.com/r/SleeperApp/comments/1i9tdfh/feedback_for_improving_the_experience_next_season/)
- [r/SleeperApp — Sleeper App Suggestions](https://www.reddit.com/r/SleeperApp/comments/1q5nbzs/sleeper_app_suggestions/)
- [r/DraftKingsDiscussion — Pick six halved my winnings](https://www.reddit.com/r/DraftKingsDiscussion/comments/18tgh5m/pick_six_halved_my_winnings_deleting_app/)
- [r/DraftKingsDiscussion — Withdrawal issues on Pick6](https://www.reddit.com/r/DraftKingsDiscussion/comments/1frakhn/withdrawal_issues_on_pick6/)
- [r/roastmystartup — All Chalk competitor launch](https://www.reddit.com/r/roastmystartup/comments/1oqddbt/i_built_a_free_nfl_pick_em_app_its_better_than/)
- [Splash Sports app reviews — App Store](https://apps.apple.com/us/app/splash-sports-survivor-dfs/id6451190245?see-all=reviews&platform=iphone)
- [CBS Sports app reviews — App Store](https://apps.apple.com/us/app/cbs-sports-live-scores-news/id307184892?see-all=reviews)
- [CBS Sports Fantasy app — App Store](https://apps.apple.com/us/app/cbs-sports-fantasy/id658308834)
- [Yahoo Fantasy Sports app reviews — App Store](https://apps.apple.com/fi/app/yahoo-fantasy-sports-nba-mlb/id328415391)
- [Yahoo Help — Pro Football Pick'em](https://help.yahoo.com/kb/pro-football-pickem)
- [Yahoo Help — pick deadlines in Pick'em groups](http://help.yahoo.com/kb/SLN6638.html)
- [Officepools reviews aggregator](https://officepools.tenereteam.com/)
- [OfficeFootballPool — official site](https://www.officefootballpool.com/)
- [Bookmakers Review — Top NFL Pick'em Pools 2025](https://www.bookmakersreview.com/industry/top-nfl-pickem-pools/)
-