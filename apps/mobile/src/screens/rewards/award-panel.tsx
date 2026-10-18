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

import type { AwardState } from '@/data/rewards-model';
import { strings } from '@/i18n';

const t = strings.award;

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);
// Rare moment, worth a short arrival: the rewards come from the server a second after the end.
const ARRIVE = FadeInDown.duration(300).easing(EASE_OUT);

type AwardPanelProps = {
  state: AwardState;
  onOpenChest: (chestId: string) => void;
};

/** What the session earned, as computed by the server from its own grading. */
export function AwardPanel({ state, onOpenChest }: AwardPanelProps) {
  if (state.status !== 'ready') {
    return (
      <ThemedText variant="caption" className="text-center" accessibilityLiveRegion="polite">
        {state.status === 'waiting' ? t.waiting : t.computing}
      </ThemedText>
    );
  }
  const { award } = state;
  const streakUp = award.streak > award.streak_before;
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
        <View className="flex-row items-center gap-2">
          <Flame bump={streakUp} />
          <ThemedText variant="headline">{t.streak(award.streak)}</ThemedText>
        </View>
        {streakUp ? <ThemedText>{t.streakUp}</ThemedText> : null}
        {award.gems > 0 ? <ThemedText>{t.gems(award.gems)}</ThemedText> : null}
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
