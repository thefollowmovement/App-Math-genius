import { DOMAINS, type Domain } from '@math-genius/curriculum';
import { BOSS_PASS_RATE, type Award } from '@math-genius/shared';
import { Button, ThemedText, View } from '@math-genius/ui';
import type { ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  css,
  cubicBezier,
  useReducedMotion,
  type CSSStyle,
} from 'react-native-reanimated';

import { knownBadges } from '@/data/badges-model';
import type { AwardState } from '@/data/rewards-model';
import { strings } from '@/i18n';

const t = strings.award;

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
// Rare moment, worth a short arrival: the rewards come from the server a second after the end.
const ARRIVE = FadeInDown.duration(300).easing(EASE_OUT);

type AwardPanelProps = {
  state: AwardState;
  onOpenChest: (chestId: string) => void;
  onOpenBadges: () => void;
};

/** What the session earned, as computed by the server from its own grading. */
export function AwardPanel({ state, onOpenChest, onOpenBadges }: AwardPanelProps) {
  if (state.status !== 'ready') {
    return (
      <ThemedText variant="caption" className="text-center" accessibilityLiveRegion="polite">
        {state.status === 'waiting' ? t.waiting : t.computing}
      </ThemedText>
    );
  }
  const { award } = state;
  const streakUp = award.streak > award.streak_before;
  const badges = knownBadges(award.badges);
  return (
    <Animated.View entering={ARRIVE}>
      <View
        className="items-center gap-2 rounded-lg border border-border bg-surface p-4"
        accessibilityLiveRegion="polite"
      >
        <ThemedText variant="title">{t.xp(award.xp)}</ThemedText>
        {award.level > award.level_before ? (
          <ThemedText variant="headline">{t.levelUp(award.level)}</ThemedText>
        ) : null}
        {/* No streak yet (a boss or a bonus before the first mission): nothing to show. */}
        {award.streak > 0 ? (
          <View className="flex-row items-center gap-2">
            <Flame bump={streakUp} />
            <ThemedText variant="headline">{t.streak(award.streak)}</ThemedText>
          </View>
        ) : null}
        {streakUp ? <ThemedText>{t.streakUp}</ThemedText> : null}
        {award.gems > 0 ? <ThemedText>{t.gems(award.gems)}</ThemedText> : null}
        {award.challenge ? (
          <ThemedText variant="headline" className="text-center">
            {t.challengeDone(award.challenge.gems)}
          </ThemedText>
        ) : null}
        {award.boss ? <BossResult boss={award.boss} answered={award.answered} /> : null}
        {badges.length > 0 ? (
          <View className="w-full items-center gap-2 pt-2">
            <ThemedText variant="headline">{t.newBadges(badges.length)}</ThemedText>
            {badges.map((code) => (
              <ThemedText key={code} className="text-center">
                {`${strings.badges.items[code].icon} ${strings.badges.items[code].title}`}
              </ThemedText>
            ))}
            <Button variant="ghost" title={t.seeBadges} onPress={onOpenBadges} />
          </View>
        ) : null}
        {award.chest ? (
          <View className="w-full gap-3 pt-2">
            <ThemedText className="text-center">
              {award.chest.kind === 'rare' ? t.rareChest : t.chest}
            </ThemedText>
            <Button title={t.openChest} onPress={() => onOpenChest(award.chest?.id ?? '')} />
          </View>
        ) : null}
      </View>
    </Animated.View>
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
    <View className="items-center gap-1 pt-2">
      <ThemedText variant="headline">{`${strings.map.boss.icon} ${t.bossWon}`}</ThemedText>
      <ThemedText className="text-center">
        {boss.first && island ? t.islandDone(island.the) : t.bossWonAgain}
      </ThemedText>
    </View>
  );
}

/** The streak flame, with one bump when the streak just grew. */
function Flame({ bump }: { bump: boolean }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View style={bump && !reduced ? styles.bump : undefined}>
      <ThemedText variant="headline">{strings.rewards.flame}</ThemedText>
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
