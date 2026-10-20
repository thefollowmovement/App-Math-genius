import { cx, Pressable, ThemedText } from '@math-genius/ui';

import type { UniverseOption } from '@/data/universe-model';

type OptionCardProps = {
  option: UniverseOption;
  chosen: boolean;
  onPress: () => void;
  /** Layout only. */
  className?: string;
};

/** A universe to touch, with its neutral drawing; a chosen one stands out on its ledge. */
export function OptionCard({ option, chosen, onPress, className }: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={option.name}
      aria-checked={chosen}
      onPress={onPress}
      hitSlop={4}
      className={cx(
        'min-h-24 items-center justify-center gap-1 rounded-lg border-3 px-2 py-3 active:opacity-80',
        chosen ? 'border-primary bg-primary/15 ledge-primary' : 'border-border bg-surface ledge',
        className,
      )}
    >
      <ThemedText variant="title" importantForAccessibility="no">
        {option.icon}
      </ThemedText>
      <ThemedText variant="headline" className="text-center">
        {option.name}
      </ThemedText>
    </Pressable>
  );
}
