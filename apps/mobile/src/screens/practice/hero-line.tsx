import type { Exercise } from '@math-genius/exercise-engine';
import type { HeroPose } from '@math-genius/shared';
import { Pressable, ThemedText, View } from '@math-genius/ui';

import { useChildHero } from '@/components/hero/hero-context';
import { SpeechBubble } from '@/components/hero/hero-says';
import { HeroView } from '@/components/hero/hero-view';
import { strings } from '@/i18n';

import type { PracticeFeedback } from '.';

const t = strings.practice;

type HeroLineProps = {
  exercise: Exercise;
  feedback: PracticeFeedback | null;
  /** Errors in a row: the hint is shown up front as a reminder. */
  reminder: boolean;
  hintShown: boolean;
  onShowHint: () => void;
};

/**
 * The child's hero at the bottom of the exercise: it offers a hint, thinks it over with the
 * child, cheers a right answer and encourages after a wrong one (never a reproach).
 */
export function HeroLine({ exercise, feedback, reminder, hintShown, onShowHint }: HeroLineProps) {
  const { hero } = useChildHero();
  const { encourage } = strings.heroes;
  const pick = (lines: readonly string[]) => lines[exercise.seed % lines.length] ?? lines[0] ?? '';

  let pose: Exclude<HeroPose, 'bust'> = 'think';
  let text = `${reminder ? t.reminder : t.hintTitle} : ${exercise.hint}`;
  if (feedback?.correct) {
    pose = 'victory';
    text = feedback.fast ? `${pick(t.correct)} ${t.fast}` : pick(t.correct);
  } else if (feedback) {
    pose = 'encourage';
    text = pick(encourage);
  } else if (!reminder && !hintShown) {
    // Before the hint: the bubble asks whether the child wants one.
    return (
      <View className="flex-row items-end gap-3">
        <HeroView hero={hero} pose="encourage" size="sm" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.hint}
          onPress={onShowHint}
          className="mb-2 flex-1 rounded-lg rounded-bl-sm border-2 border-dashed border-border bg-raised px-4 py-3 active:opacity-80"
        >
          <ThemedText>{t.hintAsk}</ThemedText>
        </Pressable>
      </View>
    );
  }
  return (
    <View className="flex-row items-end gap-3" accessibilityLiveRegion="polite">
      <HeroView hero={hero} pose={pose} size="sm" />
      <SpeechBubble className="mb-2 flex-1">{text}</SpeechBubble>
    </View>
  );
}
