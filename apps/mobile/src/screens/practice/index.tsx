import { getSkill } from '@math-genius/curriculum';
import type { Exercise, ExerciseResponse, Island, Slot } from '@math-genius/exercise-engine';
import { Button, Screen, ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';

import { strings } from '@/i18n';

import { Correction } from './correction';
import { EclairTimer } from './eclair-timer';
import { HeroLine } from './hero-line';
import { ExerciseInput } from './inputs/exercise-input';
import { SessionHeader, type SessionCount } from './session-header';

const t = strings.practice;

// The kinds of exercise worth telling: a timed calculation, a challenge.
const TOLD: readonly Slot[] = ['automatism', 'challenge'];

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
  /** A boss session: the island it evaluates. */
  boss?: Island;
  /** Errors in a row: the hint is shown up front as a reminder. */
  reminder: boolean;
  progress: number;
  count: SessionCount;
  /** Right answers in a row, the current one included. */
  combo: number;
  hintShown: boolean;
  /** Answer to correct before grading (unreadable, wrong form). */
  notice: string | null;
  feedback: PracticeFeedback | null;
  onShowHint: () => void;
  onSubmit: (response: ExerciseResponse) => void;
  onContinue: () => void;
  onPause: () => void;
};

/** An exercise of the session (docs/design/maquettes/Seance.html). */
export function PracticeScreen(props: PracticeScreenProps) {
  // A new exercise starts with a new draft (and new inputs).
  const { exercise } = props;
  return <ExerciseView key={`${exercise.generatorId}:${exercise.seed}`} {...props} />;
}

function ExerciseView({
  exercise,
  slot,
  twin,
  boss,
  reminder,
  progress,
  count,
  combo,
  hintShown,
  notice,
  feedback,
  onShowHint,
  onSubmit,
  onContinue,
  onPause,
}: PracticeScreenProps) {
  const [draft, setDraft] = useState<ExerciseResponse | null>(null);
  const footer = feedback ? (
    <Button
      size="lg"
      variant={feedback.correct ? 'success' : 'primary'}
      title={feedback.finished ? t.finish : t.continue}
      onPress={onContinue}
    />
  ) : (
    <Button
      size="lg"
      variant="success"
      title={t.submit}
      disabled={draft === null}
      onPress={() => {
        if (draft) onSubmit(draft);
      }}
    />
  );

  return (
    <Screen headerless footer={footer}>
      <SessionHeader progress={progress} count={count} combo={combo} onPause={onPause} />
      <View className="gap-4 rounded-lg border-2 border-border bg-surface p-5">
        <View className="flex-row items-center justify-between gap-2">
          {/* One line: a screen reader still reads it all. */}
          <ThemedText variant="label" tone="secondary" numberOfLines={1} className="shrink">
            {boss ? t.boss(strings.map.islands[boss.domain].name) : getSkill(exercise.skill).title}
          </ThemedText>
          {twin ? (
            <Chip label={t.twin} />
          ) : TOLD.includes(slot) && !boss ? (
            <Chip label={t.slots[slot]} />
          ) : null}
        </View>
        <ThemedText variant="statement" accessibilityRole="header">
          {exercise.prompt}
        </ThemedText>
        {slot === 'automatism' && !feedback ? <EclairTimer /> : null}
      </View>
      <ExerciseInput
        exercise={exercise}
        answered={feedback?.response ?? null}
        onChange={setDraft}
      />
      {notice ? (
        <ThemedText tone="danger" accessibilityLiveRegion="polite">
          {notice}
        </ThemedText>
      ) : null}
      {feedback && !feedback.correct ? <Correction exercise={exercise} /> : null}
      {/* The hero stands at the bottom, above the button, when the exercise is short. */}
      <View className="flex-1" />
      <HeroLine
        exercise={exercise}
        feedback={feedback}
        reminder={reminder}
        hintShown={hintShown}
        onShowHint={onShowHint}
      />
    </Screen>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <View className="rounded-full bg-background px-3 py-1">
      <ThemedText variant="label" tone="accent">
        {label}
      </ThemedText>
    </View>
  );
}
