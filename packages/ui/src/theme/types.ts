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

export interface Theme {
  id: string;
  /** Drives system UI drawn over the theme, such as the status bar. */
  colorScheme: 'light' | 'dark';
  colors: ThemeColors;
  radii: ThemeRadii;
}
