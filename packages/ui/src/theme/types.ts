/**
 * A theme is a plain token file. Screens never read these values directly: they use
 * semantic classes (`bg-primary`, `rounded-lg`…) that resolve to the active theme at runtime.
 */
export interface ThemeColors {
  /** Screen background. */
  background: string;
  /** Cards and raised areas. */
  surface: string;
  border: string;
  /** Main text. */
  foreground: string;
  /** Secondary text. */
  muted: string;
  primary: string;
  /** Text and icons drawn on `primary`. */
  onPrimary: string;
  secondary: string;
  /** Text and icons drawn on `secondary`. */
  onSecondary: string;
  /** Errors and destructive actions, readable on `background` and `surface`. */
  danger: string;
  /** Right answers and completed goals (fills and borders). */
  success: string;
  /** Text and icons drawn on `success`. */
  onSuccess: string;
}

/** Corner radii in density-independent pixels. */
export interface ThemeRadii {
  sm: number;
  md: number;
  lg: number;
}

/** Display and title texts use the theme's own font; body text may have its own too. */
export interface ThemeTypography {
  /** A font the app loads (apps/mobile/src/lib/fonts.ts), by its loaded name. */
  headingFont: string;
  /** A font file holds one weight: ask for the one it has. */
  headingWeight: '400' | '600' | '700';
  /**
   * Body, caption (regular, 400) and headline (semibold, 600) texts. Without it, they stay on the
   * system font.
   */
  bodyFont?: { regular: string; semibold: string };
}

/** The solid shadow under filled buttons, which makes them look pressable. */
export interface ThemeRelief {
  /** Its height in density-independent pixels; 0 for flat buttons. */
  depth: number;
  /** Drawn over the button's own color: a dark, translucent #RRGGBBAA darkens it. */
  color: string;
}

/**
 * Colors of the drawings (backdrop), not of the interface: screens never use them. Only SVG
 * drawings read them, through useTheme().
 */
export interface ThemeArt {
  /** Shapes in two corners of the child's screens (apps/mobile/src/components/decor.tsx). */
  decor: 'bubbles' | 'speed-lines' | 'stars' | 'spotlights';
  /** Large shapes, which text may cross (readable, tested), then small accents. */
  decorColors: [string, string];
}

export interface Theme {
  id: string;
  /** Drives system UI drawn over the theme, such as the status bar. */
  colorScheme: 'light' | 'dark';
  colors: ThemeColors;
  radii: ThemeRadii;
  typography: ThemeTypography;
  relief: ThemeRelief;
  art: ThemeArt;
}
