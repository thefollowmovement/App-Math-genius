import { useTheme } from '@math-genius/ui';
import type { CompanionId, MiniGameId } from '@math-genius/shared';
import { Canvas } from '@shopify/react-native-skia';
import { useMemo, type ComponentType } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { BubblesScene } from './bubbles/scene';
import { FlightScene } from './flight/scene';
import { FishingScene } from './fishing/scene';
import { GemRainScene } from './gem-rain/scene';
import { useGameArt, type Background } from './kit/art';
import { paletteOf } from './kit/draw';
import type { SceneProps } from './kit/scene-props';
import { MemoryScene } from './memory/scene';
import { RaceScene } from './race/scene';

/**
 * The game itself: a Skia canvas the size of the scene, and the touches that drive it. Loaded on
 * demand (load-stage.ts): on the web, Skia needs CanvasKit first.
 */

const SCENES: Record<MiniGameId, ComponentType<SceneProps>> = {
  'peche-eclair': FishingScene,
  'pluie-de-gemmes': GemRainScene,
  'vol-du-chaton': FlightScene,
  'bulles-magiques': BubblesScene,
  'memory-du-compagnon': MemoryScene,
  'course-des-croquettes': RaceScene,
};

export type StageProps = Omit<SceneProps, 'art' | 'palette'> & {
  game: MiniGameId;
  background: Background;
  companion: CompanionId;
};

export default function GameStage({ game, background, companion, ...props }: StageProps) {
  const { colors } = useTheme();
  const palette = useMemo(() => paletteOf(colors), [colors]);
  const art = useGameArt(background, companion);
  const { input } = props;
  // A touch down is a tap (a flap, a catch); its move is where the companion goes.
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((event) => {
          'worklet';
          const value = input.get();
          input.set({
            ...value,
            taps: value.taps + 1,
            touches: value.touches + 1,
            touchX: event.x,
            touchY: event.y,
            x: event.x,
            y: event.y,
          });
        })
        .onUpdate((event) => {
          'worklet';
          input.set({ ...input.get(), x: event.x, y: event.y });
        })
        .onFinalize(() => {
          'worklet';
          input.set({ ...input.get(), x: null, y: null });
        }),
    [input],
  );
  const Scene = SCENES[game];
  const { width, height } = props.settings;
  return (
    <GestureDetector gesture={gesture}>
      <Canvas style={{ width, height }}>
        <Scene {...props} art={art} palette={palette} />
      </Canvas>
    </GestureDetector>
  );
}
