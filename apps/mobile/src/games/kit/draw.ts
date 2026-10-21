import type { ThemeColors } from '@math-genius/ui';
import {
  PaintStyle,
  Skia,
  type SkCanvas,
  type SkFont,
  type SkImage,
} from '@shopify/react-native-skia';

import type { Mood } from './scene';

/**
 * Drawing helpers for the scenes, run in worklets while a frame is recorded. Colors come from the
 * game's theme (kawaii), read with useTheme() and passed in: Skia takes no class names.
 */

export type Palette = Pick<
  ThemeColors,
  'surface' | 'foreground' | 'border' | 'primary' | 'secondary' | 'accent' | 'success' | 'danger'
>;

export const paletteOf = (colors: ThemeColors): Palette => ({
  surface: colors.surface,
  foreground: colors.foreground,
  border: colors.border,
  primary: colors.primary,
  secondary: colors.secondary,
  accent: colors.accent,
  success: colors.success,
  danger: colors.danger,
});

function fill(color: string, alpha = 1) {
  'worklet';
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(color));
  paint.setAlphaf(alpha);
  paint.setAntiAlias(true);
  return paint;
}

function stroke(color: string, width: number, alpha = 1) {
  'worklet';
  const paint = fill(color, alpha);
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  return paint;
}

/** The background fills the scene; `anchorY` keeps its bottom (1) or its middle (0.5) in view. */
export function drawCover(
  canvas: SkCanvas,
  image: SkImage | null,
  width: number,
  height: number,
  anchorY = 0.5,
) {
  'worklet';
  if (!image) return;
  const imageWidth = image.width();
  const imageHeight = image.height();
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  canvas.drawImageRect(
    image,
    Skia.XYWHRect(
      (imageWidth - sourceWidth) / 2,
      (imageHeight - sourceHeight) * anchorY,
      sourceWidth,
      sourceHeight,
    ),
    Skia.XYWHRect(0, 0, width, height),
    fill('#FFFFFF'),
  );
}

export type SpriteOptions = {
  /** Degrees, clockwise. */
  angle?: number;
  alpha?: number;
  scaleX?: number;
  scaleY?: number;
};

/** A picture centered on (x, y), fitting a square of `size` points (its proportions kept). */
export function drawSprite(
  canvas: SkCanvas,
  image: SkImage | null,
  x: number,
  y: number,
  size: number,
  options: SpriteOptions = {},
) {
  'worklet';
  if (!image) return;
  const imageWidth = image.width();
  const imageHeight = image.height();
  const fit = size / Math.max(imageWidth, imageHeight);
  const scaleX = options.scaleX ?? 1;
  const scaleY = options.scaleY ?? 1;
  const width = imageWidth * fit * Math.abs(scaleX);
  const height = imageHeight * fit * Math.abs(scaleY);
  canvas.save();
  canvas.translate(x, y);
  if (options.angle) canvas.rotate(options.angle, 0, 0);
  // A mirrored picture (a fish swimming the other way): the canvas flips, the rectangle does not.
  if (scaleX < 0 || scaleY < 0) canvas.scale(scaleX < 0 ? -1 : 1, scaleY < 0 ? -1 : 1);
  canvas.drawImageRect(
    image,
    Skia.XYWHRect(0, 0, imageWidth, imageHeight),
    Skia.XYWHRect(-width / 2, -height / 2, width, height),
    fill('#FFFFFF', options.alpha ?? 1),
  );
  canvas.restore();
}

/** A stretched picture, for a pillar of any height. */
export function drawStretched(
  canvas: SkCanvas,
  image: SkImage | null,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  'worklet';
  if (!image || height <= 0) return;
  canvas.drawImageRect(
    image,
    Skia.XYWHRect(0, 0, image.width(), image.height()),
    Skia.XYWHRect(x, y, width, height),
    fill('#FFFFFF'),
  );
}

/** A text's width in a font (SkFont.measureText does not exist on the web). */
export function textWidth(font: SkFont, text: string): number {
  'worklet';
  return font.getGlyphWidths(font.getGlyphIDs(text)).reduce((total, width) => total + width, 0);
}

/** A text centered on (x, y), made smaller when it is wider than `maxWidth`. */
export function drawFitText(
  canvas: SkCanvas,
  font: SkFont | null,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  color: string,
  alpha = 1,
) {
  'worklet';
  if (!font || text === '') return;
  const measured = textWidth(font, text);
  const scale = measured > maxWidth ? maxWidth / measured : 1;
  canvas.save();
  canvas.translate(x, y);
  canvas.scale(scale, scale);
  canvas.drawText(text, -measured / 2, font.getSize() * 0.36, fill(color, alpha), font);
  canvas.restore();
}

/** A rounded box, filled and outlined. */
export function drawCard(
  canvas: SkCanvas,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  background: string,
  border: string,
  alpha = 1,
) {
  'worklet';
  const box = Skia.RRectXY(Skia.XYWHRect(x, y, width, height), radius, radius);
  canvas.drawRRect(box, fill(background, alpha));
  canvas.drawRRect(box, stroke(border, 3, alpha));
}

export type LabelStyle = 'plain' | 'right' | 'wrong';

/** An answer in a round white tag, as fish, gems and doors carry it. */
export function drawLabel(
  canvas: SkCanvas,
  font: SkFont | null,
  text: string,
  x: number,
  y: number,
  palette: Palette,
  style: LabelStyle = 'plain',
  alpha = 1,
) {
  'worklet';
  if (!font || text === '') return;
  const size = font.getSize();
  const measured = textWidth(font, text);
  const height = size * 1.45;
  const width = Math.max(height, measured + size);
  const box = Skia.RRectXY(
    Skia.XYWHRect(x - width / 2, y - height / 2, width, height),
    height / 2,
    height / 2,
  );
  const background =
    style === 'right' ? palette.success : style === 'wrong' ? palette.danger : palette.surface;
  canvas.drawRRect(box, fill(background, alpha));
  canvas.drawRRect(box, stroke(style === 'plain' ? palette.primary : background, 3, alpha));
  canvas.drawText(
    text,
    x - measured / 2,
    y + size * 0.36,
    fill(style === 'wrong' ? palette.surface : palette.foreground, alpha),
    font,
  );
}

/** Five little stars in a ring of `reach` around (x, y), turned by `turn` radians. */
export function drawSparkles(
  canvas: SkCanvas,
  x: number,
  y: number,
  reach: number,
  color: string,
  alpha = 1,
  turn = 0,
) {
  'worklet';
  if (alpha <= 0) return;
  const paint = fill(color, alpha);
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2 + turn;
    canvas.drawCircle(
      x + Math.cos(angle) * reach,
      y + Math.sin(angle) * reach,
      reach * 0.09,
      paint,
    );
  }
}

const JOY_MS = 700;
const SAD_MS = 1200;

/**
 * The companion, alive: a little hop and sparkles on a right answer, a droop and a drop of sweat
 * on a mistake (never a scolding), a slow bob otherwise. `still` (fewer animations) keeps the
 * sparkles and the drop, which tell what happened, and drops the movement.
 */
export function drawCompanion(
  canvas: SkCanvas,
  image: SkImage | null,
  x: number,
  y: number,
  size: number,
  mood: Mood,
  time: number,
  palette: Palette,
  still: boolean,
  options: SpriteOptions = {},
) {
  'worklet';
  const elapsed = time - mood.since;
  let dy = 0;
  let angle = options.angle ?? 0;
  let scaleY = options.scaleY ?? 1;
  if (mood.kind === 'joy' && elapsed < JOY_MS) {
    if (!still) dy = -Math.sin((elapsed / JOY_MS) * Math.PI) * size * 0.25;
    drawSparkles(
      canvas,
      x,
      y + dy,
      size * (0.55 + (still ? 0.1 : (elapsed / JOY_MS) * 0.2)),
      palette.accent,
      1 - elapsed / JOY_MS,
      still ? 0 : elapsed / 300,
    );
  } else if (mood.kind === 'sad' && elapsed < SAD_MS) {
    if (!still) {
      angle += -8 * Math.sin(Math.min(1, elapsed / 200) * (Math.PI / 2));
      scaleY *= 0.95;
    }
    const drop = Skia.Path.Make();
    const dropX = x + size * 0.38;
    const dropY = y - size * 0.32;
    const r = size * 0.06;
    drop.moveTo(dropX, dropY - r * 2.2);
    drop.quadTo(dropX + r * 1.2, dropY - r * 0.2, dropX, dropY + r);
    drop.quadTo(dropX - r * 1.2, dropY - r * 0.2, dropX, dropY - r * 2.2);
    canvas.drawPath(drop, fill(palette.secondary));
  } else if (!still) {
    dy = Math.sin(time / 500) * size * 0.03;
  }
  drawSprite(canvas, image, x, y + dy, size, { ...options, angle, scaleY });
}

/** A soft glow under something that matters (the right fish once caught, a picked bubble). */
export function drawGlow(
  canvas: SkCanvas,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 0.5,
) {
  'worklet';
  canvas.drawCircle(x, y, r, fill(color, alpha));
}
