import { Pressable, ThemedText, View } from '@math-genius/ui';

export type Shortcut = { key: string; icon: string; label: string; onPress: () => void };

/** The child's other pages, two by two. */
export function ChildShortcuts({ shortcuts }: { shortcuts: Shortcut[] }) {
  const rows = shortcuts.flatMap((shortcut, index) =>
    index % 2 === 0 ? [shortcuts.slice(index, index + 2)] : [],
  );
  return (
    <View className="gap-3">
      {rows.map((row) => (
        <View key={row.map(({ key }) => key).join()} className="flex-row gap-3">
          {row.map(({ key, icon, label, onPress }) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityLabel={label}
              onPress={onPress}
              className="flex-1 items-center gap-1 rounded-lg border border-border bg-surface p-4 active:opacity-80"
            >
              <ThemedText variant="title">{icon}</ThemedText>
              <ThemedText variant="headline" className="text-center">
                {label}
              </ThemedText>
            </Pressable>
          ))}
          {/* A last shortcut alone keeps half the width. */}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}
