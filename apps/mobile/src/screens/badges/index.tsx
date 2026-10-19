import { Screen, ThemedText, View } from '@math-genius/ui';

import { Decor } from '@/components/decor';
import { BADGE_COUNT, type BadgeGroup } from '@/data/badges-model';
import { strings } from '@/i18n';

import { BadgeCard } from './badge-card';

const t = strings.badges;

type BadgesProps = {
  /** Null while loading. */
  groups: BadgeGroup[] | null;
};

/** Every badge, earned or not, by category. */
export function Badges({ groups }: BadgesProps) {
  if (!groups) {
    return (
      <Screen centered>
        <ThemedText className="text-center">{t.loading}</ThemedText>
      </Screen>
    );
  }
  const earned = groups.flatMap((group) => group.badges).filter((badge) => badge.earnedAt).length;
  return (
    <Screen backdrop={<Decor />}>
      <View className="gap-1">
        <ThemedText variant="title">{t.title}</ThemedText>
        <ThemedText variant="caption">{t.count(earned, BADGE_COUNT)}</ThemedText>
      </View>
      {groups.map((group) => (
        <View key={group.category} className="gap-3">
          <ThemedText variant="headline" accessibilityRole="header">
            {t.categories[group.category]}
          </ThemedText>
          {group.badges.map((badge) => (
            <BadgeCard key={badge.code} badge={badge} />
          ))}
        </View>
      ))}
    </Screen>
  );
}
