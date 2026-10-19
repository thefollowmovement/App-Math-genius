import { Button, Screen, ThemedText, View, cx } from '@math-genius/ui';
import { useState } from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Decor } from '@/components/decor';
import { Mascot } from '@/components/mascot';
import { strings } from '@/i18n';

const t = strings.intro;

type MascotIntroProps = {
  childName: string;
  /** Last step: the child creates their avatar now, or later. */
  onMakeAvatar: () => void;
  onLater: () => void;
};

/** The mascot introduces itself and the app in three short steps (docs/specs.md, onboarding). */
export function MascotIntro({ childName, onMakeAvatar, onLater }: MascotIntroProps) {
  const [step, setStep] = useState(0);
  const count = t.steps.length;
  const current = t.steps[step] ?? t.steps[0];
  const last = step === count - 1;
  return (
    <Screen centered backdrop={<Decor />}>
      <View className="items-center">
        <Mascot mood={last ? 'cheer' : 'hello'} size="lg" />
      </View>
      {/* Each step fades in: an occasional moment, kept short. */}
      <Animated.View key={step} entering={FadeIn.duration(250)}>
        <View className="gap-3">
          <ThemedText variant="display" className="text-center" accessibilityRole="header">
            {current.title(childName)}
          </ThemedText>
          <ThemedText className="text-center">{current.text(strings.mascot.name)}</ThemedText>
        </View>
      </Animated.View>
      <View
        className="flex-row justify-center gap-2"
        accessible
        accessibilityLabel={t.progress(step + 1, count)}
      >
        {t.steps.map((_, index) => (
          <View
            key={index}
            className={cx('size-3 rounded-full', index === step ? 'bg-primary' : 'bg-border')}
          />
        ))}
      </View>
      {last ? (
        <View className="gap-3">
          <Button size="lg" title={t.makeAvatar} onPress={onMakeAvatar} />
          <Button variant="ghost" title={t.later} onPress={onLater} />
        </View>
      ) : (
        <Button size="lg" title={t.next} onPress={() => setStep(step + 1)} />
      )}
    </Screen>
  );
}
