import type { ReactElement } from 'react';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';

// The drawings of the cosmetics drawn around the hero (Cosmetic.visual: 'overlay'), by the name
// the catalog gives them (packages/shared/src/cosmetics.ts). Neon colors of the art direction
// (docs/design/personnages.md): drawing colors, like an image's, never the interface's.
const PINK = '#FF3EA5';
const CYAN = '#2EE6FF';
const GOLD = '#FFC83D';
const GREEN = '#3DFFA2';
const VIOLET = '#7A3BFF';

export type OverlayArt =
  /** A glow behind the portrait, from its center outwards. */
  | { kind: 'aura'; colors: string[] }
  /** A drawing around the portrait, in a box 15 % larger than it on each side. */
  | { kind: 'frame'; draw: () => ReactElement }
  /** A sticker on the portrait (accessory). Companions are pictures (components/companion). */
  | { kind: 'emoji'; char: string };

// Frames are drawn in a 130 × 130 box whose portrait is the circle of radius 50 at 65, 65.
const ring = (color: string, width: number, radius = 50) => (
  <Circle cx={65} cy={65} r={radius} fill="none" stroke={color} strokeWidth={width} />
);

const star = (x: number, y: number, r: number) => {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = (Math.PI / 5) * index - Math.PI / 2;
    const radius = index % 2 === 0 ? r : r * 0.45;
    return `${x + radius * Math.cos(angle)} ${y + radius * Math.sin(angle)}`;
  });
  return `M${points.join(' L')} Z`;
};

const around = (count: number, radius: number) =>
  Array.from({ length: count }, (_, index) => {
    const angle = ((Math.PI * 2) / count) * index - Math.PI / 2;
    return [65 + radius * Math.cos(angle), 65 + radius * Math.sin(angle)] as const;
  });

export const COSMETIC_ART: Record<string, OverlayArt> = {
  'aura-pink': { kind: 'aura', colors: [PINK] },
  'aura-cyan': { kind: 'aura', colors: [CYAN] },
  'aura-gold': { kind: 'aura', colors: [GOLD] },
  'aura-green': { kind: 'aura', colors: [GREEN] },
  'aura-rainbow': { kind: 'aura', colors: [PINK, GOLD, CYAN] },
  'frame-neon': {
    kind: 'frame',
    draw: () => (
      <>
        {ring(PINK, 4, 52)}
        {ring(CYAN, 2, 57)}
      </>
    ),
  },
  'frame-stars': {
    kind: 'frame',
    draw: () => (
      <>
        {ring(GOLD, 3, 52)}
        {around(8, 56).map(([x, y]) => (
          <Path key={`${x}-${y}`} d={star(x, y, 7)} fill={GOLD} />
        ))}
      </>
    ),
  },
  'frame-crown': {
    kind: 'frame',
    draw: () => (
      <>
        {ring(GOLD, 4, 52)}
        <Path
          d="M45 14 L45 0 L55 8 L65 -4 L75 8 L85 0 L85 14 Z"
          fill={GOLD}
          transform="translate(0 4)"
        />
        <Circle cx={65} cy={8} r={2.5} fill={PINK} />
      </>
    ),
  },
  'frame-lightning': {
    kind: 'frame',
    draw: () => (
      <>
        {ring(CYAN, 4, 52)}
        {around(4, 57).map(([x, y]) => (
          <Path
            key={`${x}-${y}`}
            d={`M${x + 2} ${y - 9} L${x - 5} ${y + 1} L${x} ${y + 1} L${x - 2} ${y + 9} L${x + 5} ${y - 1} L${x} ${y - 1} Z`}
            fill={GOLD}
          />
        ))}
      </>
    ),
  },
  'frame-gold': {
    kind: 'frame',
    draw: () => (
      <>
        {ring(GOLD, 6, 52)}
        {ring(VIOLET, 2, 58)}
        {ring(GOLD, 2, 61)}
      </>
    ),
  },
  'emoji-bow': { kind: 'emoji', char: '🎀' },
  'emoji-cap': { kind: 'emoji', char: '🧢' },
  'emoji-sunglasses': { kind: 'emoji', char: '🕶️' },
  'emoji-top-hat': { kind: 'emoji', char: '🎩' },
  'emoji-crown': { kind: 'emoji', char: '👑' },
  'emoji-golden-mic': { kind: 'emoji', char: '🎤' },
};

/** A glow in one color, or rings of several, fading outwards. */
export function AuraDrawing({ colors, id }: { colors: string[]; id: string }) {
  // The first color around the portrait, the others in rings beyond, then nothing.
  const stops = [
    ...colors.map((color, index) => ({
      offset: 0.55 + (0.35 * index) / colors.length,
      color,
      opacity: index === 0 ? 0.95 : 0.7,
    })),
    { offset: 1, color: colors.at(-1) ?? PINK, opacity: 0 },
  ];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          {stops.map(({ offset, color, opacity }) => (
            <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
          ))}
        </RadialGradient>
      </Defs>
      <Circle cx={50} cy={50} r={50} fill={`url(#${id})`} />
    </Svg>
  );
}

export function FrameDrawing({ draw }: { draw: () => ReactElement }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 130 130">
      <G>{draw()}</G>
    </Svg>
  );
}
