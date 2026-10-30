import { Picture, createPicture, type SkCanvas } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import type { GameArt } from '../kit/art';
import {
  drawCompanion,
  drawCover,
  drawGlow,
  drawLabel,
  drawSprite,
  type Palette,
} from '../kit/draw';
import type { SceneFeed } from '../kit/scene';
import type { SceneProps } from '../kit/scene-props';
import { useWorldLoop } from '../kit/use-world-loop';
import { GEM_RAIN, createGemRain, stepGemRain, type GemRainWorld } from './world';

export function drawGemRain(
  canvas: SkCanvas,
  world: GemRainWorld,
  feed: SceneFeed,
  art: GameArt,
  palette: Palette,
  still: boolean,
) {
  'worklet';
  const { width, height } = world;
  drawCover(canvas, art.background, width, height, 1);
  const size = width * GEM_RAIN.dropSize;
  for (const drop of world.drops) {
    const fade =
      drop.phase === 'fall' || drop.phase === 'caught' ? 1 : 1 - drop.t / GEM_RAIN.outcomeMs;
    if (drop.kind === 'croquette') {
      drawSprite(canvas, art.sprites.croquettes, drop.x, drop.y, size * 0.8, { alpha: fade });
    } else if (drop.kind === 'bomb' || drop.phase === 'boom') {
      // A bomb, or the wrong gem it turned into: it swells and fades.
      const swell = drop.phase === 'boom' && !still ? 1 + drop.t / GEM_RAIN.outcomeMs : 1;
      drawSprite(canvas, art.sprites.bombe, drop.x, drop.y, size * swell, { alpha: fade });
    } else {
      if (drop.phase === 'won')
        drawGlow(canvas, drop.x, drop.y, size * 0.7, palette.accent, 0.6 * fade);
      const spin = still || drop.phase !== 'fall' ? 0 : Math.sin(drop.y / 40) * 8;
      drawSprite(canvas, art.sprites.gemme, drop.x, drop.y, size, { alpha: fade, angle: spin });
      drawLabel(
        canvas,
        art.font,
        feed.labels[drop.index] ?? '',
        drop.x,
        drop.y + size * 0.62,
        palette,
        drop.phase === 'won' ? 'right' : 'plain',
        fade,
      );
    }
  }
  drawCompanion(
    canvas,
    art.companion,
    world.x,
    height * GEM_RAIN.ground,
    width * GEM_RAIN.companionSize,
    world.mood,
    world.time,
    palette,
    still,
  );
}

/** The rain of Pluie de gemmes: slide a finger to move the companion. */
export function GemRainScene(props: SceneProps) {
  const { settings, art, palette, feed, input, clock, limitMs, running, seed, onEvent } = props;
  const world = useSharedValue(createGemRain(settings, seed));
  useWorldLoop({ world, step: stepGemRain, input, feed, clock, limitMs, running, onEvent });
  const still = settings.reducedMotion;
  const picture = useDerivedValue(
    () =>
      createPicture((canvas) => drawGemRain(canvas, world.get(), feed.get(), art, palette, still), {
        width: settings.width,
        height: settings.height,
      }),
    [art, palette, still],
  );
  return <Picture picture={picture} />;
}
