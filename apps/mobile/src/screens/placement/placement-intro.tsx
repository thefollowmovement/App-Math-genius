import { heroLook } from '@math-genius/shared';
import { Button, Screen, ThemedText, View } from '@math-genius/ui';

import { CenterGlow } from '@/components/decor';
import { Icon } from '@/components/game/icons';
import { useChildHero } from '@/components/hero/hero-context';
import { HeroView } from '@/components/hero/hero-view';
import { strings } from '@/i18n';

const t = strings.placement.intro;

type PlacementIntroProps = {
  childName: string;
  /** A later test, to check the placement again. */
  recheck: boolean;
  onStart: () => void;
  onLater: () => void;
};

/** Before the test: « aventure de départ », and why there is nothing to fear. */
export function PlacementIntro({ childName, recheck, onStart, onLater }: PlacementIntroProps) {
  const avatar = useChildHero();
  const copy = recheck ? t.recheck : t.first;
  return (
    <Screen
      headerless
      backdrop={<CenterGlow />}
      footer={
        <View className="gap-3">
          <Button size="lg" title={t.start} onPress={onStart} />
          <Button variant="ghost" title={t.later} onPress={onLater} />
        </View>
      }
    >
      <View className="items-center gap-1">
        <ThemedText variant="label" tone="secondary">
          {copy.label}
        </ThemedText>
        <ThemedText variant="title" className="text-center halo-primary" accessibilityRole="header">
          {copy.title(childName)}
        </ThemedText>
        <ThemedText tone="muted" className="text-center">
          {copy.text}
        </ThemedText>
      </View>
      <View className="items-center">
        <HeroView look={heroLook(avatar)} pose="think" size="md" />
      </View>
      <View className="gap-3 rounded-lg border-2 border-border bg-surface p-5">
        {t.points.map((point) => (
          <View key={point} className="flex-row items-start gap-3">
            <Icon name="check" color="successInk" size="sm" />
            <ThemedText className="flex-1">{point}</ThemedText>
          </View>
        ))}
      </View>
    </Screen>
  );
}
