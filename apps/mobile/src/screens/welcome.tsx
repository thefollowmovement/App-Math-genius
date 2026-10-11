import { Button, ThemedText, View } from '@math-genius/ui';

import { strings } from '@/i18n';

type WelcomeProps = {
  onChooseParent: () => void;
  onChooseChild: () => void;
};

export function Welcome({ onChooseParent, onChooseChild }: WelcomeProps) {
  return (
    <View className="flex-1 justify-center bg-background px-6">
      <View className="w-full max-w-md gap-10 self-center">
        <View className="items-center gap-2">
          <ThemedText variant="display" className="text-center">
            {strings.welcome.title}
          </ThemedText>
          <ThemedText className="text-center">{strings.welcome.subtitle}</ThemedText>
        </View>
        <View className="gap-4">
          <Button size="lg" title={strings.welcome.parent} onPress={onChooseParent} />
          <Button
            size="lg"
            variant="secondary"
            title={strings.welcome.child}
            onPress={onChooseChild}
          />
        </View>
      </View>
    </View>
  );
}
