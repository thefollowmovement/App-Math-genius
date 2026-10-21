import { Picture, createPicture, type SkCanvas } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import type { GameArt } from '../kit/art';
import {
  drawCompanion,
  drawCover,
  drawGlow,
  drawLabel,
  drawSparkles,
  drawSprite,
  type Palette,
} from '../kit/draw';
import type { SceneFeed } from '../kit/scene';
import type { SceneProps } from '../kit/scene-props';
import { useWorldLoop } from '../kit/use-world-loop';
import {
  BUBBLES,
  bubbleRadius,
  bubbleX,
  createBubbles,
  stepBubbles,
  type BubblesWorld,
} from './world';

export function drawBubbles(
  canvas: SkCanvas,
  world: BubblesWorld,
  feed: SceneFeed,
  art: GameArt,
  palette: Palette,
) {
  'worklet';
  const { width, height, still } = world;
  drawCover(canvas, art.background, width, height, 1);
  drawCompanion(
    canvas,
    art.companion,
    width / 2,
    height * BUBBLES.ground,
    width * BUBBLES.companionSize,
    world.mood,
    world.time,
    palette,
    still,
  );
  const size = width * BUBBLES.size;
  const radius = bubbleRadius(world);
  for (const bubble of world.bubbles) {
    const progress = Math.min(1, bubble.t / BUBBLES.outcomeMs);
    const alpha = bubble.phase === 'rise' ? 1 : 1 - progress;
    const shaking = bubble.shake >= 0 ? 1 - bubble.shake / BUBBLES.shakeMs : 0;
    const dx = still ? 0 : Math.sin(bubble.shake / 25) * width * 0.015 * shaking;
    const x = bubbleX(world, bubble) + dx;
    const selected = bubble.phase === 'rise' && world.selected.includes(bubble.index);
    if (selected) drawGlow(canvas, x, bubble.y, radius * 1.12, palette.accent, 0.7);
    if (shaking > 0) drawGlow(canvas, x, bubble.y, radius * 1.12, palette.danger, 0.5 * shaking);
    const swell = bubble.phase === 'burst' && !still ? 1 + progress * 0.5 : selected ? 1.08 : 1;
    drawSprite(canvas, art.sprites.bulle, x, bubble.y, size * swell, { alpha });
    if (bubble.phase === 'burst') {
      drawSparkles(
        canvas,
        x,
        bubble.y,
        radius * (still ? 1.1 : 1 + progress),
        palette.accent,
        alpha,
      );
    }
    drawLabel(
      canvas,
      art.font,
      feed.labels[bubble.index] ?? '',
      x,
      bubble.y,
      palette,
      bubble.phase === 'burst' ? 'right' : shaking > 0 ? 'wrong' : 'plain',
      alpha,
    );
  }
}

/** The bubbles of Bulles magiques: touch two that make the target. */
export function BubblesScene(props: SceneProps) {
  const { settings, art, palette, feed, input, clock, limitMs, running, seed, onEvent } = props;
  const world = useSharedValue(createBubbles(settings, seed));
  useWorldLoop({ world, step: stepBubbles, input, feed, clock, limitMs, running, onEvent });
  const picture = useDerivedValue(
    () =>
      createPicture((canvas) => drawBubbles(canvas, world.get(), feed.get(), art, palette), {
        width: settings.width,
        height: settings.height,
      }),
    [art, palette],
  );
  return <Picture picture={picture} />;
}
