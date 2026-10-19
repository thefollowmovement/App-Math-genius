import type { Exercise } from '@math-genius/exercise-engine';
import { ThemedText, View } from '@math-genius/ui';

import { strings } from '@/i18n';
import { rightAnswerText } from '@/utils/exercise-text';

const t = strings.practice;

/** After a wrong answer: the right one, and how to find it. */
export function Correction({ exercise }: { exercise: Exercise }) {
  return (
    <View
      accessibilityLiveRegion="polite"
      className="gap-3 rounded-lg border-2 border-danger bg-surface p-4"
    >
      <ThemedText variant="headline" accessibilityRole="header">
        {t.wrong}
      </ThemedText>
      <View className="gap-1">
        <ThemedText variant="label">{t.rightAnswer}</ThemedText>
        <ThemedText variant="score">{rightAnswerText(exercise)}</ThemedText>
      </View>
      <View className="gap-1">
        <ThemedText variant="label">{t.explanation}</ThemedText>
        {exercise.explanation.map((step, index) => (
          <ThemedText key={`${index}-${step}`}>{step}</ThemedText>
        ))}
      </View>
    </View>
  );
}
