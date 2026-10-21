import { useTheme, View, type ThemeColors } from '@math-genius/ui';
import type { ReactNode } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

/** Out of reach of screen readers: what a drawing means is said by the view around it. */
export function Hidden({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={className}
    >
      {children}
    </View>
  );
}

const SIZES = { sm: 18, md: 22, lg: 30, xl: 36 } as const;

// Line icons draw strokes, the others are filled. 24 × 24 paths.
const ICONS = {
  home: { fill: false, paths: ['M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z'] },
  map: { fill: false, paths: ['M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z', 'M9 4v14M15 6v14'] },
  shop: { fill: false, paths: ['M5 8h14l-1 12H6z', 'M9 8a3 3 0 0 1 6 0'] },
  badges: {
    fill: false,
    paths: [
      'M7 3h10v5a5 5 0 0 1-10 0z',
      'M7 5H4a3 3 0 0 0 3 4M17 5h3a3 3 0 0 1-3 4',
      'M12 13v4M8 21h8',
    ],
  },
  hero: { fill: false, paths: ['M8 8a4 4 0 1 0 8 0a4 4 0 1 0-8 0', 'M4 21a8 8 0 0 1 16 0'] },
  close: { fill: false, paths: ['M6 6l12 12M18 6L6 18'] },
  back: { fill: false, paths: ['M15 5l-7 7 7 7'] },
  forward: { fill: false, paths: ['M9 5l7 7-7 7'] },
  lock: {
    fill: false,
    paths: [
      'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z',
      'M8 11V7a4 4 0 0 1 8 0v4',
    ],
  },
  check: { fill: false, paths: ['M5 12l5 5 9-10'] },
  plus: { fill: false, paths: ['M12 3v18M3 12h18'] },
  play: { fill: true, paths: ['M7 4l13 8-13 8z'] },
  star: {
    fill: true,
    paths: ['M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21.1l1.4-7L2 9.3l7-.8z'],
  },
  bolt: { fill: true, paths: ['M13 2L4 14h7l-1 8 9-12h-7z'] },
  games: {
    fill: false,
    paths: [
      'M7 7h10a5 5 0 0 1 5 5v3a3 3 0 0 1-5.5 1.6L15 15H9l-1.5 1.6A3 3 0 0 1 2 15v-3a5 5 0 0 1 5-5z',
      'M7 10v4M5 12h4',
      'M15.5 11h.01M18 13h.01',
    ],
  },
  pause: { fill: true, paths: ['M6 4h4v16H6z', 'M14 4h4v16h-4z'] },
  heart: {
    fill: true,
    paths: ['M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z'],
  },
} as const;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  /** A theme color: the icon follows the theme like a text. */
  color: keyof ThemeColors;
  size?: keyof typeof SIZES;
};

/** A small drawing in a theme color, always decorative: the control around it says what it does. */
export function Icon({ name, color, size = 'md' }: IconProps) {
  const { fill, paths } = ICONS[name];
  const value = useTheme().colors[color];
  return (
    <Hidden>
      <Svg width={SIZES[size]} height={SIZES[size]} viewBox="0 0 24 24">
        {paths.map((d) => (
          <Path
            key={d}
            d={d}
            fill={fill ? value : 'none'}
            stroke={fill ? 'none' : value}
            strokeWidth={name === 'close' || name === 'check' ? 3 : 2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    </Hidden>
  );
}

/**
 * The game's emblems (streak, gems, badges), in their own colors in every theme, like emoji:
 * drawing colors (docs/design/maquettes), never the interface's.
 */
export function Emblem({
  name,
  size = 'md',
}: {
  name: 'flame' | 'gem' | 'trophy';
  size?: keyof typeof SIZES;
}) {
  return (
    <Hidden>
      <Svg width={SIZES[size]} height={SIZES[size]} viewBox="0 0 24 24">
        {name === 'flame' ? (
          <>
            <Path
              d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4 1-6 1-9z"
              fill="#FF7A2E"
            />
            <Path d="M12 12c1 2 3 3 3 5a3 3 0 0 1-6 0c0-2 2-3 3-5z" fill="#FFC83D" />
          </>
        ) : null}
        {name === 'gem' ? (
          <>
            <Path d="M6 3h12l4 6-10 13L2 9z" fill="#2EE6FF" />
            <Path d="M2 9h20L12 22z" fill="#1BB5D6" />
            <Path d="M6 3l3 6 3-6 3 6 3-6" stroke="#E6FBFF" strokeWidth={1.2} fill="none" />
          </>
        ) : null}
        {name === 'trophy' ? (
          <>
            <Path d="M7 3h10v4a5 5 0 0 1-10 0z" fill="#FFC83D" />
            <Path d="M4 4h3v3a3 3 0 0 1-3-3zM20 4h-3v3a3 3 0 0 0 3-3z" fill="#E0A21C" />
            <Rect x={10} y={12} width={4} height={5} fill="#E0A21C" />
            <Rect x={7} y={17} width={10} height={4} rx={1} fill="#FFC83D" />
          </>
        ) : null}
      </Svg>
    </Hidden>
  );
}
