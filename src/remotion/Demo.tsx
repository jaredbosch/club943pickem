import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { TitleCard } from './TitleCard';
import { FeatureSlide, type SlideConfig } from './FeatureSlide';
import { CtaCard } from './CtaCard';
import { FPS, C } from './config';

// Set REMOTION_MUSIC=1 env var when music.mp3 is available in public/remotion/
const hasMusicFile = process.env.REMOTION_MUSIC === '1';

// 30 seconds at 30fps = 900 frames
// Scene durations:
const TITLE_DUR       = 90;  // 3s
const PICKS_DUR       = 180; // 6s
const GRID_DUR        = 210; // 7s
const COMMISSIONER_DUR= 180; // 6s
const DASHBOARD_DUR   = 180; // 6s
const CTA_DUR         = 60;  // 2s
// Total: 900

// With 15-frame crossfade overlaps, scenes start slightly earlier:
const FADE = 15;

const SLIDES: SlideConfig[] = [
  {
    screenshot: 'picks.png',
    tag: 'Week 1 · ATS Confidence',
    headline: 'Pick Every Game.\nOwn Your Confidence.',
    sub: 'Assign 1–16 confidence to each pick — your locks earn big, your coin flips cost little.',
    zoomOriginX: 0.5, zoomOriginY: 0.4,
    zoomStart: 1.0, zoomEnd: 1.14,
    panX: -30, panY: -10,
  },
  {
    screenshot: 'grid.png',
    tag: 'The Grid · Live After Kickoff',
    headline: 'Every Pick.\nEvery Player.\nLive.',
    sub: 'The Grid unlocks at kickoff — green for correct, red for wrong, updating every minute.',
    zoomOriginX: 0.3, zoomOriginY: 0.5,
    zoomStart: 1.05, zoomEnd: 1.18,
    panX: 40, panY: 0,
  },
  {
    screenshot: 'commissioner.png',
    tag: 'Commissioner Tools',
    headline: 'Run Your League\nLike a Pro.',
    sub: '26 players. Real names, emails, phone numbers, Venmo. One-click payment tracking.',
    zoomOriginX: 0.5, zoomOriginY: 0.4,
    zoomStart: 1.0, zoomEnd: 1.1,
    panX: 0, panY: 20,
  },
  {
    screenshot: 'dashboard.png',
    tag: 'Live Standings',
    headline: 'The Board\nNever Lies.',
    sub: 'Standings rebuild in real time every Sunday. Bump chart shows who\'s rising and fading.',
    zoomOriginX: 0.5, zoomOriginY: 0.3,
    zoomStart: 1.02, zoomEnd: 1.15,
    panX: -20, panY: 30,
  },
];

export function Demo() {
  let cursor = 0;
  const titleFrom = cursor; cursor += TITLE_DUR;
  const picksFrom = cursor - FADE; cursor += PICKS_DUR - FADE;
  const gridFrom  = cursor - FADE; cursor += GRID_DUR - FADE;
  const commFrom  = cursor - FADE; cursor += COMMISSIONER_DUR - FADE;
  const dashFrom  = cursor - FADE; cursor += DASHBOARD_DUR - FADE;
  const ctaFrom   = cursor - FADE;

  return (
    <AbsoluteFill style={{ background: C.bg }}>

      {/* Background music — drop music.mp3 in src/remotion/assets/ */}
      {hasMusicFile && (
        <Audio src={staticFile('remotion/music.mp3')} volume={0.28} />
      )}

      {/* Title card — 3s */}
      <Sequence from={titleFrom} durationInFrames={TITLE_DUR + FADE}>
        <TitleCard />
      </Sequence>

      {/* Picks — 6s */}
      <Sequence from={picksFrom} durationInFrames={PICKS_DUR + FADE}>
        <FeatureSlide config={SLIDES[0]} />
      </Sequence>

      {/* Grid — 7s */}
      <Sequence from={gridFrom} durationInFrames={GRID_DUR + FADE}>
        <FeatureSlide config={SLIDES[1]} />
      </Sequence>

      {/* Commissioner — 6s */}
      <Sequence from={commFrom} durationInFrames={COMMISSIONER_DUR + FADE}>
        <FeatureSlide config={SLIDES[2]} />
      </Sequence>

      {/* Dashboard — 6s */}
      <Sequence from={dashFrom} durationInFrames={DASHBOARD_DUR + FADE}>
        <FeatureSlide config={SLIDES[3]} />
      </Sequence>

      {/* CTA — 2s */}
      <Sequence from={ctaFrom} durationInFrames={CTA_DUR + FADE}>
        <CtaCard />
      </Sequence>

    </AbsoluteFill>
  );
}
