import { Hidden } from './icons';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';

// A chest's drawing colors (docs/design/maquettes/Victoire.html), like an image's: the same in
// every theme, never the interface's.
const GOLD = '#FFC83D';
const PINK = '#FF3EA5';
const CYAN = '#2EE6FF';
const LID = '#7A3BFF';
const BODY = '#5A23D6';
const LOCK = '#FFE18A';
const LOCK_EDGE = '#E0A21C';
const WHITE = '#FFFFFF';
const SHADOW = '#000000';

/** The reward chest, with light bursting behind it; fills its box (240 × 210). */
export function ChestArt() {
  return (
    <Hidden className="size-full">
      <Svg width="100%" height="100%" viewBox="0 0 240 210">
        <G opacity={0.55}>
          <Polygon points="120,105 60,0 90,0" fill={GOLD} />
          <Polygon points="120,105 150,0 180,0" fill={GOLD} />
          <Polygon points="120,105 0,40 0,80" fill={PINK} />
          <Polygon points="120,105 240,40 240,80" fill={CYAN} />
        </G>
        <Ellipse cx={120} cy={196} rx={80} ry={10} fill={SHADOW} opacity={0.35} />
        <Path d="M50 70 Q50 40 120 40 Q190 40 190 70 L190 92 L50 92 Z" fill={LID} />
        <Rect x={50} y={88} width={140} height={102} rx={10} fill={BODY} />
        <Rect x={50} y={88} width={140} height={14} fill={GOLD} />
        <Rect x={112} y={40} width={16} height={150} fill={GOLD} />
        <Rect
          x={102}
          y={96}
          width={36}
          height={34}
          rx={6}
          fill={LOCK}
          stroke={LOCK_EDGE}
          strokeWidth={3}
        />
        <Circle cx={120} cy={110} r={5} fill={BODY} />
        <Rect x={117} y={112} width={6} height={10} fill={BODY} />
        <Circle cx={70} cy={30} r={5} fill={CYAN} />
        <Circle cx={176} cy={22} r={4} fill={PINK} />
        <Circle cx={200} cy={58} r={3} fill={WHITE} />
        <Circle cx={36} cy={60} r={3} fill={WHITE} />
      </Svg>
    </Hidden>
  );
}
