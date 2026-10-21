import { Picture, Skia, createPicture, type SkCanvas } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';

import type { GameArt } from '../kit/art';
import {
  drawCard,
  drawCompanion,
  drawCover,
  drawFitText,
  drawGlow,
  drawSprite,
  type Palette,
} from '../kit/draw';
import type { SceneFeed } from '../kit/scene';
import type { SceneProps } from '../kit/scene-props';
import { useWorldLoop } from '../kit/use-world-loop';
import { RACE, createRace, laneX, stepRace, type RaceWorld } from './world';

/** Dashes between the lanes, moving with the run (no road under them: less to paint). */
function drawLanes(canvas: SkCanvas, world: RaceWorld, palette: Palette) {
  'worklet';
  const { height } = world;
  const dash = Skia.Paint();
  dash.setColor(Skia.Color(palette.surface));
  dash.setAlphaf(0.9);
  const stripe = height * RACE.stripe;
  for (let lane = 0; lane < RACE.lanes.length - 1; lane++) {
    const x = (laneX(world, lane) + laneX(world, lane + 1)) / 2;
    for (let y = -stripe * 2 + world.ground; y < height; y += stripe * 2) {
      canvas.drawRRect(Skia.RRectXY(Skia.XYWHRect(x - 4, y, 8, stripe), 4, 4), dash);
    }
  }
}

export function drawRace(
  canvas: SkCanvas,
  world: RaceWorld,
  feed: SceneFeed,
  art: GameArt,
  palette: Palette,
) {
  'worklet';
  const { width, height, still } = world;
  drawCover(canvas, art.background, width, height, 1);
  drawLanes(canvas, world, palette);

  const croquetteSize = width * RACE.croquetteSize;
  for (const croquette of world.croquettes) {
    const fade = croquette.taken ? 1 - croquette.t / RACE.outcomeMs : 1;
    const lift = croquette.taken && !still ? (croquette.t / RACE.outcomeMs) * croquetteSize : 0;
    drawSprite(
      canvas,
      art.sprites.croquettes,
      laneX(world, croquette.lane),
      croquette.y - lift,
      croquetteSize,
      { alpha: Math.max(0, fade) },
    );
  }

  const doorWidth = width * RACE.doorWidth;
  const doorHeight = height * RACE.doorHeight;
  for (const door of world.doors) {
    const decided = door.outcome !== 0;
    const fade = decided ? Math.max(0, 1 - door.t / RACE.outcomeMs) : 1;
    // The doors of a question already answered show the last labels no more.
    const labels = door.key === feed.key ? feed.labels : [];
    for (let lane = 0; lane < RACE.lanes.length; lane++) {
      const label = labels[lane];
      if (label === undefined) continue;
      const picked = door.picked === lane;
      const alpha = decided && !picked ? fade : 1;
      const x = laneX(world, lane);
      const border =
        picked && door.outcome === 1
          ? palette.success
          : picked && door.outcome === -1
            ? palette.danger
            : palette.primary;
      if (picked && door.outcome === 1) {
        drawGlow(canvas, x, door.y, doorWidth * 0.62, palette.success, 0.4);
      }
      drawCard(
        canvas,
        x - doorWidth / 2,
        door.y - doorHeight / 2,
        doorWidth,
        doorHeight,
        doorHeight * 0.3,
        palette.surface,
        border,
        alpha,
      );
      drawFitText(
        canvas,
        art.bigFont,
        label,
        x,
        door.y,
        doorWidth * 0.84,
        palette.foreground,
        alpha,
      );
    }
  }

  const size = width * RACE.companionSize;
  const hop = still ? 0 : -Math.abs(Math.sin(world.time / 110)) * size * 0.08;
  drawCompanion(
    canvas,
    art.companion,
    world.x,
    height * RACE.runner + hop,
    size,
    world.mood,
    world.time,
    palette,
    still,
  );
}

/** The track of Course des croquettes: swipe to change lane. */
export function RaceScene(props: SceneProps) {
  const { settings, art, palette, feed, input, clock, limitMs, running, seed, onEvent } = props;
  const world = useSharedValue(createRace(settings, seed));
  useWorldLoop({ world, step: stepRace, input, feed, clock, limitMs, running, onEvent });
  const picture = useDerivedValue(
    () =>
      createPicture((canvas) => drawRace(canvas, world.get(), feed.get(), art, palette), {
        width: settings.width,
        height: settings.height,
      }),
    [art, palette],
  );
  return <Picture picture={picture} />;
}
