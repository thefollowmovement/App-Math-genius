import { Picture, createPicture, type SkCanvas } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import type { GameArt } from '../kit/art';
import {
  drawCompanion,
  drawCover,
  drawLabel,
  drawSprite,
  drawStretched,
  type Palette,
} from '../kit/draw';
import type { SceneFeed } from '../kit/scene';
import type { SceneProps } from '../kit/scene-props';
import { useWorldLoop } from '../kit/use-world-loop';
import { FLIGHT, createFlight, pillarBoxes, stepFlight, visible, type FlightWorld } from './world';

export function drawFlight(
  canvas: SkCanvas,
  world: FlightWorld,
  feed: SceneFeed,
  art: GameArt,
  palette: Palette,
  still: boolean,
) {
  'worklet';
  const { width, height } = world;
  drawCover(canvas, art.background, width, height, 1);
  for (const pillar of world.pillars) {
    for (const box of pillarBoxes(world, pillar)) {
      drawStretched(canvas, art.sprites.pilier, box.x, box.y, box.width, box.height);
    }
    if (!pillar.gate) continue;
    // A bubble with its answer in each passage.
    pillar.gaps.forEach((gap, index) => {
      const x = pillar.x + (width * FLIGHT.pillarWidth) / 2;
      const outcome = pillar.picked === index ? pillar.outcome : 0;
      const bob = still ? 0 : Math.sin(world.time / 400 + index) * height * 0.006;
      drawSprite(canvas, art.sprites.bulle, x, gap + bob, width * 0.2, { alpha: 0.85 });
      drawLabel(
        canvas,
        art.font,
        pillar.key === feed.key ? (feed.labels[index] ?? '') : '',
        x,
        gap + bob,
        palette,
        outcome > 0 ? 'right' : outcome < 0 ? 'wrong' : 'plain',
      );
    });
  }
  if (visible(world)) {
    // Nose up when climbing, down when falling.
    const tilt = still ? 0 : Math.max(-20, Math.min(30, (world.vy / height) * 40));
    drawCompanion(
      canvas,
      art.companion,
      width * FLIGHT.x,
      world.y,
      width * FLIGHT.size,
      world.mood,
      world.time,
      palette,
      still || world.flying,
      { angle: tilt },
    );
  }
}

/** The night sky of Vol du Chaton: tap to fly. */
export function FlightScene(props: SceneProps) {
  const { settings, art, palette, feed, input, clock, limitMs, running, onEvent } = props;
  const world = useSharedValue(createFlight(settings));
  useWorldLoop({ world, step: stepFlight, input, feed, clock, limitMs, running, onEvent });
  const still = settings.reducedMotion;
  const picture = useDerivedValue(
    () =>
      createPicture((canvas) => drawFlight(canvas, world.get(), feed.get(), art, palette, still), {
        width: settings.width,
        height: settings.height,
      }),
    [art, palette, still],
  );
  return <Picture picture={picture} />;
}
