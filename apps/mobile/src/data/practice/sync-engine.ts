import { isSkillCode } from '@math-genius/curriculum';
import {
  DIFFICULTIES,
  finishSession,
  itemKey,
  liveMastery,
  masteryOf,
  masteryStatus,
  type ItemRatings,
  type MasteryMap,
  type MasteryRecord,
} from '@math-genius/exercise-engine';
import type { Database, Json } from '@math-genius/shared';

import {
  dropSession,
  markSynced,
  pendingSessions,
  plannerContext,
  type StoredSession,
} from './practice-store';

type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

/** Argument of `sync_session` (supabase/migrations/*_practice_sessions.sql). */
export type SyncPayload = {
  id: string;
  child_id: string;
  kind: StoredSession['kind'];
  local_date: string;
  started_at: string;
  completed_at: string | null;
  goal: { type: 'duration' | 'count'; value: number };
  attempts: Json[];
  mastery: Json[];
};

const toJson = (value: unknown): Json => JSON.parse(JSON.stringify(value));

/** The whole session as the server expects it; sending it twice changes nothing. */
export function sessionPayload(session: StoredSession): SyncPayload {
  const context = plannerContext(session);
  const at = session.completedAt ?? session.attempts.at(-1)?.answeredAt ?? session.startedAt;
  const mastery = session.completedAt
    ? finishSession(context, session.attempts, { at, completed: true })
    : liveMastery(context, session.attempts);
  // A finished placement test also sends what it concluded on the skills it did not ask.
  const practised =
    session.kind === 'placement' && session.completedAt
      ? (Object.keys(mastery) as (keyof MasteryMap)[]).filter(
          (code) => mastery[code] !== session.masteryAtStart[code],
        )
      : [...new Set(session.attempts.map((attempt) => attempt.skill))];

  return {
    id: session.id,
    child_id: session.childId,
    kind: session.kind,
    local_date: session.localDate,
    started_at: session.startedAt,
    completed_at: session.completedAt,
    goal:
      session.goal.type === 'duration'
        ? { type: 'duration', value: session.goal.minutes }
        : { type: 'count', value: session.goal.count },
    attempts: session.attempts.map((attempt, position) =>
      toJson({
        position,
        skill_code: attempt.skill,
        generator_id: attempt.generatorId,
        difficulty: attempt.difficulty,
        seed: attempt.seed,
        slot: attempt.slot,
        twin_of: attempt.twinOf,
        reminder: attempt.reminder,
        answer: attempt.response,
        is_correct: attempt.correct,
        hint_used: attempt.hintUsed,
        time_ms: Math.round(attempt.timeMs),
        answered_at: attempt.answeredAt,
        learner_elo: attempt.learnerElo,
      }),
    ),
    mastery: practised.flatMap((skill) => {
      const record = mastery[skill];
      if (!record) return [];
      return [
        toJson({
          skill_code: skill,
          elo: record.elo,
          mastery: masteryOf(record, at),
          status: masteryStatus(record, at),
          attempts_count: record.attempts,
          sessions_streak: record.streak,
          mastered_at: record.masteredAt,
          last_practiced_at: record.practicedAt,
        }),
      ];
    }),
  };
}

export type SyncTransport = (payload: SyncPayload) => Promise<void>;

/**
 * Sends every pending session, oldest first. A failure that will never succeed (`isPermanent`)
 * drops the session; any other keeps it for the next attempt. `finished` lists the children whose
 * finished sessions just reached the server: their rewards can be computed.
 */
export async function sendPendingSessions(
  send: SyncTransport,
  isPermanent: (error: unknown) => boolean,
): Promise<{ sent: number; failed: number; finished: string[] }> {
  let sent = 0;
  let failed = 0;
  const finished = new Set<string>();
  for (const session of pendingSessions()) {
    const snapshot = { attempts: session.attempts.length, completed: session.completedAt !== null };
    try {
      await send(sessionPayload(session));
      markSynced(session.childId, session.id, snapshot);
      sent += 1;
      if (snapshot.completed && !session.synced.completed) finished.add(session.childId);
    } catch (error) {
      if (isPermanent(error)) dropSession(session.childId, session.id);
      else failed += 1;
    }
  }
  return { sent, failed, finished: [...finished] };
}

export type MasteryRow = Pick<
  Row<'child_skill_mastery'>,
  'skill_code' | 'elo' | 'attempts_count' | 'sessions_streak' | 'mastered_at' | 'last_practiced_at'
>;

export function masteryFromRows(rows: readonly MasteryRow[]): MasteryMap {
  const map: Partial<Record<keyof MasteryMap, MasteryRecord>> = {};
  for (const row of rows) {
    if (!isSkillCode(row.skill_code)) continue;
    map[row.skill_code] = {
      elo: row.elo,
      attempts: row.attempts_count,
      streak: row.sessions_streak,
      masteredAt: row.mastered_at,
      practicedAt: row.last_practiced_at,
    };
  }
  return map;
}

export type ItemRatingRow = Pick<Row<'item_ratings'>, 'generator_id' | 'difficulty' | 'rating'>;

export function itemRatingsFromRows(rows: readonly ItemRatingRow[]): ItemRatings {
  const ratings: Record<string, number> = {};
  for (const row of rows) {
    const difficulty = DIFFICULTIES.find((level) => level === row.difficulty);
    if (difficulty) ratings[itemKey(row.generator_id, difficulty)] = row.rating;
  }
  return ratings;
}
