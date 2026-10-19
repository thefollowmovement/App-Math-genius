import { Avatar, Button, Pressable, Screen, ThemedText, View } from '@math-genius/ui';

import { Decor } from '@/components/decor';
import type { Child } from '@/data/children';
import { strings } from '@/i18n';

const t = strings.profiles;

type ProfilePickerProps = {
  childProfiles: Child[];
  onPick: (childId: string) => void;
  /** Pair this device with one more child (shared tablet). */
  onPairAnother?: () => void;
};

export function ProfilePicker({ childProfiles, onPick, onPairAnother }: ProfilePickerProps) {
  return (
    <Screen centered backdrop={<Decor />}>
      <ThemedText variant="title" className="text-center">
        {t.title}
      </ThemedText>
      {childProfiles.length === 0 ? (
        <ThemedText className="text-center">{t.empty}</ThemedText>
      ) : null}
      <View className="flex-row flex-wrap justify-center gap-4">
        {childProfiles.map((child) => (
          <Pressable
            key={child.id}
            accessibilityRole="button"
            accessibilityLabel={child.display_name}
            onPress={() => onPick(child.id)}
            className="w-36 items-center gap-3 rounded-lg border border-border bg-surface p-4 active:opacity-80"
          >
            <Avatar name={child.display_name} size="lg" />
            <ThemedText variant="headline" className="text-center">
              {child.display_name}
            </ThemedText>
            <ThemedText variant="caption">{strings.grades[child.grade]}</ThemedText>
          </Pressable>
        ))}
      </View>
      {onPairAnother ? (
        <Button variant="ghost" title={t.pairAnother} onPress={onPairAnother} />
      ) : null}
    </Screen>
  );
}
