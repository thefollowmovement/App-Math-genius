import { Pressable, ThemedText, View } from '@math-genius/ui';

import type { SessionRow } from '@/data/family-sessions';
import { minutesOf, sessionState, showsFastAnswers } from '@/data/session-report';
import { strings } from '@/i18n';

import { SessionStateChip } from './session-state-chip';

const t = strings.todaySessions;
const timeFormat = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

type TodaySessionsProps = {
  sessions: readonly SessionRow[];
  onOpenSession: (sessionId: string) => void;
};

/** The child's sessions today: status, score and time, each opening its questions. */
export function TodaySessions({ sessions, onOpenSession }: TodaySessionsProps) {
  return (
    <View className="gap-3">
      <ThemedText variant="headline" accessibilityRole="header">
        {t.title}
      </ThemedText>
      {sessions.length === 0 ? <ThemedText variant="caption">{t.empty}</ThemedText> : null}
      {sessions.map((session) => (
        <Pressable
          key={session.id}
          accessibilityRole="button"
          accessibilityHint={t.open}
          onPress={() => onOpenSession(session.id)}
          className="gap-2 rounded-lg border border-border bg-surface p-4 active:opacity-80"
        >
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <ThemedText variant="headline">{t.kinds[session.kind]}</ThemedText>
            <SessionStateChip state={sessionState(session)} />
          </View>
          <ThemedText variant="caption">
            {t.startedAt(timeFormat.format(new Date(session.started_at)))}
          </ThemedText>
          <ThemedText>
            {t.summary(t.score(session.score, session.answered), t.duration(minutesOf(session)))}
          </ThemedText>
          {showsFastAnswers(session) ? (
            <ThemedText variant="caption" tone="danger">
              {t.flagged}
            </ThemedText>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}
