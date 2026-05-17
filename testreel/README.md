# Testreel — Demo Video Recording

Generates a polished MP4 demo video of [thepickempool.com](https://thepickempool.com) using [Testreel](https://github.com/greentfrapp/testreel), which drives a real Chromium browser via Playwright and composites macOS window chrome, an animated cursor, and a dark gradient background into the final video.

## What the recording shows

1. **Dashboard** — league standings table with player W-L records and points, scrolling down to the weekly results section and bump chart
2. **Picks page** (`/league/6V7A3F/picks`) — picking SEA in an NE @ SEA matchup, opening the confidence picker and selecting 14, with the confidence budget bar visible
3. **Grid page** (`/league/6V7A3F/grid`) — the full picks matrix, scrolling right to reveal all game columns and color-coded correct/wrong cells
4. **Commissioner panel** (`/league/6V7A3F/commissioner`) — scrolling down through the member roster with names, paid status, and email

## Prerequisites

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   npx playwright install chromium
   ```

2. **Seed test data** so league `6V7A3F` has standings, picks, and members:
   ```bash
   node scripts/seed-test-season.mjs
   ```

3. **Install ffmpeg** (required for MP4 output):
   ```bash
   brew install ffmpeg        # macOS
   sudo apt install ffmpeg    # Ubuntu/Debian
   ```

4. **Set environment variables**:
   ```bash
   export SUPABASE_URL=https://nmbadqaogfksyjwzrfmr.supabase.co
   export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   export TEST_USER_EMAIL=boschtj@gmail.com
   ```

## How to run

```bash
bash scripts/record-demo.sh
```

The script will:
- Confirm test data has been seeded
- Verify env vars and ffmpeg are available
- Run `npx testreel testreel/demo.json`
- Print the output path when done
- Remind you to clean up seed data

## Where output goes

All output lands in `testreel-output/` at the project root (gitignored):

```
testreel-output/
  recording-<timestamp>/
    video.mp4          ← the final demo video
    *.png              ← named screenshots from each step
    output.json        ← manifest with paths and metadata
```

## Re-recording after UI changes

Just edit `testreel/demo.json` to update selectors, steps, or timing, then re-run:

```bash
bash scripts/record-demo.sh
```

Common edits:
- **New selector** — update the `selector` field on the relevant `click` or `hover` step
- **Slower pacing** — decrease the global `speed` value (e.g. `0.6`) or increase individual `pauseAfter` values
- **Different pages** — add or change `navigate` steps
- **New section** — add `scroll` + `screenshot` steps after the navigate

## Config reference

The full schema is documented at `node_modules/testreel/recording-definition.schema.json` and in the [Testreel docs](https://github.com/greentfrapp/testreel/blob/main/docs/recording-definitions.md).
