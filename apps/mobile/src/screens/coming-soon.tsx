import { ThemedText, View } from '@math-genius/ui';

import { strings } from '@/i18n';

export function ComingSoon() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-background px-6">
      <ThemedText variant="title" className="text-center">
        {strings.comingSoon.title}
      </ThemedText>
      <ThemedText variant="caption" className="text-center">
        {strings.comingSoon.body}
      </ThemedText>
    </View>
  );
}
