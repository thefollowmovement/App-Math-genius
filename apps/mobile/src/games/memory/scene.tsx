import { Picture, createPicture, type SkCanvas } from '@shopify/react-native-skia';
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
import { MEMORY, cardBox, cardTurn, createMemory, stepMemory, type MemoryWorld } from './world';

export function drawMemory(
  canvas: SkCanvas,
  world: MemoryWorld,
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
    height * MEMORY.ground,
    width * MEMORY.companionSize,
    world.mood,
    world.time,
    palette,
    still,
  );
  const count = world.cards.length;
  // A new board appears gently (at once with fewer animations).
  const dealt = still ? 1 : Math.min(1, (world.time - world.dealtAt) / MEMORY.dealMs);
  world.cards.forEach((card, position) => {
    const box = cardBox(world, position, count);
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const { face, scale } = cardTurn(world, card);
    const radius = Math.min(box.width, box.height) * 0.14;
    if (card.face === 'matched') {
      drawGlow(canvas, centerX, centerY, box.width * 0.62, palette.success, 0.35);
    }
    canvas.save();
    canvas.translate(centerX, centerY);
    canvas.scale(Math.max(0.02, scale) * (0.9 + 0.1 * dealt), 0.9 + 0.1 * dealt);
    const x = -box.width / 2;
    const y = -box.height / 2;
    if (face === 'back') {
      // The companion on the back of every card.
      drawCard(
        canvas,
        x,
        y,
        box.width,
        box.height,
        radius,
        palette.primary,
        palette.surface,
        dealt,
      );
      drawSprite(canvas, art.companion, 0, 0, Math.min(box.width, box.height) * 0.72, {
        alpha: dealt,
      });
    } else {
      const border =
        card.face === 'matched'
          ? palette.success
          : card.backAt >= 0
            ? palette.danger
            : palette.secondary;
      drawCard(canvas, x, y, box.width, box.height, radius, palette.surface, border);
      drawFitText(
        canvas,
        art.font,
        feed.labels[card.index] ?? '',
        0,
        0,
        box.width * 0.84,
        palette.foreground,
      );
    }
    canvas.restore();
  });
}

/** The board of Memory du compagnon: touch a card to turn it. */
export function MemoryScene(props: SceneProps) {
  const { settings, art, palette, feed, input, clock, limitMs, running, seed, onEvent } = props;
  const world = useSharedValue(createMemory(settings, seed));
  useWorldLoop({ world, step: stepMemory, input, feed, clock, limitMs, running, onEvent });
  const picture = useDerivedValue(
    () =>
      createPicture((canvas) => drawMemory(canvas, world.get(), feed.get(), art, palette), {
        width: settings.width,
        height: settings.height,
      }),
    [art, palette],
  );
  return <Picture picture={picture} />;
}
