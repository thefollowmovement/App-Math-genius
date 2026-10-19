import {
  Pressable,
  ThemeProvider,
  ThemedText,
  View,
  cx,
  themes,
  type ThemeId,
} from '@math-genius/ui';

import { strings } from '@/i18n';

const t = strings.look;

type ThemeCardProps = {
  id: ThemeId;
  chosen: boolean;
  onPress: () => void;
};

/** A theme, drawn in its own colors and font. */
export function ThemeCard({ id, chosen, onPress }: ThemeCardProps) {
  const text = strings.themes[id];
  return (
    <ThemeProvider theme={themes[id]}>
      <Pressable
        accessibilityRole="radio"
        accessibilityState={{ checked: chosen }}
        accessibilityLabel={t.themeLabel(text.name, text.description)}
        onPress={onPress}
        className={cx(
          'gap-3 rounded-lg border-2 bg-background p-4 active:opacity-80',
          chosen ? 'border-primary' : 'border-border',
        )}
      >
        <View className="flex-row items-center gap-3">
          <ThemedText variant="title">{text.icon}</ThemedText>
          <ThemedText variant="title" className="flex-1">
            {text.name}
          </ThemedText>
          {chosen ? (
            <View className="rounded-full bg-primary px-3 py-1">
              <ThemedText variant="caption" tone="onPrimary">
                {t.chosen}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText variant="caption">{text.description}</ThemedText>
        <View className="flex-row gap-2">
          <View className="h-3 flex-1 rounded-full bg-primary" />
          <View className="h-3 flex-1 rounded-full bg-secondary" />
          <View className="h-3 flex-1 rounded-full bg-success" />
        </View>
      </Pressable>
    </ThemeProvider>
  );
}
