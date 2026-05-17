#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────────────────────
# record-demo.sh — Generate the thepickempool.com demo video using Testreel
# ──────────────────────────────────────────────────────────────────────────────

cd "$(dirname "$0")/.."

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}thepickempool.com — Demo Video Recorder${RESET}"
echo "────────────────────────────────────────────────"
echo ""

# ── Step 1: Remind user to seed test data ─────────────────────────────────────
echo -e "${YELLOW}STEP 1: Seed test data${RESET}"
echo ""
echo "  The recording targets league code 6V7A3F on thepickempool.com."
echo "  If that league/data doesn't exist, seed it first:"
echo ""
echo -e "    ${BOLD}node scripts/seed-test-season.mjs${RESET}"
echo ""
read -r -p "  Has test data been seeded? (y/N) " seed_confirm
if [[ ! "$seed_confirm" =~ ^[Yy]$ ]]; then
  echo ""
  echo "  Run: node scripts/seed-test-season.mjs"
  echo "  Then re-run this script."
  exit 0
fi
echo ""

# ── Step 2: Check required env vars ───────────────────────────────────────────
echo -e "${YELLOW}STEP 2: Checking environment variables${RESET}"
echo ""

missing_env=0
for var in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY TEST_USER_EMAIL; do
  if [[ -z "${!var:-}" ]]; then
    echo -e "  ${RED}✗ $var is not set${RESET}"
    missing_env=1
  else
    echo -e "  ${GREEN}✓ $var${RESET}"
  fi
done

if [[ "$missing_env" == "1" ]]; then
  echo ""
  echo "  Set the missing variables before running this script:"
  echo ""
  echo "    export SUPABASE_URL=https://nmbadqaogfksyjwzrfmr.supabase.co"
  echo "    export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>"
  echo "    export TEST_USER_EMAIL=boschtj@gmail.com"
  echo ""
  exit 1
fi
echo ""

# ── Step 3: Check for ffmpeg ───────────────────────────────────────────────────
echo -e "${YELLOW}STEP 3: Checking for ffmpeg${RESET}"
echo ""

if ! command -v ffmpeg &> /dev/null; then
  echo -e "  ${RED}✗ ffmpeg not found — required for MP4 output${RESET}"
  echo ""
  echo "  Install it with:"
  echo "    brew install ffmpeg        # macOS"
  echo "    sudo apt install ffmpeg    # Ubuntu/Debian"
  echo ""
  exit 1
else
  ffmpeg_ver=$(ffmpeg -version 2>&1 | head -1)
  echo -e "  ${GREEN}✓ ffmpeg found: ${ffmpeg_ver}${RESET}"
fi
echo ""

# ── Step 4: Run Testreel ───────────────────────────────────────────────────────
echo -e "${YELLOW}STEP 4: Recording demo video${RESET}"
echo ""
echo "  Running: npx testreel testreel/demo.json"
echo "  This takes ~60–90 seconds depending on page load times."
echo ""

npx testreel testreel/demo.json

echo ""

# ── Step 5: Report output location ────────────────────────────────────────────
OUTPUT_DIR="$(pwd)/testreel-output"
echo -e "${GREEN}${BOLD}Done!${RESET}"
echo ""
echo "  Output saved to:"
echo -e "  ${BOLD}${OUTPUT_DIR}/${RESET}"
echo ""
if [[ -d "$OUTPUT_DIR" ]]; then
  latest_mp4=$(find "$OUTPUT_DIR" -name "*.mp4" -newer testreel/demo.json 2>/dev/null | sort | tail -1)
  if [[ -n "$latest_mp4" ]]; then
    echo -e "  Latest video: ${BOLD}${latest_mp4}${RESET}"
    echo ""
  fi
fi

# ── Step 6: Cleanup reminder ───────────────────────────────────────────────────
echo -e "${YELLOW}REMINDER: Clean up seed data when done${RESET}"
echo ""
echo "  If you seeded test data specifically for this recording, remove it:"
echo ""
echo "    node -e \""
echo "      const { createClient } = await import('@supabase/supabase-js');"
echo "      const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);"
echo "      await sb.from('league_members').delete().eq('league_id', '<seed-league-id>');"
echo "      console.log('Cleaned up seed league members');"
echo "    \""
echo ""
echo "  Or run your project's dedicated cleanup script if one exists."
echo ""
