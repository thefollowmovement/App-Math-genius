import { heroLook, type Avatar } from '@math-genius/shared';
import { ThemedText, View } from '@math-genius/ui';

import { Emblem } from '@/components/game/icons';
import { ProgressBar } from '@/components/game/progress-bar';
import { StatTile } from '@/components/game/stat-tile';
import { HeroPicture } from '@/components/hero/hero-view';
import type { ProgressView } from '@/data/rewards-model';
import { strings } from '@/i18n';
import { portraitLabel } from '@/i18n/cosmetic-names';
import { levelTitle } from '@/utils/reward-text';

const t = strings.childHome;

type TopBarProps = {
  name: string;
  avatar: Avatar;
  progress: ProgressView;
  badges: number;
};

/** The child's player card: hero, name, level and XP, then streak, gems and badges. */
export function TopBar({ name, avatar, progress, badges }: TopBarProps) {
  const { level, inLevel, toNext, streak, gems } = progress;
  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <View className="size-14 rounded-md border-3 border-primary bg-surface glow-primary">
          <View className="flex-1 overflow-hidden rounded-sm">
            <HeroPicture look={heroLook(avatar)} pose="bust" label={portraitLabel(avatar)} />
          </View>
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center justify-between gap-2">
            <ThemedText variant="tag" numberOfLines={1} className="shrink">
              {name}
            </ThemedText>
            <ThemedText variant="label" accessibilityLabel={t.levelLabel(level, levelTitle(level))}>
              {t.level(level)}
            </ThemedText>
          </View>
          <ProgressBar
            value={toNext > 0 ? inLevel / toNext : 0}
            label={t.xpLabel}
            valueText={t.xpValue(inLevel, toNext)}
          />
          <ThemedText variant="label">{t.xp(inLevel, toNext)}</ThemedText>
        </View>
      </View>
      <View className="flex-row gap-3">
        <StatTile
          emblem={<Emblem name="flame" />}
          value={String(streak)}
          label={t.stats.streak}
          accessibilityLabel={strings.rewards.streakLabel(streak)}
        />
        <StatTile
          emblem={<Emblem name="gem" />}
          value={String(gems)}
          label={t.stats.gems}
          accessibilityLabel={strings.rewards.gemsLabel(gems)}
        />
        <StatTile
          emblem={<Emblem name="trophy" />}
          value={String(badges)}
          label={t.stats.badges}
          accessibilityLabel={t.badgesLabel(badges)}
        />
      </View>
    </View>
  );
}
