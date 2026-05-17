import { Composition } from 'remotion';
import { Demo } from './Demo';
import { FPS, DURATION, W, H } from './config';

export function RemotionRoot() {
  return (
    <Composition
      id="Demo"
      component={Demo}
      durationInFrames={DURATION}
      fps={FPS}
      width={W}
      height={H}
    />
  );
}
