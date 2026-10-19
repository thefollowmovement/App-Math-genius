import {
  DEFAULT_SESSION_GOAL,
  bossLength,
  finishSession,
  liveMastery,
  type ExerciseResponse,
  type Island,
  type ItemRatings,
  type MasteryMap,
  type MasteryRecord,
  type PlannerContext,
  type SessionAttempt,
  type SessionGoal,
} from '@math-genius/exercise-engine';
import type { Grade } from '@math-genius/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { localDate } from '@/utils/local-date';

/**
 * Everything a child needs to practise without network, kept on the device: mastery, the session
 * in progress (resumable after the app is closed) and the sessions waiting to be sent.
 */

/** A boss session evaluates one island of the world map. */
export type SessionKind = 'daily' | 'bonus' | 'boss';

export type StoredAttempt = SessionAttempt & { response: ExerciseResponse };

export type StoredSession = {
  id: string;
  childId: string;
  kind: SessionKind;
  /** The island a boss session evaluates. */
  boss?: Island;
  localDate: string;
  grade: Grade;
  goal: SessionGoal;
  startedAt: string;
  seed: number;
  /** Planner inputs frozen at the start, so the session replays identically when resumed. */
  masteryAtStart: MasteryMap;
  itemRatings: ItemRatings;
  attempts: StoredAttempt[];
  completedAt: string | null;
  /** What the server already holds. */
  synced: { attempts: number; completed: boolean };
};

export type ChildPractice = {
  mastery: MasteryMap;
  /** Session being played, or interrupted today. */
  active: StoredSession | null;
  /** Finished (or abandoned) sessions not yet fully sent. */
  outbox: StoredSession[];
  /** Day of the last finished daily session: later ones that day are bonus training. */
  lastDailyDate: string | null;
  /** Last finished session, for its summary (it may already have left the outbox). */
  lastCompleted: StoredSession | null;
};

type PracticeState = {
  children: Record<string, ChildPractice>;
  itemRatings: ItemRatings;
  /** Children who saw the intro on this device (« Choisis ton héros », then 3 screens). */
  introSeen: Record<string, true>;
};

const EMPTY_CHILD: ChildPractice = {
  mastery: {},
  active: null,
  outbox: [],
  lastDailyDate: null,
  lastCompleted: null,
};

export const usePracticeStore = create<PracticeState>()(
  persist(() => ({ children: {}, itemRatings: {}, introSeen: {} }), {
    name: 'math-genius.practice',
    version: 1,
    storage: createJSONStorage(() => AsyncStorage),
  }),
);

const subscribeHydration = (onChange: () => void) =>
  usePracticeStore.persist.onFinishHydration(onChange);

/** False until the device's saved practice is loaded: nothing may start a session before. */
export function usePracticeHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, () => usePracticeStore.persist.hasHydrated());
}

export function markIntroSeen(childId: string) {
  usePracticeStore.setState((state) => ({ introSeen: { ...state.introSeen, [childId]: true } }));
}

export const plannerContext = (session: StoredSession): PlannerContext => ({
  childGrade: session.grade,
  mastery: session.masteryAtStart,
  itemRatings: session.itemRatings,
  startedAt: session.startedAt,
  seed: session.seed,
  boss: session.boss,
});

export const childPractice = (childId: string): ChildPractice =>
  usePracticeStore.getState().children[childId] ?? EMPTY_CHILD;

function updateChild(childId: string, update: (child: ChildPractice) => ChildPractice) {
  usePracticeStore.setState((state) => ({
    children: { ...state.children, [childId]: update(state.children[childId] ?? EMPTY_CHILD) },
  }));
}

/** An unfinished session from an earlier day: its answers count, the session does not. */
function archive(child: ChildPractice, session: StoredSession): ChildPractice {
  if (session.attempts.length === 0) return { ...child, active: null };
  const mastery = finishSession(plannerContext(session), session.attempts, {
    at: session.attempts.at(-1)?.answeredAt ?? session.startedAt,
    completed: false,
  });
  return { ...child, mastery, active: null, outbox: [...child.outbox, session] };
}

/**
 * Today's session in progress, or a new one: daily first, then bonus training, or the boss of an
 * island (as many exercises as bossLength).
 */
export function openSession(input: {
  childId: string;
  grade: Grade;
  now: Date;
  id: string;
  seed: number;
  goal?: SessionGoal;
  boss?: Island;
}): StoredSession {
  const today = localDate(input.now);
  let opened: StoredSession | undefined;

  updateChild(input.childId, (current) => {
    const child =
      current.active && current.active.localDate !== today
        ? archive(current, current.active)
        : current;
    if (child.active) {
      opened = child.active;
      return child;
    }
    const { boss } = input;
    opened = {
      id: input.id,
      childId: input.childId,
      kind: boss ? 'boss' : child.lastDailyDate === today ? 'bonus' : 'daily',
      ...(boss ? { boss } : {}),
      localDate: today,
      grade: input.grade,
      goal: boss
        ? { type: 'count', count: bossLength(boss) }
        : (input.goal ?? DEFAULT_SESSION_GOAL),
      startedAt: input.now.toISOString(),
      seed: input.seed,
      masteryAtStart: child.mastery,
      itemRatings: usePracticeStore.getState().itemRatings,
      attempts: [],
      completedAt: null,
      synced: { attempts: 0, completed: false },
    };
    return { ...child, active: opened };
  });

  if (!opened) throw new Error('No session opened');
  return opened;
}

export function recordAnswer(childId: string, sessionId: string, attempt: StoredAttempt) {
  updateChild(childId, (child) =>
    child.active?.id === sessionId
      ? { ...child, active: { ...child.active, attempts: [...child.active.attempts, attempt] } }
      : child,
  );
}

/** Ends the active session: mastery takes its answers and it waits in the outbox. */
export function completeSession(childId: string, sessionId: string, at: string) {
  updateChild(childId, (child) => {
    const session = child.active;
    if (session?.id !== sessionId) return child;
    const completed = { ...session, completedAt: at };
    return {
      mastery: finishSession(plannerContext(session), session.attempts, { at, completed: true }),
      active: null,
      outbox: [...child.outbox, completed],
      lastDailyDate: session.kind === 'daily' ? session.localDate : child.lastDailyDate,
      lastCompleted: completed,
    };
  });
}

const fullySynced = (session: StoredSession) =>
  session.synced.attempts === session.attempts.length &&
  session.synced.completed === (session.completedAt !== null);

/** Records what the server accepted; finished sessions leave the outbox once fully sent. */
export function markSynced(childId: string, sessionId: string, synced: StoredSession['synced']) {
  const apply = (session: StoredSession) =>
    session.id === sessionId ? { ...session, synced } : session;
  updateChild(childId, (child) => ({
    ...child,
    active: child.active ? apply(child.active) : null,
    outbox: child.outbox.map(apply).filter((session) => !fullySynced(session)),
  }));
}

/** Forgets a session the server will never accept (device revoked, child deleted). */
export function dropSession(childId: string, sessionId: string) {
  updateChild(childId, (child) => ({
    ...child,
    active: child.active?.id === sessionId ? null : child.active,
    outbox: child.outbox.filter((session) => session.id !== sessionId),
  }));
}

/** Whether some of the child's answers are still only on the device. */
export function hasUnsentAnswers(child: ChildPractice | undefined): boolean {
  if (!child) return false;
  return child.outbox.length > 0 || (child.active !== null && !fullySynced(child.active));
}

/** Sessions with answers or an ending the server does not have yet. */
export function pendingSessions(): StoredSession[] {
  return Object.values(usePracticeStore.getState().children).flatMap((child) =>
    [...child.outbox, ...(child.active ? [child.active] : [])].filter(
      (session) => !fullySynced(session),
    ),
  );
}

const practiceTime = (record: MasteryRecord) =>
  record.practicedAt ? Date.parse(record.practicedAt) : -Infinity;

/** Keeps, for each skill, the most recently practised record (another device may have played). */
export function mergeMastery(childId: string, server: MasteryMap) {
  updateChild(childId, (child) => {
    const merged: Partial<Record<keyof MasteryMap, MasteryRecord>> = { ...child.mastery };
    for (const [code, record] of Object.entries(server) as [keyof MasteryMap, MasteryRecord][]) {
      const local = merged[code];
      if (!local || practiceTime(record) > practiceTime(local)) {
        merged[code] = record;
      }
    }
    return { ...child, mastery: merged };
  });
}

export function setItemRatings(itemRatings: ItemRatings) {
  usePracticeStore.setState({ itemRatings });
}

/** Mastery including the answers of the session in progress. */
export function currentMastery(child: ChildPractice): MasteryMap {
  return child.active
    ? liveMastery(plannerContext(child.active), child.active.attempts)
    : child.mastery;
}
