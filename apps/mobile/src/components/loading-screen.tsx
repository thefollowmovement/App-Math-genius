import { ActivityIndicator, View } from '@math-genius/ui';

import { strings } from '@/i18n';

export function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator className="text-foreground" accessibilityLabel={strings.common.loading} />
    </View>
  );
}
