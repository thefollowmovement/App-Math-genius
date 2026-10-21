import {
  DEFAULT_SESSION_GOAL,
  MIN_ANSWER_MS,
  NO_GAME_CREDIT,
  PLACEMENT_MAX_QUESTIONS,
  activeMs,
  bossLength,
  finishSession,
  liveMastery,
  type ExerciseResponse,
  type GameCredit,
  type Island,
  type ItemRatings,
  type MasteryMap,
  type MasteryRecord,
  type PlannerContext,
  type SessionAttempt,
  type SessionGoal,
  type SkippedAnswer,
} from '@math-genius/exercise-engine';
import { GAME_ROUND_MAX_SECONDS, type Grade, type MiniGameId } from '@math-genius/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { localDate } from '@/utils/local-date';

/**
 * Everything a child needs to practise without network, kept on the device: mastery, the session
 * in progress (resumable after the app is closed) and the sessions waiting to be sent.
 */

/**
 * A boss session evaluates one island of the world map; a placement test places the child; a game
 * is a round of a mini-game (its answers count like a session's, the round is no session).
 */
export type SessionKind = 'daily' | 'bonus' | 'boss' | 'placement' | 'game';

/** What a round of a mini-game ended with: its score and stars (the device's, a personal best). */
export type RoundResult = { id: MiniGameId; score: number; stars: number };

/** The answer given, or « Je ne sais pas » in the placement test. */
export type StoredAttempt = SessionAttempt & { response: ExerciseResponse | SkippedAnswer };

export type StoredSession = {
  id: string;
  childId: string;
  kind: SessionKind;
  /** The island a boss session evaluates. */
  boss?: Island;
  /** A round's game, and its score so far (its stars once over). */
  game?: RoundResult;
  localDate: string;
  grade: Grade;
  goal: SessionGoal;
  startedAt: string;
  seed: number;
  /** Planner inputs frozen at the start, so the session replays identically when resumed. */
  masteryAtStart: MasteryMap;
  /** The child had taken the placement test when the session started (PlannerContext.placed). */
  placed?: boolean;
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
  /** End of the last placement test, on this device or another (from the server). */
  placedAt?: string | null;
  /** The mini-game round being played (kept, like a session, until it ends). */
  round?: StoredSession | null;
  /** The best of each game on this device, and today's rounds. */
  games?: ChildGames;
};

/** Today's rounds: their playing time (the parent's limit) and their share of the daily session. */
export type GameDay = { date: string; playedS: number } & GameCredit;

export type ChildGames = {
  records: Partial<Record<MiniGameId, { score: number; stars: number }>>;
  day: GameDay | null;
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
  placedAt: null,
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
  placement: session.kind === 'placement',
  placed: session.placed === true,
});

export const childPractice = (childId: string): ChildPractice =>
  usePracticeStore.getState().children[childId] ?? EMPTY_CHILD;

function updateChild(childId: string, update: (child: ChildPractice) => ChildPractice) {
  usePracticeStore.setState((state) => ({
    children: { ...state.children, [childId]: update(state.children[childId] ?? EMPTY_CHILD) },
  }));
}

/**
 * The child's mastery with what a session changed: the skills it touched, nothing else. A mini-game
 * round played meanwhile keeps what it changed on the other skills.
 */
function withChanges(child: ChildPractice, session: StoredSession, after: MasteryMap): MasteryMap {
  const merged: Partial<Record<keyof MasteryMap, MasteryRecord>> = { ...child.mastery };
  for (const [code, record] of Object.entries(after) as [keyof MasteryMap, MasteryRecord][]) {
    if (record !== session.masteryAtStart[code]) merged[code] = record;
  }
  return merged;
}

/** An unfinished session from an earlier day: its answers count, the session does not. */
function archive(child: ChildPractice, session: StoredSession): ChildPractice {
  if (session.attempts.length === 0) return { ...child, active: null };
  const mastery = finishSession(plannerContext(session), session.attempts, {
    at: session.attempts.at(-1)?.answeredAt ?? session.startedAt,
    completed: false,
  });
  return {
    ...child,
    mastery: withChanges(child, session, mastery),
    active: null,
    outbox: [...child.outbox, session],
  };
}

/** The goal of a new session: a boss or a test asks a number of exercises. */
function goalOf(input: { goal?: SessionGoal; boss?: Island; placement?: boolean }): SessionGoal {
  if (input.boss) return { type: 'count', count: bossLength(input.boss) };
  if (input.placement) return { type: 'count', count: PLACEMENT_MAX_QUESTIONS };
  return input.goal ?? DEFAULT_SESSION_GOAL;
}

/**
 * Today's session in progress, or a new one: daily first, then bonus training, the boss of an
 * island (as many exercises as bossLength), or the placement test.
 */
export function openSession(input: {
  childId: string;
  grade: Grade;
  now: Date;
  id: string;
  seed: number;
  goal?: SessionGoal;
  boss?: Island;
  placement?: boolean;
}): StoredSession {
  const today = localDate(input.now);
  let opened: StoredSession | undefined;

  // A boss or a test asked for explicitly takes the place of a session not started yet.
  const wanted: SessionKind | null = input.boss ? 'boss' : input.placement ? 'placement' : null;
  updateChild(input.childId, (current) => {
    const stale = current.active && current.active.localDate !== today;
    const idle =
      wanted !== null && current.active?.kind !== wanted && current.active?.attempts.length === 0;
    const child =
      current.active && stale
        ? archive(current, current.active)
        : idle
          ? { ...current, active: null }
          : current;
    if (child.active) {
      opened = child.active;
      return child;
    }
    const { boss } = input;
    const kind: SessionKind = boss
      ? 'boss'
      : input.placement
        ? 'placement'
        : child.lastDailyDate === today
          ? 'bonus'
          : 'daily';
    opened = {
      id: input.id,
      childId: input.childId,
      kind,
      ...(boss ? { boss } : {}),
      localDate: today,
      grade: input.grade,
      goal: goalOf(input),
      startedAt: input.now.toISOString(),
      seed: input.seed,
      masteryAtStart: child.mastery,
      placed: Boolean(child.placedAt),
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

/**
 * Ends the active session: mastery takes its answers and it waits in the outbox. A placement test
 * leaves its conclusions on every skill (placementMastery) and places the child.
 */
export function completeSession(childId: string, sessionId: string, at: string) {
  updateChild(childId, (child) => {
    const session = child.active;
    if (session?.id !== sessionId) return child;
    const completed = { ...session, completedAt: at };
    const after = finishSession(plannerContext(session), session.attempts, { at, completed: true });
    return {
      ...child,
      mastery: withChanges(child, session, after),
      active: null,
      outbox: [...child.outbox, completed],
      lastDailyDate: session.kind === 'daily' ? session.localDate : child.lastDailyDate,
      lastCompleted: completed,
      placedAt: session.kind === 'placement' ? at : (child.placedAt ?? null),
    };
  });
}

/** Keeps the latest placement test, from this device or another one. */
export function mergePlacedAt(childId: string, placedAt: string | null) {
  if (!placedAt) return;
  updateChild(childId, (child) =>
    child.placedAt && Date.parse(child.placedAt) >= Date.parse(placedAt)
      ? child
      : { ...child, placedAt },
  );
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
  return (
    child.outbox.length > 0 ||
    (child.active !== null && !fullySynced(child.active)) ||
    Boolean(child.round?.attempts.length)
  );
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

// Mini-game rounds -------------------------------------------------------------------------------

/** Playing time a round counts for the parent's limit: from its start to its end, 4 minutes at most. */
export const roundSeconds = (round: Pick<StoredSession, 'startedAt' | 'completedAt'>) =>
  round.completedAt
    ? Math.min(
        GAME_ROUND_MAX_SECONDS,
        Math.max(
          0,
          Math.round((Date.parse(round.completedAt) - Date.parse(round.startedAt)) / 1000),
        ),
      )
    : 0;

/** Today's rounds on this device; nothing from an earlier day. */
export function gameDayOf(child: ChildPractice | undefined, today: string): GameDay {
  const day = child?.games?.day;
  return day && day.date === today ? day : { date: today, playedS: 0, ...NO_GAME_CREDIT };
}

/** What the day's rounds bring to its daily session (sessionProgress caps it at 30 % of the goal). */
export function creditOfDay(
  day: GameDay | null | undefined,
  session: Pick<StoredSession, 'kind' | 'localDate'>,
): GameCredit {
  if (session.kind !== 'daily' || !day || day.date !== session.localDate) return NO_GAME_CREDIT;
  return { activeMs: day.activeMs, answers: day.answers };
}

export const gameCreditOf = (
  child: ChildPractice | undefined,
  session: Pick<StoredSession, 'kind' | 'localDate'>,
): GameCredit => creditOfDay(child?.games?.day, session);

/** A round from before (the app closed mid-round): it ends with what it had, without stars. */
function closeRound(child: ChildPractice, round: StoredSession): ChildPractice {
  const at = round.attempts.at(-1)?.answeredAt ?? round.startedAt;
  return endRound(child, round, at, {
    ...(round.game ?? { id: 'peche-eclair', score: 0 }),
    stars: 0,
  });
}

function endRound(
  child: ChildPractice,
  round: StoredSession,
  at: string,
  result: RoundResult,
): ChildPractice {
  const completed: StoredSession = { ...round, completedAt: at, game: result };
  const mastery = liveMastery(plannerContext(round), round.attempts);
  const games = child.games ?? { records: {}, day: null };
  const day = gameDayOf(child, round.localDate);
  const best = games.records[result.id];
  return {
    ...child,
    mastery: withChanges(child, round, mastery),
    round: null,
    outbox: round.attempts.length > 0 ? [...child.outbox, completed] : child.outbox,
    games: {
      records: {
        ...games.records,
        [result.id]: {
          score: Math.max(best?.score ?? 0, result.score),
          stars: Math.max(best?.stars ?? 0, result.stars),
        },
      },
      day: {
        date: round.localDate,
        playedS: day.playedS + roundSeconds(completed),
        activeMs: day.activeMs + activeMs(round.startedAt, round.attempts),
        answers:
          day.answers + round.attempts.filter((attempt) => attempt.timeMs >= MIN_ANSWER_MS).length,
      },
    },
  };
}

/**
 * A new round of a game. Its questions are planned from the child's mastery now (the session in
 * progress included), like a session's: masteryAtStart, seed and item ratings are frozen.
 */
export function openRound(input: {
  childId: string;
  grade: Grade;
  game: MiniGameId;
  minutes: number;
  now: Date;
  id: string;
  seed: number;
}): StoredSession {
  let opened: StoredSession | undefined;
  updateChild(input.childId, (current) => {
    const child = current.round ? closeRound(current, current.round) : current;
    opened = {
      id: input.id,
      childId: input.childId,
      kind: 'game',
      game: { id: input.game, score: 0, stars: 0 },
      localDate: localDate(input.now),
      grade: input.grade,
      goal: { type: 'duration', minutes: input.minutes },
      startedAt: input.now.toISOString(),
      seed: input.seed,
      masteryAtStart: currentMastery(child),
      placed: Boolean(child.placedAt),
      itemRatings: usePracticeStore.getState().itemRatings,
      attempts: [],
      completedAt: null,
      synced: { attempts: 0, completed: false },
    };
    return { ...child, round: opened };
  });
  if (!opened) throw new Error('No round opened');
  return opened;
}

/** Each answer is kept as soon as it is given, with the score so far. */
export function recordRoundAnswer(
  childId: string,
  roundId: string,
  attempt: StoredAttempt,
  score: number,
) {
  updateChild(childId, (child) =>
    child.round?.id === roundId && child.round.game
      ? {
          ...child,
          round: {
            ...child.round,
            attempts: [...child.round.attempts, attempt],
            game: { ...child.round.game, score },
          },
        }
      : child,
  );
}

/** The round is over: mastery takes its answers, it waits in the outbox, records and today grow. */
export function finishRound(childId: string, roundId: string, at: string, result: RoundResult) {
  updateChild(childId, (child) =>
    child.round?.id === roundId ? endRound(child, child.round, at, result) : child,
  );
}

/** A round left open by an app closed mid-game ends now. */
export function closeStaleRound(childId: string) {
  updateChild(childId, (child) => (child.round ? closeRound(child, child.round) : child));
}
