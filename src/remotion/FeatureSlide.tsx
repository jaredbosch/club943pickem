import { useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile } from 'remotion';
import { loadFont as loadBarlow } from '@remotion/google-fonts/BarlowCondensed';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { C } from './config';

loadBarlow();
loadMono();

export type SlideConfig = {
  screenshot: string;
  tag: string;
  headline: string;
  sub: string;
  // Ken Burns: where to zoom toward (0-1 coords)
  zoomOriginX?: number;
  zoomOriginY?: number;
  zoomStart?: number; // scale at frame 0
  zoomEnd?: number;   // scale at last frame
  panX?: number;      // px pan over duration
  panY?: number;
};

export function FeatureSlide({ config }: { config: SlideConfig }) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const {
    screenshot, tag, headline, sub,
    zoomOriginX = 0.5, zoomOriginY = 0.5,
    zoomStart = 1.0, zoomEnd = 1.12,
    panX = 0, panY = 0,
  } = config;

  // Fade in / out
  const fadeIn  = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(fadeIn, fadeOut);

  // Ken Burns
  const progress = frame / durationInFrames;
  const scale = zoomStart + (zoomEnd - zoomStart) * progress;
  const tx = panX * progress;
  const ty = panY * progress;

  // Text springs
  const tagSpring = spring({ fps, frame: frame - 25, config: { damping: 20, stiffness: 100 } });
  const h1Spring  = spring({ fps, frame: frame - 38, config: { damping: 18, stiffness: 90 } });
  const subSpring = spring({ fps, frame: frame - 52, config: { damping: 20, stiffness: 80 } });

  return (
    <div style={{ position: 'absolute', inset: 0, opacity, overflow: 'hidden', background: C.bg }}>

      {/* Screenshot with Ken Burns */}
      <div style={{
        position: 'absolute', inset: 0,
        transform: `scale(${scale}) translate(${tx}px, ${ty}px)`,
        transformOrigin: `${zoomOriginX * 100}% ${zoomOriginY * 100}%`,
      }}>
        <Img
          src={staticFile(`remotion/screenshots/${screenshot}`)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
        />
      </div>

      {/* Dark gradient overlay at bottom */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.1) 65%, transparent 100%)',
      }} />

      {/* Top vignette */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 120,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
      }} />

      {/* Text content — bottom-left */}
      <div style={{
        position: 'absolute', bottom: 80, left: 100, right: 100,
      }}>
        {/* Tag */}
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
          fontSize: 15, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: C.accent,
          marginBottom: 16,
          opacity: tagSpring,
          transform: `translateY(${interpolate(tagSpring, [0, 1], [16, 0])}px)`,
        }}>
          <div style={{ width: 28, height: 2, background: C.accent, marginRight: 12, borderRadius: 1 }} />
          {tag}
        </div>

        {/* Headline */}
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
          fontSize: 72, lineHeight: 0.95, letterSpacing: '-0.02em',
          textTransform: 'uppercase', color: C.text,
          marginBottom: 20,
          opacity: h1Spring,
          transform: `translateY(${interpolate(h1Spring, [0, 1], [24, 0])}px)`,
        }}>
          {headline}
        </div>

        {/* Sub */}
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 500,
          fontSize: 28, color: C.muted, letterSpacing: '0.01em',
          opacity: subSpring,
          transform: `translateY(${interpolate(subSpring, [0, 1], [18, 0])}px)`,
        }}>
          {sub}
        </div>
      </div>
    </div>
  );
}
