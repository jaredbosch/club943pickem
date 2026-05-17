#!/bin/bash
set -e

echo "=== Rendering thepickempool demo video ==="

# Check for music file
MUSIC="public/remotion/music.mp3"
MUSIC_FLAG=""
if [ -f "$MUSIC" ]; then
  echo "✓ Music found — rendering with audio"
  MUSIC_FLAG="REMOTION_MUSIC=1"
else
  echo ""
  echo "⚠  No music file found at $MUSIC"
  echo "   Download a free track from https://pixabay.com/music/"
  echo "   Search: 'corporate ambient' or 'tech background'"
  echo "   Save as: $MUSIC — then re-run this script"
  echo "   Rendering without music for now..."
  echo ""
fi

# Render
env $MUSIC_FLAG npx remotion render \
  src/remotion/index.ts \
  Demo \
  public/demo.mp4 \
  --codec=h264 \
  --crf=18 \
  --log=verbose

echo ""
echo "✓ Rendered: public/demo.mp4"
echo "  Deploy with: git add public/demo.mp4 && git commit -m 'chore: update demo video' && git push"
