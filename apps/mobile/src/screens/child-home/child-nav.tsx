import { Pressable, ThemedText, View } from '@math-genius/ui';

import { Icon, type IconName } from '@/components/game/icons';
import { strings } from '@/i18n';

export type NavLink = { key: string; icon: IconName; label: string; onPress: () => void };

/** The child's other pages, in a bar at the bottom of the home. */
export function ChildNav({ links }: { links: NavLink[] }) {
  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel={strings.childHome.nav.label}
      className="flex-row justify-around rounded-lg border-2 border-border bg-surface p-2"
    >
      {links.map(({ key, icon, label, onPress }) => (
        <Pressable
          key={key}
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          className="min-h-13 min-w-16 items-center justify-center gap-1 rounded-md px-2 py-2 active:bg-raised"
        >
          <Icon name={icon} color="muted" />
          <ThemedText variant="caption" numberOfLines={1}>
            {label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}
