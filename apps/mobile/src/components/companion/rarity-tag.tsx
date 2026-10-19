import type { Rarity } from '@math-genius/shared';
import { ThemedText, View, cx, type ThemedTextTone } from '@math-genius/ui';

import { strings } from '@/i18n';

// Rarer, brighter: the legendary one glows in the rewards' gold.
const RARITY_STYLES = {
  common: { tone: 'muted', border: 'border-border' },
  rare: { tone: 'secondary', border: 'border-secondary' },
  epic: { tone: 'primary', border: 'border-primary' },
  legendary: { tone: 'accent', border: 'border-accent glow-accent' },
} as const satisfies Record<Rarity, { tone: ThemedTextTone; border: string }>;

type RarityTagProps = {
  rarity: Rarity;
  /** Read out on its own (« Rareté : Épique »); on a card, the card's label says it. */
  spoken?: boolean;
  className?: string;
};

/** A companion's rarity, as a small label. */
export function RarityTag({ rarity, spoken = false, className }: RarityTagProps) {
  const { tone, border } = RARITY_STYLES[rarity];
  const name = strings.companions.rarities[rarity];
  return (
    <View
      accessible={spoken}
      accessibilityLabel={spoken ? strings.companions.rarityLabel(name) : undefined}
      className={cx('rounded-full border-2 bg-background px-2 py-0.5', border, className)}
    >
      <ThemedText variant="label" tone={tone} className="tracking-normal">
        {name}
      </ThemedText>
    </View>
  );
}
