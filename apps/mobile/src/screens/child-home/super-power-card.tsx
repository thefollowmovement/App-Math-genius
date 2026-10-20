import { ThemedText, View } from '@math-genius/ui';

import { Icon } from '@/components/game/icons';
import type { SuperPower } from '@/data/learner-profile-model';
import { strings } from '@/i18n';

const t = strings.superPower;

const textOf = (power: SuperPower) =>
  power.kind === 'strand'
    ? { title: t.strands[power.strand], text: t.how[power.how] }
    : t[power.kind];

/** The child's strength first (docs/specs.md, Mise en valeur des forces). */
export function SuperPowerCard({ power }: { power: SuperPower }) {
  const { title, text } = textOf(power);
  return (
    <View
      accessible
      accessibilityLabel={`${t.label} : ${title}. ${text}`}
      className="flex-row items-center gap-3 rounded-lg border-2 border-accent bg-surface p-4 glow-accent"
    >
      <View className="size-12 items-center justify-center rounded-full bg-accent">
        <Icon name="bolt" color="onAccent" size="md" />
      </View>
      <View className="flex-1 gap-1">
        <ThemedText variant="label" tone="accent">
          {t.label}
        </ThemedText>
        <ThemedText variant="headline">{title}</ThemedText>
        <ThemedText variant="caption">{text}</ThemedText>
      </View>
    </View>
  );
}
