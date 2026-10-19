import type { Exercise } from '@math-genius/exercise-engine';
import { Button, cx, ThemedText, View } from '@math-genius/ui';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useChildHero } from '@/components/hero/hero-context';
import { HeroSays } from '@/components/hero/hero-says';
import { HeroView } from '@/components/hero/hero-view';
import { strings } from '@/i18n';
import { rightAnswerText } from '@/utils/exercise-text';

const t = strings.practice;

type FeedbackPanelProps = {
  exercise: Exercise;
  correct: boolean;
  fast: boolean;
  /** Last exercise of the session: the button opens the summary. */
  finished: boolean;
  onContinue: () => void;
};

/** Immediate correction: a cheer, or the right answer and how to find it. */
export function FeedbackPanel({
  exercise,
  correct,
  fast,
  finished,
  onContinue,
}: FeedbackPanelProps) {
  const praise = t.correct[exercise.seed % t.correct.length] ?? t.correct[0];
  const { encourage } = strings.heroes;
  const { hero } = useChildHero();

  return (
    <Animated.View entering={FadeIn.duration(120)}>
      <View className="gap-4">
        <View
          accessibilityLiveRegion="polite"
          className={cx(
            'gap-3 rounded-lg border-2 p-4',
            correct ? 'border-success bg-success' : 'border-border bg-surface',
          )}
        >
          <View className="flex-row items-center gap-3">
            <ThemedText variant="title" tone={correct ? 'onSuccess' : 'default'} className="flex-1">
              {correct ? praise : t.wrong}
            </ThemedText>
            {correct ? <HeroView hero={hero} pose="victory" size="sm" /> : null}
          </View>
          {correct && fast ? <ThemedText tone="onSuccess">{t.fast}</ThemedText> : null}
          {correct ? null : (
            <>
              <HeroSays pose="encourage">
                {encourage[exercise.seed % encourage.length] ?? encourage[0]}
              </HeroSays>
              <View className="gap-1">
                <ThemedText variant="caption">{t.rightAnswer}</ThemedText>
                <ThemedText variant="headline">{rightAnswerText(exercise)}</ThemedText>
              </View>
              <View className="gap-1">
                <ThemedText variant="caption">{t.explanation}</ThemedText>
                {exercise.explanation.map((step, index) => (
                  <ThemedText key={`${index}-${step}`}>{step}</ThemedText>
                ))}
              </View>
            </>
          )}
        </View>
        <Button size="lg" title={finished ? t.finish : t.continue} onPress={onContinue} />
      </View>
    </Animated.View>
  );
}
