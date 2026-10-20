import { Button, ThemedText, View } from '@math-genius/ui';

import type { UniverseOption } from '@/data/universe-model';
import { strings } from '@/i18n';

const t = strings.universe.look;

type UniverseSectionProps = {
  chosen: readonly UniverseOption[];
  onEdit: () => void;
};

/** What the child likes, to change at will (docs/specs.md, « Ton univers »). */
export function UniverseSection({ chosen, onEdit }: UniverseSectionProps) {
  return (
    <View className="gap-3">
      <ThemedText variant="label" accessibilityRole="header">
        {t.title}
      </ThemedText>
      <View className="gap-3 rounded-lg border-2 border-border bg-surface p-4">
        {chosen.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {chosen.map((option) => (
              <View
                key={option.universeId}
                className="flex-row items-center gap-1 rounded-full border-2 border-border bg-raised px-3 py-1"
              >
                <ThemedText importantForAccessibility="no">{option.icon}</ThemedText>
                <ThemedText variant="caption" tone="default">
                  {option.name}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : (
          <ThemedText tone="muted">{t.empty}</ThemedText>
        )}
        <Button variant="outline" title={t.edit} onPress={onEdit} />
      </View>
    </View>
  );
}
