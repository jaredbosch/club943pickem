import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { loadFont as loadBarlow } from '@remotion/google-fonts/BarlowCondensed';
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono';
import { C } from './config';

loadBarlow();
loadMono();

export function CtaCard() {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  const line1 = spring({ fps, frame: frame - 10, config: { damping: 18, stiffness: 100 } });
  const line2 = spring({ fps, frame: frame - 22, config: { damping: 18, stiffness: 100 } });
  const url   = spring({ fps, frame: frame - 35, config: { damping: 20, stiffness: 80 } });

  return (
    <div style={{
      position: 'absolute', inset: 0, opacity: fadeIn,
      background: `radial-gradient(ellipse 70% 60% at 50% 50%, #1a2235, ${C.bg})`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 0,
    }}>
      {/* Grid background */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Main CTA text */}
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
        fontSize: 100, lineHeight: 0.9, letterSpacing: '-0.025em',
        textTransform: 'uppercase', color: C.text, textAlign: 'center',
        opacity: line1,
        transform: `translateY(${interpolate(line1, [0, 1], [30, 0])}px)`,
      }}>
        Free.
      </div>

      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900,
        fontSize: 100, lineHeight: 0.9, letterSpacing: '-0.025em',
        textTransform: 'uppercase', color: C.accent, textAlign: 'center',
        marginTop: 8, marginBottom: 40,
        opacity: line2,
        transform: `translateY(${interpolate(line2, [0, 1], [30, 0])}px)`,
      }}>
        Private. Start in 30 seconds.
      </div>

      {/* URL pill */}
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
        fontSize: 22, letterSpacing: '0.06em',
        color: C.bg, background: C.accent,
        padding: '14px 40px', borderRadius: 8,
        opacity: url,
        transform: `scale(${interpolate(url, [0, 1], [0.85, 1])})`,
      }}>
        thepickempool.com
      </div>
    </div>
  );
}
