import type { HeroId } from '@math-genius/shared';
import { Button, Screen, ThemedText, View, cx } from '@math-genius/ui';
import Animated, { FadeIn } from 'react-native-reanimated';

import { CenterGlow } from '@/components/decor';
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
 * The child's first time on a device (docs/specs.md, onboarding): « Choisis ton héros »
 * (docs/design/maquettes/Avatars.html), then the hero presents the app in three short steps.
 */
export function HeroIntro(props: HeroIntroProps) {
  const { step, hero, saving, onConfirmHero, onNext, onStart, onCustomize } = props;
  const index = Math.min(step - 1, t.steps.length - 1);
  const last = step > 0 && index === t.steps.length - 1;
  const footer =
    step === 0 ? (
      <Button
        size="lg"
        title={t.choose.confirm}
        accessibilityLabel={t.choose.confirmLabel(strings.heroes.items[hero].name)}
        loading={saving}
        onPress={onConfirmHero}
      />
    ) : last ? (
      <View className="gap-3">
        <Button size="lg" title={t.start} onPress={onStart} />
        <Button variant="outline" title={t.customize} onPress={onCustomize} />
      </View>
    ) : (
      <Button size="lg" title={t.next} onPress={onNext} />
    );
  return (
    <Screen headerless backdrop={<CenterGlow />} footer={footer}>
      {/* Each step fades in: an occasional moment, kept short. */}
      <Animated.View key={step} entering={FadeIn.duration(250)}>
        {step === 0 ? <ChooseStep {...props} /> : <HeroStep {...props} index={index} />}
      </Animated.View>
      <View className="flex-1" />
      <View
        className="flex-row justify-center gap-2"
        accessible
        accessibilityLabel={t.progress(step + 1, STEP_COUNT)}
      >
        {Array.from({ length: STEP_COUNT }, (_, dot) => (
          <View
            key={dot}
            className={cx('size-3 rounded-full', dot === step ? 'bg-primary' : 'bg-border')}
          />
        ))}
      </View>
    </Screen>
  );
}

function ChooseStep({ hero, error, onPickHero }: HeroIntroProps) {
  return (
    <View className="gap-5">
      <View className="items-center gap-1">
        <ThemedText variant="label" tone="secondary">
          {t.choose.crew}
        </ThemedText>
        <ThemedText
          variant="display"
          className="text-center halo-primary"
          accessibilityRole="header"
        >
          {t.choose.title}
        </ThemedText>
        <ThemedText tone="muted" className="text-center">
          {t.choose.text}
        </ThemedText>
      </View>
      <HeroPicker chosen={hero} onPick={onPickHero} />
      <ThemedText variant="caption" className="text-center">
        {t.choose.later}
      </ThemedText>
      {error ? (
        <ThemedText tone="danger" className="text-center" accessibilityLiveRegion="polite">
          {strings.errors[error]}
        </ThemedText>
      ) : null}
    </View>
  );
}

function HeroStep({ childName, hero, index }: HeroIntroProps & { index: number }) {
  const current = t.steps[index] ?? t.steps[0];
  return (
    <View className="gap-6">
      <View className="items-center">
        <HeroView hero={hero} pose={POSES[index] ?? 'victory'} size="lg" />
      </View>
      <View className="gap-3">
        <ThemedText
          variant="display"
          className="text-center halo-primary"
          accessibilityRole="header"
        >
          {current.title(childName)}
        </ThemedText>
        <ThemedText className="text-center">
          {current.text(strings.heroes.items[hero].name)}
        </ThemedText>
      </View>
    </View>
  );
}
