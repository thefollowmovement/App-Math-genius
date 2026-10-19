import { cx, Pressable, ThemedText, type ThemedTextTone, View } from '@math-genius/ui';

export type TileState = 'idle' | 'selected' | 'right' | 'wrong';

const stateClassNames: Record<TileState, { box: string; tone: ThemedTextTone }> = {
  idle: { box: 'border-border bg-surface', tone: 'default' },
  selected: { box: 'border-primary bg-primary', tone: 'onPrimary' },
  right: { box: 'border-success bg-success', tone: 'onSuccess' },
  wrong: { box: 'border-danger bg-surface', tone: 'danger' },
};

type TileProps = {
  label: string;
  state?: TileState;
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
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      className={cx(
        'min-h-14 flex-row items-center justify-center gap-2 rounded-md border-2 px-4 py-3 active:opacity-80',
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
      <ThemedText variant="headline" tone={tone} className="text-center">
        {label}
      </ThemedText>
    </Pressable>
  );
}
