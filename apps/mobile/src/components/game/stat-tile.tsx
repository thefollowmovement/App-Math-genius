import { ThemedText, View, cx, type ThemedTextTone } from '@math-genius/ui';
import type { ReactNode } from 'react';

type StatTileProps = {
  /** Small capitals above or beside the value. */
  label: string;
  value: string;
  /** Spoken instead of the value and its label, as one sentence. */
  accessibilityLabel: string;
  /** Drawn left of the value (the home's tiles). */
  emblem?: ReactNode;
  tone?: ThemedTextTone;
  /** Layout only. */
  className?: string;
};

/** A number and what it counts, on a card: streak, gems, badges, a session's score. */
export function StatTile({
  label,
  value,
  accessibilityLabel,
  emblem,
  tone = 'default',
  className,
}: StatTileProps) {
  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      className={cx(
        'flex-1 rounded-md border-2 border-border bg-surface py-2',
        emblem ? 'px-2' : 'px-3',
        emblem ? 'flex-row items-center gap-2' : 'gap-1',
        className,
      )}
    >
      {emblem}
      {emblem ? (
        <View className="shrink">
          <ThemedText variant="tag" tone={tone}>
            {value}
          </ThemedText>
          {/* Tight letters: the tile is a third of the screen. */}
          <ThemedText variant="label" numberOfLines={1} className="tracking-normal">
            {label}
          </ThemedText>
        </View>
      ) : (
        <>
          <ThemedText variant="label">{label}</ThemedText>
          <ThemedText variant="score" tone={tone}>
            {value}
          </ThemedText>
        </>
      )}
    </View>
  );
}
