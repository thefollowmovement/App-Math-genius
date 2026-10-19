import type { HeroId } from '@math-genius/shared';
import { Button, Screen, ThemedText, View, cx } from '@math-genius/ui';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Decor } from '@/components/decor';
import { HeroView } from '@/components/hero/hero-view';
import type { ErrorKind } from '@/data/errors';
import { strings } from '@/i18n';

import { HeroPicker } from './look/hero-picker';

const t = strings.intro;
// The pose of the hero on each step after the choice.
const POSES = ['encourage', 'think', 'victory'] as const;
const STEP_COUNT = t.steps.length + 1;

type HeroIntroProps = {
  childName: string;
  /** 0: the child chooses a hero; then the hero presents the app. */
  step: number;
  hero: HeroId;
  saving: boolean;
  error: ErrorKind | null;
  onPickHero: (hero: HeroId) => void;
  onConfirmHero: () => void;
  onNext: () => void;
  /** Last step: home, or the editor to dress the hero first. */
  onStart: () => void;
  onCustomize: () => void;
};

/**
 * The child's first time on a device (docs/specs.md, onboarding): « Choisis ton héros », then the
 * hero presents the app in three short steps.
 */
export function HeroIntro(props: HeroIntroProps) {
  const { step, hero } = props;
  return (
    <Screen centered backdrop={<Decor />}>
      {/* Each step fades in: an occasional moment, kept short. */}
      <Animated.View key={step} entering={FadeIn.duration(250)}>
        {step === 0 ? <ChooseStep {...props} /> : <HeroStep {...props} hero={hero} step={step} />}
      </Animated.View>
      <View
        className="flex-row justify-center gap-2"
        accessible
        accessibilityLabel={t.progress(step + 1, STEP_COUNT)}
      >
        {Array.from({ length: STEP_COUNT }, (_, index) => (
          <View
            key={index}
            className={cx('size-3 rounded-full', index === step ? 'bg-primary' : 'bg-border')}
          />
        ))}
      </View>
    </Screen>
  );
}

function ChooseStep({ hero, saving, error, onPickHero, onConfirmHero }: HeroIntroProps) {
  return (
    <View className="gap-6">
      <View className="gap-2">
        <ThemedText variant="display" className="text-center" accessibilityRole="header">
          {t.choose.title}
        </ThemedText>
        <ThemedText className="text-center">{t.choose.text}</ThemedText>
      </View>
      <HeroPicker chosen={hero} onPick={onPickHero} />
      {error ? (
        <ThemedText tone="danger" className="text-center" accessibilityLiveRegion="polite">
          {strings.errors[error]}
        </ThemedText>
      ) : null}
      <Button
        size="lg"
        title={t.choose.confirm(strings.heroes.items[hero].name)}
        loading={saving}
        onPress={onConfirmHero}
      />
    </View>
  );
}

function HeroStep({ childName, hero, step, onNext, onStart, onCustomize }: HeroIntroProps) {
  const index = Math.min(step - 1, t.steps.length - 1);
  const current = t.steps[index] ?? t.steps[0];
  const last = index === t.steps.length - 1;
  return (
    <View className="gap-6">
      <View className="items-center">
        <HeroView hero={hero} pose={POSES[index] ?? 'victory'} size="lg" />
      </View>
      <View className="gap-3">
        <ThemedText variant="display" className="text-center" accessibilityRole="header">
          {current.title(childName)}
        </ThemedText>
        <ThemedText className="text-center">
          {current.text(strings.heroes.items[hero].name)}
        </ThemedText>
      </View>
      {last ? (
        <View className="gap-3">
          <Button size="lg" title={t.start} onPress={onStart} />
          <Button variant="ghost" title={t.customize} onPress={onCustomize} />
        </View>
      ) : (
        <Button size="lg" title={t.next} onPress={onNext} />
      )}
    </View>
  );
}
