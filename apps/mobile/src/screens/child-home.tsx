import { Avatar, Button, Screen, ThemedText, View } from '@math-genius/ui';

import type { Child } from '@/data/children';
import { strings } from '@/i18n';

const t = strings.childHome;

type ChildHomeProps = {
  child: Child;
  /** Shown when the device holds several profiles or a parent is signed in. */
  onSwitchProfile?: () => void;
};

export function ChildHome({ child, onSwitchProfile }: ChildHomeProps) {
  return (
    <Screen centered>
      <View className="items-center gap-4">
        <Avatar name={child.display_name} size="lg" />
        <ThemedText variant="display" className="text-center">
          {t.greeting(child.display_name)}
        </ThemedText>
        <ThemedText className="text-center">{t.soon}</ThemedText>
      </View>
      {onSwitchProfile ? (
        <Button variant="ghost" title={t.switchProfile} onPress={onSwitchProfile} />
      ) : null}
    </Screen>
  );
}
