import { Button, Pressable, Screen, ThemedText, View } from '@math-genius/ui';

import { ChildHero } from '@/components/hero/child-hero';
import type { Child } from '@/data/children';
import { type ChildDay, minutesOf } from '@/data/session-report';
import { strings } from '@/i18n';
import { timeText } from '@/utils/routine-text';

const t = strings.parentHome;

type ParentHomeProps = {
  parentName: string | undefined;
  childProfiles: Child[];
  /** Today's state of each child, by child id; missing while it loads. */
  today: Record<string, ChildDay>;
  onAddChild: () => void;
  onOpenChild: (childId: string) => void;
  onChildMode: () => void;
  /** How the weekly and monthly recaps reach this parent. */
  onOpenRecaps?: () => void;
  onSignOut: () => void;
};

export function ParentHome({
  parentName,
  childProfiles,
  today,
  onAddChild,
  onOpenChild,
  onChildMode,
  onOpenRecaps,
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
            <ChildHero child={child} size="sm" />
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
      {onOpenRecaps && childProfiles.length > 0 ? (
        <Button variant="outline" title={t.recaps} onPress={onOpenRecaps} />
      ) : null}
      <Button variant="ghost" title={t.signOut} onPress={onSignOut} />
    </Screen>
  );
}

function TodayLine({ day }: { day: ChildDay | undefined }) {
  if (!day) return null;
  const { main, startsAt } = day;
  const detail =
    main && main.answered > 0
      ? t.todayScore(main.score, main.answered, minutesOf(main))
      : startsAt !== null
        ? t.startsAt(timeText(startsAt))
        : null;
  return (
    <ThemedText tone={day.status === 'missed' ? 'danger' : 'default'}>
      {t.todayLine(t.today[day.status], detail)}
    </ThemedText>
  );
}
