import { Button, ThemedText, View } from '@math-genius/ui';

import type { PlacementOffer } from '@/data/placement-model';
import { strings } from '@/i18n';

const t = strings.placement;

type PlacementCardProps = {
  offer: Exclude<PlacementOffer, null>;
  onStart: () => void;
};

/** The placement test on the child's home: the first one, a recheck, or the one under way. */
export function PlacementCard({ offer, onStart }: PlacementCardProps) {
  const recheck = offer === 'recheck';
  const text =
    offer === 'resume' ? t.card.resumeText : recheck ? t.card.recheckText : t.card.firstText;
  return (
    <View className="gap-3 rounded-lg border-2 border-secondary bg-surface p-4 glow-secondary">
      <ThemedText variant="label" tone="secondary" accessibilityRole="header">
        {recheck ? t.intro.recheck.label : t.intro.first.label}
      </ThemedText>
      <ThemedText>{text}</ThemedText>
      <Button
        variant="secondary"
        title={offer === 'resume' ? t.card.resume : t.card.start}
        onPress={onStart}
      />
    </View>
  );
}
