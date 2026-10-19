import type { Exercise, ExerciseResponse, Slot } from '@math-genius/exercise-engine';
import { Button, Screen, ThemedText, View } from '@math-genius/ui';

import { strings } from '@/i18n';

import { EclairTimer } from './eclair-timer';
import { FeedbackPanel } from './feedback-panel';
import { ExerciseInput } from './inputs/exercise-input';
import { SessionHeader } from './session-header';

const t = strings.practice;

export type PracticeFeedback = {
  response: ExerciseResponse;
  correct: boolean;
  fast: boolean;
  finished: boolean;
};

type PracticeScreenProps = {
  exercise: Exercise;
  slot: Slot;
  twin: boolean;
  /** Errors in a row: the hint is shown up front as a reminder. */
  reminder: boolean;
  progress: number;
  hintShown: boolean;
  /** Answer to correct before grading (unreadable, wrong form). */
  notice: string | null;
  feedback: PracticeFeedback | null;
  onShowHint: () => void;
  onSubmit: (response: ExerciseResponse) => void;
  onContinue: () => void;
  onPause: () => void;
};

export function PracticeScreen({
  exercise,
  slot,
  twin,
  reminder,
  progress,
  hintShown,
  notice,
  feedback,
  onShowHint,
  onSubmit,
  onContinue,
  onPause,
}: PracticeScreenProps) {
  return (
    <Screen>
      <SessionHeader progress={progress} slot={slot} twin={twin} onPause={onPause} />
      {reminder && !feedback ? <Card title={t.reminder} text={exercise.hint} /> : null}
      <ThemedText variant="title" accessibilityRole="header">
        {exercise.prompt}
      </ThemedText>
      {slot === 'automatism' && !feedback ? <EclairTimer key={exercise.seed} /> : null}
      <ExerciseInput
        key={`${exercise.generatorId}:${exercise.seed}`}
        exercise={exercise}
        answered={feedback?.response ?? null}
        onSubmit={onSubmit}
      />
      {notice ? (
        <ThemedText tone="danger" accessibilityLiveRegion="polite">
          {notice}
        </ThemedText>
      ) : null}
      {feedback ? (
        <FeedbackPanel
          exercise={exercise}
          correct={feedback.correct}
          fast={feedback.fast}
          finished={feedback.finished}
          onContinue={onContinue}
        />
      ) : null}
      {!feedback && !reminder && hintShown ? (
        <Card title={t.hintTitle} text={exercise.hint} />
      ) : null}
      {!feedback && !reminder && !hintShown ? (
        <Button variant="ghost" title={t.hint} onPress={onShowHint} />
      ) : null}
    </Screen>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <View className="gap-1 rounded-lg border border-border bg-surface p-4">
      <ThemedText variant="headline">{title}</ThemedText>
      <ThemedText>{text}</ThemedText>
    </View>
  );
}
