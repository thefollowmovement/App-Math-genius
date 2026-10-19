import { useTheme, View, cx, type ThemeArt } from '@math-genius/ui';
import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg';

// The mascot: a round creature, drawn in the colors of the theme (art.mascot) and crowned by its
// style (art.mascotStyle). 120 × 120 box, body centered at 60, 70. Decorative: what it says is
// text next to it.

export type MascotMood = 'hello' | 'cheer' | 'comfort';

const SIZES = { sm: 'size-16', md: 'size-24', lg: 'size-40' } as const;

type Colors = ThemeArt['mascot'];
const OUTLINE = 3;

// Arms, as [cx, cy, rotation] for the left and the right one.
const ARMS: Record<MascotMood, [number, number, number][]> = {
  hello: [
    [24, 80, 25],
    [100, 50, -35],
  ],
  cheer: [
    [20, 48, 35],
    [100, 48, -35],
  ],
  comfort: [
    [24, 82, 15],
    [96, 82, -15],
  ],
};

function Crest({
  style,
  colors,
  front,
}: {
  style: ThemeArt['mascotStyle'];
  colors: Colors;
  front: boolean;
}) {
  const ink = { stroke: colors.ink, strokeWidth: OUTLINE, strokeLinejoin: 'round' as const };
  if (style === 'ears' && !front) {
    return (
      <>
        <Path d="M30 50 L26 16 L54 36 Z" fill={colors.body} {...ink} />
        <Path d="M90 50 L94 16 L66 36 Z" fill={colors.body} {...ink} />
        <Path d="M33 42 L31 26 L45 36 Z" fill={colors.cheek} />
        <Path d="M87 42 L89 26 L75 36 Z" fill={colors.cheek} />
      </>
    );
  }
  if (style === 'antenna' && !front) {
    return (
      <>
        {/* The stem in the accent color: the ink may be the background's (space). */}
        <Line x1={60} y1={36} x2={60} y2={16} stroke={colors.accent} strokeWidth={OUTLINE + 1} />
        <Circle cx={60} cy={12} r={7} fill={colors.accent} {...ink} />
      </>
    );
  }
  if (style === 'headband' && front) {
    return (
      <>
        <Path d="M98 50 L114 40 L112 56 Z" fill={colors.accent} {...ink} />
        <Path d="M98 54 L116 62 L104 68 Z" fill={colors.accent} {...ink} />
        <Path d="M22 54 Q60 38 98 52 L98 62 Q60 48 22 64 Z" fill={colors.accent} {...ink} />
      </>
    );
  }
  return null;
}

function Face({ mood, colors }: { mood: MascotMood; colors: Colors }) {
  const line = {
    stroke: colors.ink,
    strokeWidth: OUTLINE,
    strokeLinecap: 'round' as const,
    fill: 'none',
  };
  const eyes =
    mood === 'cheer' ? (
      <>
        <Path d="M39 66 Q46 56 53 66" {...line} />
        <Path d="M67 66 Q74 56 81 66" {...line} />
      </>
    ) : (
      <>
        {[46, 74].map((cx) => (
          <G key={cx}>
            <Ellipse cx={cx} cy={64} rx={5} ry={6.5} fill={colors.ink} />
            <Circle cx={cx + 1.8} cy={61.5} r={1.8} fill={colors.belly} />
          </G>
        ))}
        {mood === 'comfort' ? (
          <>
            <Path d="M39 53 L51 51" {...line} />
            <Path d="M81 53 L69 51" {...line} />
          </>
        ) : null}
      </>
    );
  const mouth =
    mood === 'cheer' ? (
      <>
        <Path d="M49 74 Q60 92 71 74 Z" fill={colors.ink} />
        <Ellipse cx={60} cy={83} rx={5} ry={3} fill={colors.cheek} />
      </>
    ) : (
      <Path d={mood === 'comfort' ? 'M54 77 Q60 81 66 77' : 'M53 75 Q60 82 67 75'} {...line} />
    );
  return (
    <>
      {eyes}
      <Circle cx={35} cy={75} r={5} fill={colors.cheek} />
      <Circle cx={85} cy={75} r={5} fill={colors.cheek} />
      {mouth}
    </>
  );
}

type MascotProps = {
  mood?: MascotMood;
  size?: keyof typeof SIZES;
  /** Layout only. */
  className?: string;
};

/** The app's mascot, in the active theme's style. */
export function Mascot({ mood = 'hello', size = 'md', className }: MascotProps) {
  const { art } = useTheme();
  const colors = art.mascot;
  const ink = { stroke: colors.ink, strokeWidth: OUTLINE };
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={cx(SIZES[size], className)}
    >
      <Svg width="100%" height="100%" viewBox="0 0 120 120">
        <Crest style={art.mascotStyle} colors={colors} front={false} />
        {ARMS[mood].map(([cx, cy, rotation]) => (
          <Ellipse
            key={cx}
            cx={cx}
            cy={cy}
            rx={8}
            ry={13}
            fill={colors.body}
            {...ink}
            transform={`rotate(${rotation} ${cx} ${cy})`}
          />
        ))}
        <Ellipse cx={46} cy={108} rx={10} ry={6} fill={colors.accent} {...ink} />
        <Ellipse cx={74} cy={108} rx={10} ry={6} fill={colors.accent} {...ink} />
        <Ellipse cx={60} cy={70} rx={40} ry={37} fill={colors.body} {...ink} />
        <Ellipse cx={60} cy={84} rx={23} ry={17} fill={colors.belly} />
        <Crest style={art.mascotStyle} colors={colors} front />
        <Face mood={mood} colors={colors} />
      </Svg>
    </View>
  );
}
