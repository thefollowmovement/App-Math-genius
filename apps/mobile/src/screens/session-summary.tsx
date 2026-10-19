import type { ShopItemCode } from '@math-genius/shared';
import { Button, Screen, ThemedText, View } from '@math-genius/ui';
import type { ViewStyle } from 'react-native';
import Animated, {
  css,
  cubicBezier,
  useReducedMotion,
  type CSSStyle,
} from 'react-native-reanimated';

import { Decor } from '@/components/decor';
import { HeroSays } from '@/components/hero/hero-says';
import type { SessionSummary as Summary } from '@/data/practice/summary';
import type { AwardState } from '@/data/rewards-model';
import { useThemeStrings } from '@/hooks/use-theme-strings';
import { strings } from '@/i18n';

import { AwardPanel } from './rewards/award-panel';

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
  const reduced = useReducedMotion();
  return (
    <Screen centered backdrop={<Decor />}>
      {effect ? <VictoryEffect icon={strings.shop.items[effect].icon} /> : null}
      <Animated.View style={reduced ? undefined : styles.pop}>
        <HeroSays pose={summary.goalMet ? 'victory' : 'encourage'} size="lg">
          {summary.goalMet ? (cheer[summary.correct % cheer.length] ?? cheer[0]) : proud}
        </HeroSays>
      </Animated.View>
      <View className="gap-2">
        <ThemedText variant="display" className="text-center" accessibilityRole="header">
          {summary.kind === 'boss' ? t.bossOver : summary.goalMet ? theme.goalMet : t.finished}
        </ThemedText>
        <ThemedText variant="headline" className="text-center">
          {t.score(summary.correct, summary.answered)}
        </ThemedText>
        <ThemedText className="text-center">{t.duration(summary.minutes)}</ThemedText>
        {summary.goalMet || summary.kind === 'boss' ? null : (
          <ThemedText className="text-center">{t.notValidated}</ThemedText>
        )}
      </View>
      <AwardPanel state={award} onOpenChest={onOpenChest} onOpenBadges={onOpenBadges} />
      {summary.progressed.length > 0 ? (
        <View className="gap-2 rounded-lg border border-border bg-surface p-4">
          <ThemedText variant="headline">{t.progressed}</ThemedText>
          {summary.progressed.map(({ title, mastery }) => (
            <ThemedText key={title}>{t.mastery(title, mastery)}</ThemedText>
          ))}
        </View>
      ) : null}
      <ThemedText variant="caption" className="text-center">
        {saved ? t.saved : t.savedOffline}
      </ThemedText>
      <View className="gap-3">
        <Button size="lg" title={t.bonus} onPress={onBonus} />
        <Button variant="ghost" title={t.home} onPress={onHome} />
      </View>
    </Screen>
  );
}

// Rare moments (end of a session), worth a short celebration, skipped with reduced motion. CSS
// animations, not layout ones: on the web, Reanimated replays an entering animation, with the view
// positioned absolutely, when the award appears below.
const pop = css.keyframes({
  '0%': { opacity: 0, transform: [{ scale: 0.8 }] },
  '70%': { opacity: 1, transform: [{ scale: 1.05 }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }] },
});

const styles: Record<'pop', CSSStyle<ViewStyle>> = {
  pop: {
    animationName: pop,
    animationDuration: '400ms',
    animationTimingFunction: cubicBezier(0.23, 1, 0.32, 1),
  },
};

/** The victory effect bought in the shop, three times, as a decoration. */
function VictoryEffect({ icon }: { icon: string }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      style={reduced ? undefined : styles.pop}
      importantForAccessibility="no-hide-descendants"
    >
      <ThemedText
        variant="display"
        className="text-center"
        accessibilityElementsHidden
      >{`${icon} ${icon} ${icon}`}</ThemedText>
    </Animated.View>
  );
}
