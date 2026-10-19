import { View, cx } from '@math-genius/ui';
import type { ViewStyle } from 'react-native';

const FILLS = {
  // Cyan to pink, as the neon tubes of the mockups (XP, the session).
  neon: 'bg-secondary bg-linear-to-r from-secondary to-primary',
  accent: 'bg-accent',
  success: 'bg-success',
  primary: 'bg-primary',
} as const;

const HEIGHTS = { sm: 'h-2', md: 'h-3', lg: 'h-4' } as const;

type ProgressBarProps = {
  /** Done, from 0 to 1. */
  value: number;
  fill?: keyof typeof FILLS;
  size?: keyof typeof HEIGHTS;
  /** What is measured, spoken with the value. */
  label: string;
  /** The value as read out (« 340 XP sur 500 »); the percentage otherwise. */
  valueText?: string;
  /** A transition on the fill's width (Reanimated or CSS), when it moves in front of the child. */
  fillStyle?: ViewStyle;
  /** Layout only. */
  className?: string;
};

/** A track and its fill, in the theme's colors. */
export function ProgressBar({
  value,
  fill = 'neon',
  size = 'md',
  label,
  valueText,
  fillStyle,
  className,
}: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: percent, text: valueText }}
      className={cx(
        'overflow-hidden rounded-full border-2 border-border bg-surface',
        HEIGHTS[size],
        className,
      )}
    >
      {/* Out of the flow and childless: animating its width costs no layout pass. */}
      <View
        className={cx('absolute bottom-0 left-0 top-0 rounded-full', FILLS[fill])}
        style={[{ width: `${percent}%` }, fillStyle]}
      />
    </View>
  );
}
