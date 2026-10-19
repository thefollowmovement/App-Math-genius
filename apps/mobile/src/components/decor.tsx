import { useTheme, View, type ThemeArt } from '@math-genius/ui';
import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg';

// Corner drawings in a 160 × 160 box, drawn top right and again, turned, bottom left. They stay in
// the corners so that text never sits on them.
type Colors = ThemeArt['decorColors'];

function Bubbles({ colors: [soft, accent] }: { colors: Colors }) {
  return (
    <>
      <Circle cx={124} cy={30} r={44} fill={soft} />
      <Circle cx={52} cy={18} r={14} fill={accent} />
      <Circle cx={146} cy={104} r={18} fill={accent} />
      <Circle cx={84} cy={78} r={8} fill={soft} />
    </>
  );
}

// Lines that burst from the corner, as in a comic.
const SPEED_LINES = [8, 20, 32, 44, 56, 68, 80].map((degrees, index) => {
  const angle = (degrees * Math.PI) / 180;
  const [inner, outer] = [index % 2 === 0 ? 56 : 76, 140];
  return {
    x1: 160 - inner * Math.cos(angle),
    y1: inner * Math.sin(angle),
    x2: 160 - outer * Math.cos(angle),
    y2: outer * Math.sin(angle),
  };
});

function SpeedLines({ colors: [soft, accent] }: { colors: Colors }) {
  return (
    <>
      {SPEED_LINES.map((line, index) => (
        <Line
          key={index}
          {...line}
          stroke={index % 2 === 0 ? soft : accent}
          strokeWidth={index % 2 === 0 ? 8 : 4}
          strokeLinecap="round"
        />
      ))}
    </>
  );
}

// A four-point star of radius 6.
const sparkle = (x: number, y: number) =>
  `M${x} ${y - 6} Q${x + 1} ${y - 1} ${x + 6} ${y} Q${x + 1} ${y + 1} ${x} ${y + 6} ` +
  `Q${x - 1} ${y + 1} ${x - 6} ${y} Q${x - 1} ${y - 1} ${x} ${y - 6}Z`;

function Stars({ colors: [planet, star] }: { colors: Colors }) {
  return (
    <>
      <Circle cx={112} cy={46} r={32} fill={planet} />
      <Ellipse
        cx={112}
        cy={46}
        rx={52}
        ry={11}
        fill="none"
        stroke={planet}
        strokeWidth={4}
        transform="rotate(-20 112 46)"
      />
      {[
        [34, 26],
        [62, 112],
        [148, 128],
        [22, 84],
      ].map(([x = 0, y = 0]) => (
        <Path key={`${x}-${y}`} d={sparkle(x, y)} fill={star} />
      ))}
      <Circle cx={90} cy={140} r={2} fill={star} />
    </>
  );
}

const DRAWINGS = { bubbles: Bubbles, 'speed-lines': SpeedLines, stars: Stars } as const;

function Corner({ turned }: { turned: boolean }) {
  const { art } = useTheme();
  const Drawing = DRAWINGS[art.decor];
  return (
    <Svg width="100%" height="100%" viewBox="0 0 160 160">
      <G transform={turned ? 'rotate(180 80 80)' : undefined}>
        <Drawing colors={art.decorColors} />
      </G>
    </Svg>
  );
}

/** The theme's backdrop (Screen's `backdrop`): a drawing in two corners of the child's screens. */
export function Decor() {
  return (
    <View
      className="pointer-events-none absolute inset-0"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View className="absolute right-0 top-0 size-40">
        <Corner turned={false} />
      </View>
      <View className="absolute bottom-0 left-0 size-40">
        <Corner turned />
      </View>
    </View>
  );
}
