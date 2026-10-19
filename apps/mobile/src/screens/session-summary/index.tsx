import type { ShopItemCode } from '@math-genius/shared';
import { Button, Pressable, Screen, ThemedText, View } from '@math-genius/ui';

import { CenterGlow } from '@/components/decor';
import { Icon } from '@/components/game/icons';
import { Stars } from '@/components/game/stars';
import { StatTile } from '@/components/game/stat-tile';
import { starsOf, type SessionSummary as Summary } from '@/data/practice/summary';
import type { AwardState } from '@/data/rewards-model';
import { useThemeStrings } from '@/hooks/use-theme-strings';
import { strings } from '@/i18n';

import { AwardExtras } from '../rewards/award-extras';
import { VictoryScene } from './victory-scene';

const t = strings.summary;

type SessionSummaryProps = {
  summary: Summary;
  /** The session reached the server; otherwise it waits on the device. */
  saved: boolean;
  /** XP, streak and chest, computed by the server once the session is sent. */
  award: AwardState;
  onOpenChest: (chestId: string) => void;
  onOpenBadges: () => void;
  /** The victory effect the child wears (shop). */
  effect?: ShopItemCode;
  onBonus: () => void;
  onHome: () => void;
};

/** The end of a session (docs/design/maquettes/Victoire.html): stars, the hero, the rewards. */
export function SessionSummary({
  summary,
  saved,
  award,
  onOpenChest,
  onOpenBadges,
  effect,
  onBonus,
  onHome,
}: SessionSummaryProps) {
  const theme = useThemeStrings();
  const { cheer, proud } = strings.heroes;
  const boss = summary.kind === 'boss';
  const ready = award.status === 'ready' ? award.award : null;
  const won = summary.goalMet || boss;
  const stars = starsOf(summary);
  const title = boss ? t.bossOver : summary.goalMet ? theme.goalMet : t.finished;
  const chest = ready?.chest ?? null;
  const pending = t.pending;

  return (
    <Screen
      headerless
      backdrop={<CenterGlow />}
      footer={
        <View className="gap-3">
          {chest ? (
            <Button
              size="lg"
              variant="accent"
              title={t.openChest}
              onPress={() => onOpenChest(chest.id)}
            />
          ) : (
            <Button size="lg" title={t.homeShort} accessibilityLabel={t.home} onPress={onHome} />
          )}
          <Button variant="outline" title={t.bonus} onPress={onBonus} />
        </View>
      }
    >
      {/* Tighter than other pages: the mission's whole result fits on one screen. */}
      <View className="gap-4">
        <View className="flex-row items-start">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.home}
            onPress={onHome}
            hitSlop={4}
            className="size-11 items-center justify-center rounded-md border-2 border-border bg-surface active:opacity-80"
          >
            <Icon name="close" color="muted" size="sm" />
          </Pressable>
          <View className="flex-1 items-center">
            {effect ? <VictoryEffect icon={strings.shop.items[effect].icon} /> : null}
            {stars > 0 && !boss ? <Stars count={stars} label={t.stars(stars)} /> : null}
          </View>
          <View className="size-11" />
        </View>
        <View className="gap-2">
          <ThemedText
            variant="display"
            className="text-center halo-primary"
            accessibilityRole="header"
          >
            {title}
          </ThemedText>
          <ThemedText tone="muted" className="text-center">
            {won ? (cheer[summary.correct % cheer.length] ?? cheer[0]) : proud}
          </ThemedText>
        </View>
        <VictoryScene won={won} chest={chest} />
        <View className="gap-3">
          <View className="flex-row gap-3">
            <StatTile
              label={t.tiles.score}
              value={t.scoreValue(summary.correct, summary.answered)}
              accessibilityLabel={t.score(summary.correct, summary.answered)}
            />
            <StatTile
              label={t.tiles.streak}
              value={ready ? t.streakValue(ready.streak) : pending}
              tone="fire"
              accessibilityLabel={
                ready ? strings.rewards.streakLabel(ready.streak) : t.tiles.streak
              }
            />
          </View>
          <View className="flex-row gap-3">
            <StatTile
              label={t.tiles.xp}
              value={ready ? t.plus(ready.xp) : pending}
              tone="secondary"
              accessibilityLabel={ready ? t.xpLabel(ready.xp) : t.tiles.xp}
            />
            <StatTile
              label={t.tiles.gems}
              value={ready ? t.plus(ready.gems) : pending}
              tone="success"
              accessibilityLabel={ready ? t.gemsLabel(ready.gems) : t.tiles.gems}
            />
          </View>
        </View>
        {ready ? null : (
          <ThemedText variant="caption" className="text-center" accessibilityLiveRegion="polite">
            {award.status === 'waiting' ? strings.award.waiting : strings.award.computing}
          </ThemedText>
        )}
        {ready ? <AwardExtras award={ready} onOpenBadges={onOpenBadges} /> : null}
        {summary.goalMet || boss ? null : (
          <ThemedText className="text-center">{t.notValidated}</ThemedText>
        )}
        {summary.progressed.length > 0 ? (
          <View className="gap-2 rounded-lg border-2 border-border bg-surface p-4">
            <ThemedText variant="label">{t.progressed}</ThemedText>
            {summary.progressed.map(({ title: skill, mastery }) => (
              <ThemedText key={skill}>{t.mastery(skill, mastery)}</ThemedText>
            ))}
          </View>
        ) : null}
        <ThemedText variant="caption" className="text-center">
          {`${t.duration(summary.minutes)} · ${saved ? t.saved : t.savedOffline}`}
        </ThemedText>
      </View>
    </Screen>
  );
}

/** The victory effect bought in the shop, three times, as a decoration. */
function VictoryEffect({ icon }: { icon: string }) {
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <ThemedText variant="title" className="text-center">{`${icon} ${icon} ${icon}`}</ThemedText>
    </View>
  );
}
