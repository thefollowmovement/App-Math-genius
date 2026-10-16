import { Avatar, Button, Pressable, Screen, ThemedText, View } from '@math-genius/ui';

import type { Child } from '@/data/children';
import { type ChildDay, minutesOf } from '@/data/session-report';
import { strings } from '@/i18n';

const t = strings.parentHome;

type ParentHomeProps = {
  parentName: string | undefined;
  childProfiles: Child[];
  /** Today's state of each child, by child id; missing while it loads. */
  today: Record<string, ChildDay>;
  onAddChild: () => void;
  onOpenChild: (childId: string) => void;
  onChildMode: () => void;
  onSignOut: () => void;
};

export function ParentHome({
  parentName,
  childProfiles,
  today,
  onAddChild,
  onOpenChild,
  onChildMode,
  onSignOut,
}: ParentHomeProps) {
  return (
    <Screen>
      {parentName ? <ThemedText variant="headline">{t.greeting(parentName)}</ThemedText> : null}
      {childProfiles.length === 0 ? <ThemedText>{t.empty}</ThemedText> : null}
      <View className="gap-3">
        {childProfiles.map((child) => (
          <Pressable
            key={child.id}
            accessibilityRole="button"
            accessibilityLabel={child.display_name}
            onPress={() => onOpenChild(child.id)}
            className="flex-row items-center gap-4 rounded-lg border border-border bg-surface p-4 active:opacity-80"
          >
            <Avatar name={child.display_name} />
            <View className="flex-1 gap-1">
              <ThemedText variant="headline">{child.display_name}</ThemedText>
              <ThemedText variant="caption">{strings.grades[child.grade]}</ThemedText>
              <TodayLine day={today[child.id]} />
            </View>
          </Pressable>
        ))}
      </View>
      <Button size="lg" title={t.addChild} onPress={onAddChild} />
      {childProfiles.length > 0 ? (
        <Button variant="secondary" title={t.childMode} onPress={onChildMode} />
      ) : null}
      <Button variant="ghost" title={t.signOut} onPress={onSignOut} />
    </Screen>
  );
}

function TodayLine({ day }: { day: ChildDay | undefined }) {
  if (!day) return null;
  const { main } = day;
  const score =
    main && main.answered > 0 ? t.todayScore(main.score, main.answered, minutesOf(main)) : null;
  return <ThemedText>{t.todayLine(t.today[day.status], score)}</ThemedText>;
}
