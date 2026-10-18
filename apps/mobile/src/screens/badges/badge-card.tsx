import { ThemedText, View, cx } from '@math-genius/ui';

import type { BadgeView } from '@/data/badges-model';
import { strings } from '@/i18n';
import { levelPercent } from '@/utils/reward-text';

const t = strings.badges;

/** One badge: earned, or how far the child is from it. */
export function BadgeCard({ badge }: { badge: BadgeView }) {
  const item = t.items[badge.code];
  const earned = badge.earnedAt !== null;
  return (
    <View
      accessible
      accessibilityLabel={
        earned
          ? t.earnedLabel(item.title, item.description)
          : t.lockedLabel(item.title, item.description, badge.value, badge.threshold)
      }
      className={cx(
        'flex-row items-center gap-4 rounded-lg border bg-surface p-4',
        earned ? 'border-success' : 'border-border',
      )}
    >
      <ThemedText variant="title" className={earned ? undefined : 'opacity-40'}>
        {item.icon}
      </ThemedText>
      <View className="flex-1 gap-1">
        <ThemedText variant="headline">{item.title}</ThemedText>
        <ThemedText variant="caption">{item.description}</ThemedText>
        {earned ? (
          <ThemedText variant="caption" tone="default">
            {t.earned}
          </ThemedText>
        ) : (
          <View className="flex-row items-center gap-2">
            <View className="h-2 flex-1 overflow-hidden rounded-full bg-background">
              <View
                className="h-2 rounded-full bg-primary"
                style={{ width: `${levelPercent(badge.value, badge.threshold)}%` }}
              />
            </View>
            <ThemedText variant="caption">{t.progress(badge.value, badge.threshold)}</ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}
