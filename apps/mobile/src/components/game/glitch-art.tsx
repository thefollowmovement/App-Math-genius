import Svg, { Rect } from 'react-native-svg';

import { Hidden } from './icons';

// « Le Glitch », the islands' boss (docs/design/personnages.md): a cute pixel cube, never scary.
// Drawing colors, like an image's.
const BODY = '#7A3BFF';
const TOP = '#9B6BFF';
const EYES = '#3DFFA2';
const DARK = '#0B0620';
const WHITE = '#FFFFFF';
const PINK = '#FF3EA5';
const CYAN = '#2EE6FF';

/** The boss's drawing; fills its box (80 × 80). */
export function GlitchArt() {
  return (
    <Hidden className="size-full">
      <Svg width="100%" height="100%" viewBox="0 0 80 80">
        <Rect x={12} y={16} width={56} height={52} rx={10} fill={BODY} />
        <Rect x={12} y={16} width={56} height={14} rx={6} fill={TOP} />
        <Rect x={22} y={36} width={12} height={12} fill={EYES} />
        <Rect x={46} y={36} width={12} height={12} fill={EYES} />
        <Rect x={26} y={40} width={4} height={4} fill={DARK} />
        <Rect x={50} y={40} width={4} height={4} fill={DARK} />
        <Rect x={28} y={56} width={24} height={5} fill={DARK} />
        <Rect x={32} y={56} width={4} height={5} fill={WHITE} />
        <Rect x={44} y={56} width={4} height={5} fill={WHITE} />
        <Rect x={4} y={6} width={8} height={8} fill={PINK} />
        <Rect x={68} y={8} width={6} height={6} fill={CYAN} />
      </Svg>
    </Hidden>
  );
}
