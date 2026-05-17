import { useCurrentFrame, useVideoConfig, interpolate, spring, Easing } from 'remotion';
import { loadFont as loadBarlow } from '@remotion/google-fonts/BarlowCondensed';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { C, W, H } from './config';

loadBarlow();
loadMono();

export function TitleCard() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Fade in over first 20 frames
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  // Fade out over last 15 frames
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(fadeIn, fadeOut);

  const badgeSpring = spring({ fps, frame: frame - 5, config: { damping: 18, stiffness: 120 } });
  const titleSpring = spring({ fps, frame: frame - 18, config: { damping: 18, stiffness: 100 } });
  const tagSpring   = spring({ fps, frame: frame - 30, config: { damping: 20, stiffness: 90 } });
  const subSpring   = spring({ fps, frame: frame - 42, config: { damping: 22, stiffness: 80 } });

  return (
    <div style={{
      position: 'absolute', inset: 0, opacity,
      background: `radial-gradient(ellipse 80% 60% at 50% 50%, #111827, ${C.bg})`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 0,
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Badge */}
      <div style={{
        width: 80, height: 80, borderRadius: 16, background: C.accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 26,
        color: '#000', letterSpacing: '0.05em',
        marginBottom: 32,
        transform: `scale(${badgeSpring})`,
        opacity: badgeSpring,
      }}>
        TPP
      </div>

      {/* Main title */}
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
        fontSize: 96, letterSpacing: '-0.02em', lineHeight: 0.9,
        textTransform: 'uppercase', color: C.text, textAlign: 'center',
        transform: `translateY(${interpolate(titleSpring, [0, 1], [40, 0])}px)`,
        opacity: titleSpring,
      }}>
        thepickempool
      </div>

      {/* Accent bar */}
      <div style={{
        width: interpolate(tagSpring, [0, 1], [0, 320]), height: 4,
        background: C.accent, borderRadius: 2, marginTop: 24, marginBottom: 24,
      }} />

      {/* Tag */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
        fontSize: 18, letterSpacing: '0.15em', textTransform: 'uppercase',
        color: C.muted, textAlign: 'center',
        opacity: subSpring,
        transform: `translateY(${interpolate(subSpring, [0, 1], [20, 0])}px)`,
      }}>
        NFL · ATS Confidence Pick&apos;em · Private Leagues
      </div>
    </div>
  );
}
