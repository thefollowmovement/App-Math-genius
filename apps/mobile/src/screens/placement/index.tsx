import type { Exercise, ExerciseResponse } from '@math-genius/exercise-engine';
import { Button, Pressable, Screen, ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { Icon } from '@/components/game/icons';
import { ProgressBar } from '@/components/game/progress-bar';
import { HeroSays } from '@/components/hero/hero-says';
import { strings } from '@/i18n';

import { ExerciseInput } from '../practice/inputs/exercise-input';

const t = strings.placement.test;

type PlacementScreenProps = {
  exercise: Exercise;
  /** How far the test is, 0 to 1. */
  progress: number;
  /** A later test, to check the placement again. */
  recheck: boolean;
  /** Answer to correct before it counts (unreadable, wrong form). */
  notice: string | null;
  onSubmit: (response: ExerciseResponse) => void;
  onSkip: () => void;
  onPause: () => void;
};

/**
 * A question of the placement test: no timer, no score, no correction (docs/specs.md). The hero
 * encourages, and « Je ne sais pas » is always there.
 */
export function PlacementScreen(props: PlacementScreenProps) {
  // A new question starts with a new draft (and new inputs).
  const { exercise } = props;
  return <Question key={`${exercise.generatorId}:${exercise.seed}`} {...props} />;
}

function Question({
  exercise,
  progress,
  recheck,
  notice,
  onSubmit,
  onSkip,
  onPause,
}: PlacementScreenProps) {
  const [draft, setDraft] = useState<ExerciseResponse | null>(null);
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const cheer = t.cheers[exercise.seed % t.cheers.length] ?? t.cheers[0];
  const footer = (
    <View className="gap-3">
      <Button
        size="lg"
        variant="success"
        title={t.submit}
        disabled={draft === null}
        onPress={() => {
          if (draft) onSubmit(draft);
        }}
      />
      <Button variant="outline" title={t.skip} onPress={onSkip} />
    </View>
  );

  return (
    <Screen headerless footer={footer}>
      <View className="flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.pauseLabel}
          onPress={onPause}
          hitSlop={4}
          className="size-11 items-center justify-center rounded-md border-2 border-border bg-surface active:opacity-80"
        >
          <Icon name="close" color="muted" size="sm" />
        </Pressable>
        <ProgressBar
          value={progress}
          size="lg"
          label={t.progress(percent)}
          fillStyle={styles.fill}
          className="flex-1"
        />
      </View>
      <View className="gap-4 rounded-lg border-2 border-border bg-surface p-5">
        <ThemedText variant="label" tone="secondary">
          {recheck ? t.labelRecheck : t.label}
        </ThemedText>
        <ThemedText variant="statement" accessibilityRole="header">
          {exercise.prompt}
        </ThemedText>
      </View>
      <ExerciseInput exercise={exercise} answered={null} onChange={setDraft} />
      {notice ? (
        <ThemedText tone="danger" accessibilityLiveRegion="polite">
          {notice}
        </ThemedText>
      ) : null}
      {/* The hero stands at the bottom, above the buttons, when the question is short. */}
      <View className="flex-1" />
      <HeroSays pose="encourage">{cheer ?? ''}</HeroSays>
    </Screen>
  );
}

// The fill follows each answer (150 ms): out of the flow, so no layout pass.
const styles = StyleSheet.create({
  fill: {
    transitionProperty: 'width',
    transitionDuration: 150,
    transitionTimingFunction: 'ease-out',
  },
});
