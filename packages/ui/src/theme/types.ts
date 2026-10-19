/**
 * A theme is a plain token file. Screens never read these values directly: they use
 * semantic classes (`bg-primary`, `rounded-lg`…) that resolve to the active theme at runtime.
 */
export interface ThemeColors {
  /** Screen background. */
  background: string;
  /** Cards and raised areas. */
  surface: string;
  /** Lighter than `surface`: the top of a highlighted card, a speech bubble, a pressed tab. */
  raised: string;
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
  /** Gold of the rewards: chests, stars, mastered skills, the weekly challenge. */
  accent: string;
  /** Text and icons drawn on `accent`. */
  onAccent: string;
  /** Errors and destructive actions, readable on `background` and `surface`. */
  danger: string;
  /** Right answers and completed goals (fills and borders). */
  success: string;
  /** Text and icons drawn on `success`. */
  onSuccess: string;
  /**
   * Colored texts (labels, scores), readable on `background` and `surface`: the neon colors
   * themselves on a dark theme, deeper ones on a light theme, where the fills are pastels.
   */
  primaryInk: string;
  secondaryInk: string;
  accentInk: string;
  successInk: string;
  /** The streak and the combo, as text and borders, readable on `background` and `surface`. */
  fire: string;
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
   * Body and caption texts (`regular`, asked as weight 400), headline, statement and label texts
   * (`semibold`, asked as weight 600), whatever weight the file holds. Without it, they stay on
   * the system font.
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

/** The neon halo around buttons, cards and titles; none on flat themes. */
export interface ThemeGlow {
  /** Blur radius in density-independent pixels; 0 for no halo. */
  radius: number;
  /** Opacity of the halo's color, 0 to 1. */
  strength: number;
}

/**
 * Colors of the drawings (backdrop), not of the interface: screens never use them. Only SVG
 * drawings read them, through useTheme().
 */
export interface ThemeArt {
  /** Shapes in two corners of the child's screens (apps/mobile/src/components/decor.tsx). */
  decor: 'bubbles' | 'speed-lines' | 'stars' | 'glows';
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
  glow: ThemeGlow;
  art: ThemeArt;
}
