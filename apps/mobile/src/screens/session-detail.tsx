import { cx, Screen, ThemedText, View } from '@math-genius/ui';

import type { SessionRow } from '@/data/family-sessions';
import { type AttemptView, minutesOf, sessionState } from '@/data/session-report';
import { strings } from '@/i18n';

import { SessionStateChip } from './session-state-chip';

const t = strings.sessionDetail;
const sessions = strings.todaySessions;

type SessionDetailProps = {
  session: SessionRow;
  attempts: readonly AttemptView[];
};

/** Every question of a session with the child's answer, and the right one after a mistake. */
export function SessionDetail({ session, attempts }: SessionDetailProps) {
  return (
    <Screen>
      <View className="gap-2">
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <ThemedText variant="title">{sessions.kinds[session.kind]}</ThemedText>
          <SessionStateChip state={sessionState(session)} />
        </View>
        <ThemedText>
          {sessions.summary(
            sessions.score(session.score, session.answered),
            sessions.duration(minutesOf(session)),
          )}
        </ThemedText>
        {session.flagged ? (
          <ThemedText variant="caption" tone="danger">
            {sessions.flagged}
          </ThemedText>
        ) : null}
      </View>
      {attempts.length === 0 ? <ThemedText variant="caption">{t.empty}</ThemedText> : null}
      {attempts.map((attempt) => (
        <View
          key={attempt.position}
          className={cx(
            'gap-2 rounded-lg border-2 bg-surface p-4',
            attempt.correct ? 'border-border' : 'border-danger',
          )}
        >
          <ThemedText variant="caption">
            {t.question(attempt.position + 1, attempt.skill)}
          </ThemedText>
          <ThemedText variant="headline">{attempt.prompt ?? t.unavailable}</ThemedText>
          {attempt.answer !== null ? (
            <ThemedText tone={attempt.correct ? 'default' : 'danger'}>
              {t.answer(attempt.answer)}
            </ThemedText>
          ) : null}
          {attempt.rightAnswer !== null ? (
            <ThemedText>{t.rightAnswer(attempt.rightAnswer)}</ThemedText>
          ) : null}
          <ThemedText variant="caption">
            {t.meta(attempt.correct, attempt.seconds, attempt.hintUsed)}
          </ThemedText>
        </View>
      ))}
    </Screen>
  );
}
