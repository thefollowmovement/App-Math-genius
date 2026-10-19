import { DOMAINS, type Domain } from '@math-genius/curriculum';
import { BOSS_PASS_RATE, type Award } from '@math-genius/shared';
import { Button, ThemedText, View } from '@math-genius/ui';
import type { ViewStyle } from 'react-native';
import Animated, {
  css,
  cubicBezier,
  useReducedMotion,
  type CSSStyle,
} from 'react-native-reanimated';

import { Emblem } from '@/components/game/icons';
import { knownBadges } from '@/data/badges-model';
import { strings } from '@/i18n';

const t = strings.award;

type AwardExtrasProps = {
  award: Award;
  onOpenBadges: () => void;
};

/**
 * What the session earned beyond its XP, streak, gems and chest (the tiles above), as computed
 * by the server from its own grading: a level, the streak growing, the week's challenge, the
 * parent's rewards, the boss, new badges.
 */
export function AwardExtras({ award, onOpenBadges }: AwardExtrasProps) {
  const streakUp = award.streak > award.streak_before;
  const levelUp = award.level > award.level_before;
  const badges = knownBadges(award.badges);
  const lines = [
    levelUp ? t.levelUp(award.level) : null,
    ...award.parent_rewards.map((reward) => t.parentReward(reward.title)),
    award.challenge ? t.challengeDone(award.challenge.gems) : null,
  ].filter((line) => line !== null);
  if (!streakUp && lines.length === 0 && !award.boss && badges.length === 0) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      className="items-center gap-3 rounded-lg border-2 border-border bg-surface p-4"
    >
      {streakUp ? (
        <View className="flex-row items-center gap-2">
          <Flame />
          <ThemedText variant="headline">{t.streakUp}</ThemedText>
        </View>
      ) : null}
      {lines.map((line) => (
        <ThemedText key={line} variant="headline" className="text-center">
          {line}
        </ThemedText>
      ))}
      {award.boss ? <BossResult boss={award.boss} answered={award.answered} /> : null}
      {badges.length > 0 ? (
        <View className="w-full items-center gap-2">
          <ThemedText variant="headline">{t.newBadges(badges.length)}</ThemedText>
          {badges.map((code) => (
            <ThemedText key={code} className="text-center">
              {`${strings.badges.items[code].icon} ${strings.badges.items[code].title}`}
            </ThemedText>
          ))}
          <Button variant="outline" title={t.seeBadges} onPress={onOpenBadges} />
        </View>
      ) : null}
    </View>
  );
}

const isDomain = (value: string): value is Domain => (DOMAINS as readonly string[]).includes(value);

/** How the boss went, by the server's grading. */
function BossResult({ boss, answered }: { boss: NonNullable<Award['boss']>; answered: number }) {
  if (!boss.passed) {
    return (
      <ThemedText className="text-center">
        {t.bossLost(Math.ceil(BOSS_PASS_RATE * answered))}
      </ThemedText>
    );
  }
  const island = isDomain(boss.domain) ? strings.map.islands[boss.domain] : null;
  return (
    <View className="items-center gap-1">
      <ThemedText variant="headline">{`${strings.map.boss.icon} ${t.bossWon}`}</ThemedText>
      <ThemedText className="text-center">
        {boss.first && island ? t.islandDone(island.the) : t.bossWonAgain}
      </ThemedText>
    </View>
  );
}

/** The streak flame, with one bump: the streak just grew. */
function Flame() {
  const reduced = useReducedMotion();
  return (
    <Animated.View style={reduced ? undefined : styles.bump}>
      <Emblem name="flame" size="lg" />
    </Animated.View>
  );
}

const bump = css.keyframes({
  '0%': { transform: [{ scale: 1 }] },
  '40%': { transform: [{ scale: 1.35 }] },
  '100%': { transform: [{ scale: 1 }] },
});

const styles: Record<'bump', CSSStyle<ViewStyle>> = {
  bump: {
    animationName: bump,
    animationDuration: '450ms',
    animationDelay: '250ms',
    animationTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
  },
};
