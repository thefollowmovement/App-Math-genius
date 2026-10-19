import { cx, Pressable, ThemedText, type ThemedTextTone, View } from '@math-genius/ui';

export type TileState = 'idle' | 'selected' | 'right' | 'wrong';

// The tile stands on a ledge; the chosen one glows (on neon themes) in the color of its state.
const stateClassNames: Record<TileState, { box: string; tone: ThemedTextTone }> = {
  idle: { box: 'border-border bg-surface ledge', tone: 'default' },
  selected: { box: 'border-primary bg-primary/15 ledge-primary', tone: 'default' },
  right: { box: 'border-success bg-success ledge-success', tone: 'onSuccess' },
  wrong: { box: 'border-danger bg-surface ledge-danger', tone: 'danger' },
};

const sizeClassNames = {
  // Numbers to order or to match.
  md: { box: 'min-h-14 px-4 py-3', label: 'headline' },
  // The answers of a choice, two by two.
  lg: { box: 'min-h-22 px-3 py-4', label: 'title' },
} as const;

type TileProps = {
  label: string;
  state?: TileState;
  size?: keyof typeof sizeClassNames;
  onPress?: () => void;
  disabled?: boolean;
  /** Small number shown before the label, e.g. the pair a label belongs to. */
  badge?: number;
  accessibilityLabel?: string;
  /** Layout only. */
  className?: string;
};

/** A large touch target holding a short label: answer options, numbers to order or to match. */
export function Tile({
  label,
  state = 'idle',
  size = 'md',
  onPress,
  disabled = false,
  badge,
  accessibilityLabel,
  className,
}: TileProps) {
  const { box, tone } = stateClassNames[state];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled, selected: state === 'selected' }}
      aria-selected={state === 'selected'}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      className={cx(
        'flex-row items-center justify-center gap-2 rounded-lg border-3 active:opacity-80',
        sizeClassNames[size].box,
        box,
        className,
      )}
    >
      {badge !== undefined ? (
        <View className="size-7 items-center justify-center rounded-full bg-secondary">
          <ThemedText variant="caption" tone="onSecondary">
            {String(badge)}
          </ThemedText>
        </View>
      ) : null}
      <ThemedText variant={sizeClassNames[size].label} tone={tone} className="text-center">
        {label}
      </ThemedText>
    </Pressable>
  );
}
