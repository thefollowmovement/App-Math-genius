import {
  PaintStyle,
  Picture,
  Skia,
  createPicture,
  type SkCanvas,
} from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import type { GameArt } from '../kit/art';
import { drawCompanion, drawCover, drawLabel, drawSprite, type Palette } from '../kit/draw';
import type { SceneFeed } from '../kit/scene';
import type { SceneProps } from '../kit/scene-props';
import { useWorldLoop } from '../kit/use-world-loop';
import { FISHING, createFishing, floatDip, stepFishing, type FishingWorld } from './world';

function lerp(from: number, to: number, progress: number) {
  'worklet';
  return from + (to - from) * Math.min(1, Math.max(0, progress));
}

export function drawFishing(
  canvas: SkCanvas,
  world: FishingWorld,
  feed: SceneFeed,
  art: GameArt,
  palette: Palette,
  still: boolean,
) {
  'worklet';
  const { width, height } = world;
  drawCover(canvas, art.background, width, height, 0.5);

  const fishSize = width * FISHING.fishSize;
  const rodX = width * FISHING.rod.x;
  const rodY = height * FISHING.rod.y;
  const dip = floatDip(world);
  const floatX = width * FISHING.float.x + dip.wiggle * 3;
  const floatY = height * FISHING.float.y + dip.dy;

  // The fish in the water, then their answers above them all (always readable).
  const swimming = world.fish.filter(
    (fish) => fish.phase !== 'reel' && fish.phase !== 'won' && fish.phase !== 'release',
  );
  for (const fish of swimming) {
    // The picture looks left.
    drawSprite(canvas, art.sprites.poisson, fish.x, fish.y, fishSize, {
      scaleX: fish.dir > 0 ? -1 : 1,
      alpha: fish.away ? 0.35 : 1,
    });
  }
  for (const fish of swimming) {
    drawLabel(
      canvas,
      art.font,
      feed.labels[fish.index] ?? '',
      fish.x,
      fish.y - fishSize * 0.55,
      palette,
      'plain',
      fish.away ? 0.35 : 1,
    );
  }

  // The rod in the companion's paws, the line and the float, under water when a fish bites.
  const rod = Skia.Paint();
  rod.setColor(Skia.Color(palette.foreground));
  rod.setStrokeWidth(4);
  rod.setAntiAlias(true);
  canvas.drawLine(
    width * (FISHING.companion.x + 0.05),
    height * (FISHING.companion.y + 0.04),
    rodX,
    rodY,
    rod,
  );
  const line = Skia.Paint();
  line.setColor(Skia.Color(palette.foreground));
  line.setAlphaf(0.55);
  line.setStrokeWidth(2);
  line.setAntiAlias(true);
  canvas.drawLine(rodX, rodY, floatX, floatY - width * 0.03, line);
  if (dip.bite) {
    const ring = Skia.Paint();
    ring.setColor(Skia.Color(palette.surface));
    ring.setStyle(PaintStyle.Stroke);
    ring.setStrokeWidth(3);
    ring.setAlphaf(0.8);
    canvas.drawOval(
      Skia.XYWHRect(floatX - width * 0.1, floatY - width * 0.015, width * 0.2, width * 0.05),
      ring,
    );
  }
  drawSprite(canvas, art.sprites.bouchon, floatX, floatY, width * FISHING.floatSize, {
    scaleY: dip.bite ? 0.75 : 1,
    angle: still ? 0 : dip.wiggle * 6,
  });

  // The fish on the line: reeled in, then kept (right) or let go (wrong).
  for (const fish of world.fish) {
    if (fish.phase !== 'reel' && fish.phase !== 'won' && fish.phase !== 'release') continue;
    const progress = fish.phase === 'reel' ? fish.t / FISHING.reelMs : 1;
    const x = lerp(floatX, rodX + width * 0.12, progress);
    const y =
      lerp(floatY, rodY + height * 0.05, progress) - Math.sin(progress * Math.PI) * height * 0.05;
    const alpha = fish.phase === 'won' ? Math.max(0, 1 - fish.t / 900) : 1;
    drawSprite(canvas, art.sprites.poisson, x, y, fishSize, { angle: -70, alpha });
    drawLabel(
      canvas,
      art.font,
      feed.labels[fish.index] ?? '',
      x,
      y - fishSize * 0.75,
      palette,
      fish.phase === 'won' ? 'right' : fish.phase === 'release' ? 'wrong' : 'plain',
      alpha,
    );
  }

  drawCompanion(
    canvas,
    art.companion,
    width * FISHING.companion.x,
    height * FISHING.companion.y,
    width * FISHING.companion.size,
    world.mood,
    world.time,
    palette,
    still,
  );
}

/** The lake of Pêche éclair. */
export function FishingScene(props: SceneProps) {
  const { settings, art, palette, feed, input, clock, limitMs, running, seed, onEvent } = props;
  const world = useSharedValue(createFishing(settings, seed));
  useWorldLoop({ world, step: stepFishing, input, feed, clock, limitMs, running, onEvent });
  const still = settings.reducedMotion;
  const picture = useDerivedValue(
    () =>
      createPicture((canvas) => drawFishing(canvas, world.get(), feed.get(), art, palette, still), {
        width: settings.width,
        height: settings.height,
      }),
    [art, palette, still],
  );
  return <Picture picture={picture} />;
}
