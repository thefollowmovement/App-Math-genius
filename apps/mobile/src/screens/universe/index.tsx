import { Button, Pressable, Screen, TextField, ThemedText, View } from '@math-genius/ui';
import { useState } from 'react';

import { CenterGlow } from '@/components/decor';
import { Icon } from '@/components/game/icons';
import { ProgressBar } from '@/components/game/progress-bar';
import { HeroSays } from '@/components/hero/hero-says';
import type { ErrorKind } from '@/data/errors';
import { type Answers, type UniverseQuestion, toggled } from '@/data/universe-model';
import { strings } from '@/i18n';

import { OptionCard } from './option-card';

const t = strings.universe;
const OTHER_MAX_LENGTH = 40;

export type UniverseMode = 'first' | 'again' | 'edit';

type UniverseQuestionnaireProps = {
  childName: string;
  /** The first time and the later ones start with a word from the hero; editing does not. */
  mode: UniverseMode;
  questions: readonly UniverseQuestion[];
  initial: Answers;
  saving: boolean;
  /** Saved: the questionnaire shows its last screen. */
  saved: boolean;
  error: ErrorKind | null;
  onSave: (answers: Answers) => void;
  /** « Plus tard », or the cross: leaves without saving. */
  onLater: () => void;
  onContinue: () => void;
};

/**
 * « Ton univers » (docs/specs.md): one question per screen, choices to touch, a free answer at
 * collège, 1 to 2 minutes and optional.
 */
export function UniverseQuestionnaire({
  childName,
  mode,
  questions,
  initial,
  saving,
  saved,
  error,
  onSave,
  onLater,
  onContinue,
}: UniverseQuestionnaireProps) {
  // -1: the hero's introduction.
  const [step, setStep] = useState(mode === 'edit' ? 0 : -1);
  const [answers, setAnswers] = useState<Answers>(initial);

  if (saved) return <Saved onContinue={onContinue} />;
  if (step < 0) {
    return (
      <Intro
        title={(mode === 'again' ? t.intro.again : t.intro.first).title(childName)}
        text={(mode === 'again' ? t.intro.again : t.intro.first).text}
        onStart={() => setStep(0)}
        onLater={onLater}
      />
    );
  }

  const question = questions[step];
  if (!question) return null;
  const last = step === questions.length - 1;
  const answer = answers[question.id] ?? { universes: [], other: '' };
  const back = step > 0 || mode !== 'edit' ? () => setStep(step - 1) : null;

  return (
    <Screen
      headerless
      backdrop={<CenterGlow />}
      top={
        <View className="flex-row items-center gap-3">
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.back}
              onPress={back}
              hitSlop={4}
              className="size-11 items-center justify-center rounded-md border-2 border-border bg-surface active:opacity-80"
            >
              <Icon name="back" color="muted" size="sm" />
            </Pressable>
          ) : null}
          <ProgressBar
            value={(step + 1) / questions.length}
            size="sm"
            label={t.progress}
            valueText={t.step(step + 1, questions.length)}
            className="flex-1"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.close}
            onPress={onLater}
            hitSlop={4}
            className="size-11 items-center justify-center rounded-md border-2 border-border bg-surface active:opacity-80"
          >
            <Icon name="close" color="muted" size="sm" />
          </Pressable>
        </View>
      }
      footer={
        <Button
          size="lg"
          title={last ? t.finish : t.next}
          loading={saving}
          onPress={() => (last ? onSave(answers) : setStep(step + 1))}
        />
      }
    >
      <View className="gap-1">
        <ThemedText variant="label" tone="secondary">
          {t.step(step + 1, questions.length)}
        </ThemedText>
        <ThemedText variant="title" accessibilityRole="header">
          {question.title}
        </ThemedText>
        <ThemedText tone="muted">{t.pickMany}</ThemedText>
      </View>
      <View className="flex-row flex-wrap gap-3" accessibilityLabel={question.title}>
        {question.options.map((option) => (
          <OptionCard
            key={option.universeId}
            option={option}
            chosen={answer.universes.includes(option.universeId)}
            onPress={() => setAnswers(toggled(answers, question.id, option.universeId))}
            // Two by two: each takes half the row, less half the gap.
            className="grow basis-[45%]"
          />
        ))}
      </View>
      {question.allowsOther ? (
        <TextField
          label={t.other}
          hint={t.otherHint}
          value={answer.other}
          maxLength={OTHER_MAX_LENGTH}
          onChangeText={(other) => setAnswers({ ...answers, [question.id]: { ...answer, other } })}
        />
      ) : null}
      {error ? (
        <ThemedText tone="danger" accessibilityLiveRegion="polite">
          {strings.errors[error]}
        </ThemedText>
      ) : null}
    </Screen>
  );
}

function Intro(props: { title: string; text: string; onStart: () => void; onLater: () => void }) {
  return (
    <Screen
      headerless
      backdrop={<CenterGlow />}
      footer={
        <View className="gap-3">
          <Button size="lg" title={t.intro.start} onPress={props.onStart} />
          <Button variant="ghost" title={t.intro.later} onPress={props.onLater} />
        </View>
      }
    >
      <View className="items-center gap-1">
        <ThemedText variant="label" tone="secondary">
          {t.intro.first.label}
        </ThemedText>
        <ThemedText variant="title" className="text-center halo-primary" accessibilityRole="header">
          {props.title}
        </ThemedText>
      </View>
      <HeroSays pose="think" size="md">
        {props.text}
      </HeroSays>
      <View className="gap-3 rounded-lg border-2 border-border bg-surface p-5">
        {t.intro.points.map((point) => (
          <View key={point} className="flex-row items-start gap-3">
            <Icon name="check" color="successInk" size="sm" />
            <ThemedText className="flex-1">{point}</ThemedText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

function Saved({ onContinue }: { onContinue: () => void }) {
  return (
    <Screen
      headerless
      backdrop={<CenterGlow />}
      footer={<Button size="lg" title={t.saved.continue} onPress={onContinue} />}
    >
      <View className="flex-1" />
      <View className="items-center gap-1">
        <ThemedText variant="label" tone="secondary">
          {t.saved.label}
        </ThemedText>
        <ThemedText variant="title" className="text-center halo-primary" accessibilityRole="header">
          {t.saved.title}
        </ThemedText>
      </View>
      <HeroSays pose="victory" size="md">
        {t.saved.hero}
      </HeroSays>
      <View className="flex-1" />
    </Screen>
  );
}
