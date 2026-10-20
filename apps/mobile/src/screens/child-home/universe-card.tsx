import { Button, ThemedText, View } from '@math-genius/ui';

import type { UniverseOffer } from '@/data/universe-model';
import { strings } from '@/i18n';

const t = strings.universe;

type UniverseCardProps = {
  offer: Exclude<UniverseOffer, null>;
  onOpen: () => void;
};

/** « Ton univers » on the child's home: the first time, then « Tes goûts ont changé ? ». */
export function UniverseCard({ offer, onOpen }: UniverseCardProps) {
  const again = offer === 'again';
  return (
    <View className="gap-3 rounded-lg border-2 border-primary bg-surface p-4 glow-primary">
      <ThemedText variant="label" tone="primary" accessibilityRole="header">
        {t.intro.first.label}
      </ThemedText>
      <ThemedText>{again ? t.card.againText : t.card.firstText}</ThemedText>
      <Button title={again ? t.card.update : t.card.answer} onPress={onOpen} />
    </View>
  );
}
