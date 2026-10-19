import type { AccessoryCode, Avatar } from '@math-genius/shared';
import type { ReactElement } from 'react';
import { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { CHEEK, CLOTH, GOLD, INK, OUTFIT, SHADE, SILVER, WHITE } from './palette';

// The avatar is drawn in a 120 × 120 box: shoulders at the bottom, the head (center 60, 54,
// radius 24) above, the eyes at 51 and 69. The caller clips it to a circle.

type Draw = (color: string) => ReactElement | null;

const TORSO = 'M16 120 C16 98 34 88 60 88 C86 88 104 98 104 120 Z';

/** A darker layer over a color, for folds and hoods. */
const shade = (opacity = 0.18) => ({ fill: SHADE, fillOpacity: opacity });

export const OUTFITS: Record<Avatar['outfit'], Draw> = {
  tshirt: (color) => (
    <>
      <Path d={TORSO} fill={color} />
      <Path d="M50 88 Q60 99 70 88 Z" {...shade(0.12)} />
    </>
  ),
  hoodie: (color) => (
    <>
      <Path d={TORSO} fill={color} />
      <Path d="M38 92 Q60 78 82 92 L78 99 Q60 88 42 99 Z" {...shade()} />
      <Line x1={55} y1={94} x2={54} y2={108} stroke={WHITE} strokeWidth={2} strokeLinecap="round" />
      <Line x1={65} y1={94} x2={66} y2={108} stroke={WHITE} strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  dress: (color) => (
    <>
      <Path d={TORSO} fill={color} />
      <Circle cx={52} cy={91} r={7} fill={WHITE} />
      <Circle cx={68} cy={91} r={7} fill={WHITE} />
      <Circle cx={60} cy={104} r={2.5} fill={WHITE} />
    </>
  ),
  overalls: (color) => (
    <>
      <Path d={TORSO} fill={CLOTH} />
      <Rect x={42} y={98} width={36} height={24} rx={5} fill={color} />
      <Line x1={46} y1={100} x2={40} y2={89} stroke={color} strokeWidth={5} strokeLinecap="round" />
      <Line x1={74} y1={100} x2={80} y2={89} stroke={color} strokeWidth={5} strokeLinecap="round" />
      <Circle cx={47} cy={102} r={2} fill={GOLD} />
      <Circle cx={73} cy={102} r={2} fill={GOLD} />
    </>
  ),
  sport: (color) => (
    <>
      <Path d={TORSO} fill={color} />
      <Path d="M51 88 L60 97 L69 88" stroke={WHITE} strokeWidth={3} fill="none" />
      <Line x1={22} y1={108} x2={34} y2={94} stroke={WHITE} strokeWidth={3} />
      <Line x1={98} y1={108} x2={86} y2={94} stroke={WHITE} strokeWidth={3} />
    </>
  ),
  cape: (color) => (
    <>
      <Path d="M10 120 L28 88 L92 88 L110 120 Z" fill={color} />
      <Path d="M10 120 L28 88 L92 88 L110 120 Z" {...shade(0.3)} />
      <Path d="M24 120 C24 100 38 92 60 92 C82 92 96 100 96 120 Z" fill={color} />
      <Path
        d="M60 100 L63 106 L70 106 L64.5 110 L66.5 117 L60 113 L53.5 117 L55.5 110 L50 106 L57 106 Z"
        fill={GOLD}
      />
      <Circle cx={44} cy={91} r={3.5} fill={GOLD} />
      <Circle cx={76} cy={91} r={3.5} fill={GOLD} />
    </>
  ),
  astronaut: (color) => (
    <>
      <Path d={TORSO} fill={CLOTH} />
      <Ellipse cx={60} cy={89} rx={19} ry={7} fill={SILVER} />
      <Rect x={44} y={101} width={14} height={9} rx={2} fill={color} />
      <Circle cx={76} cy={106} r={5} fill={color} />
      <Circle cx={76} cy={106} r={2} fill={WHITE} />
    </>
  ),
};

// The top of the hair, over the forehead.
const CAP = 'M34 54 C33 31 46 24 60 24 C74 24 87 31 86 54 C80 44 72 39 60 39 C48 39 40 44 34 54 Z';
const PARTED =
  'M34 56 C33 32 46 24 60 24 C74 24 87 32 86 56 C82 44 70 37 61 33 C52 37 40 44 34 56 Z';

/** Hair behind the head (drawn first) and over it. */
export const HAIRS: Record<Avatar['hair'], { back?: Draw; front?: Draw }> = {
  short: { front: (color) => <Path d={CAP} fill={color} /> },
  curly: {
    front: (color) => (
      <G fill={color}>
        {[
          [37, 50, 8],
          [40, 38, 9],
          [49, 30, 10],
          [61, 27, 11],
          [73, 30, 10],
          [81, 39, 9],
          [84, 50, 7],
        ].map(([cx = 0, cy = 0, r = 0]) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </G>
    ),
  },
  long: {
    back: (color) => (
      <Path d="M32 56 C30 30 46 22 60 22 C74 22 90 30 88 56 L92 98 L28 98 Z" fill={color} />
    ),
    front: (color) => <Path d={PARTED} fill={color} />,
  },
  bun: {
    back: (color) => <Circle cx={60} cy={22} r={11} fill={color} />,
    front: (color) => <Path d={CAP} fill={color} />,
  },
  braids: {
    back: (color) => (
      <G fill={color}>
        {[64, 74, 84, 94].map((cy) => (
          <G key={cy}>
            <Ellipse cx={33} cy={cy} rx={6} ry={6} />
            <Ellipse cx={87} cy={cy} rx={6} ry={6} />
          </G>
        ))}
      </G>
    ),
    front: (color) => <Path d={PARTED} fill={color} />,
  },
  spiky: {
    front: (color) => (
      <Path
        d="M34 52 L35 34 L43 40 L47 23 L55 33 L61 18 L67 33 L75 23 L78 40 L86 34 L86 52 C79 43 71 39 60 39 C49 39 41 43 34 52 Z"
        fill={color}
      />
    ),
  },
  pigtails: {
    back: (color) => (
      <G fill={color}>
        <Ellipse cx={28} cy={50} rx={9} ry={14} />
        <Ellipse cx={92} cy={50} rx={9} ry={14} />
      </G>
    ),
    front: (color) => (
      <>
        <Path d={PARTED} fill={color} />
        <Circle cx={35} cy={44} r={3} fill={CHEEK} />
        <Circle cx={85} cy={44} r={3} fill={CHEEK} />
      </>
    ),
  },
  none: {},
};

const eye = (cx: number) => (
  <G key={cx}>
    <Circle cx={cx} cy={56} r={3.6} fill={INK} />
    <Circle cx={cx + 1.2} cy={54.8} r={1.1} fill={WHITE} />
  </G>
);
const closedEye = (cx: number) => (
  <Path
    key={cx}
    d={`M${cx - 4} 57 Q${cx} 52 ${cx + 4} 57`}
    stroke={INK}
    strokeWidth={2.5}
    strokeLinecap="round"
    fill="none"
  />
);

export const EYES: Record<Avatar['eyes'], () => ReactElement> = {
  round: () => <>{[eye(51), eye(69)]}</>,
  happy: () => <>{[closedEye(51), closedEye(69)]}</>,
  wink: () => <>{[eye(51), closedEye(69)]}</>,
  glasses: () => (
    <>
      {[eye(51), eye(69)]}
      <G stroke={INK} strokeWidth={2} fill={WHITE} fillOpacity={0.25}>
        <Circle cx={51} cy={56} r={7} />
        <Circle cx={69} cy={56} r={7} />
      </G>
      <Line x1={58} y1={56} x2={62} y2={56} stroke={INK} strokeWidth={2} />
    </>
  ),
};

// Shop accessories, worn over the hair.
export const ACCESSORIES: Record<AccessoryCode, () => ReactElement> = {
  bow: () => (
    <G fill={CHEEK}>
      <Path d="M80 28 L70 20 L70 36 Z" />
      <Path d="M80 28 L90 20 L90 36 Z" />
      <Circle cx={80} cy={28} r={3.5} />
    </G>
  ),
  cap: () => (
    <>
      <Path d="M34 44 C34 26 46 19 60 19 C74 19 86 26 86 44 Z" fill={OUTFIT.blue} />
      <Path d="M58 44 L100 44 Q100 50 88 50 L58 50 Z" fill={OUTFIT.blue} />
      <Path d="M58 44 L100 44 Q100 50 88 50 L58 50 Z" {...shade(0.25)} />
    </>
  ),
  sunglasses: () => (
    <G fill={INK}>
      <Rect x={42} y={51} width={16} height={10} rx={4} />
      <Rect x={62} y={51} width={16} height={10} rx={4} />
      <Rect x={57} y={54} width={6} height={2} />
    </G>
  ),
  'top-hat': () => (
    <>
      <Rect x={44} y={4} width={32} height={26} rx={2} fill={INK} />
      <Rect x={44} y={22} width={32} height={5} fill={OUTFIT.red} />
      <Rect x={34} y={27} width={52} height={6} rx={3} fill={INK} />
    </>
  ),
  crown: () => (
    <>
      <Path d="M42 32 L42 14 L51 23 L60 9 L69 23 L78 14 L78 32 Z" fill={GOLD} />
      <Circle cx={60} cy={25} r={3} fill={OUTFIT.red} />
      <Circle cx={49} cy={27} r={2} fill={OUTFIT.blue} />
      <Circle cx={71} cy={27} r={2} fill={OUTFIT.blue} />
    </>
  ),
};

/** Mouth and cheeks: the avatar always smiles. */
export function Smile() {
  return (
    <>
      <Circle cx={45} cy={64} r={4} fill={CHEEK} fillOpacity={0.6} />
      <Circle cx={75} cy={64} r={4} fill={CHEEK} fillOpacity={0.6} />
      <Path
        d="M54 66 Q60 72 66 66"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
    </>
  );
}
