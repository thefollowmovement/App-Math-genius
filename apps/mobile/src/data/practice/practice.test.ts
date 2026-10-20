import {
  PLACEMENT_MAX_QUESTIONS,
  SKIPPED_ANSWER,
  bossLength,
  bossSkills,
  buildExercise,
  planNext,
  recordAttempt,
} from '@math-genius/exercise-engine';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { playSession } from '@/test-utils/play-session';
import { rightResponse } from '@/test-utils/responses';

import {
  childPractice,
  completeSession,
  markIntroSeen,
  mergeMastery,
  mergePlacedAt,
  openSession,
  recordAnswer,
  pendingSessions,
  plannerContext,
  usePracticeStore,
  type StoredSession,
} from './practice-store';
import { sendPendingSessions, sessionPayload, type SyncPayload } from './sync-engine';

const CHILD = 'child-1';
const evening = (day: number, minutes = 0) => new Date(2026, 9, day, 17, minutes);

let sessionCount = 0;
const open = (now: Date) =>
  openSession({ childId: CHILD, grade: 'CM1', now, id: `session-${++sessionCount}`, seed: 7 });

const play = (session: StoredSession, maxAnswers?: number) =>
  playSession(CHILD, session, maxAnswers);

const offline = () => Promise.reject(new TypeError('Network request failed'));
const never = () => false;

beforeEach(async () => {
  usePracticeStore.setState({ children: {}, itemRatings: {} });
  await AsyncStorage.clear();
});

describe('a boss session', () => {
  it("asks the island's skills, ends after bossLength exercises and is not the daily mission", () => {
    const island = { grade: 'CM1', domain: 'numbers' } as const;
    const session = openSession({
      childId: CHILD,
      grade: 'CM1',
      now: evening(15),
      id: 'boss-1',
      seed: 3,
      boss: island,
    });
    expect(session).toMatchObject({
      kind: 'boss',
      boss: island,
      goal: { type: 'count', count: bossLength(island) },
    });
    expect(plannerContext(session).boss).toEqual(island);
    play(session);

    const child = childPractice(CHILD);
    const [finished] = child.outbox;
    expect(finished?.attempts).toHaveLength(bossLength(island));
    const skills = new Set<string>(bossSkills(island));
    expect(finished?.attempts.every((attempt) => skills.has(attempt.skill))).toBe(true);
    expect(child.lastDailyDate).toBeNull();
    expect(finished && sessionPayload(finished).kind).toBe('boss');
  });
});

describe('a placement test', () => {
  /** Answers right on the grades below CM1, « Je ne sais pas » on the rest. */
  function playTest(session: StoredSession) {
    const context = plannerContext(session);
    for (let i = 0; ; i++) {
      const current = childPractice(CHILD).active;
      const planned = current && planNext(context, current.attempts);
      if (!current || !planned) break;
      const below = planned.skill.startsWith('ce2.');
      const answeredAt = new Date(Date.parse(session.startedAt) + (i + 1) * 25_000).toISOString();
      const attempt = recordAttempt(context, current.attempts, planned, {
        correct: below,
        hintUsed: false,
        timeMs: 12_000,
        answeredAt,
      });
      const response = below ? rightResponse(buildExercise(planned)) : SKIPPED_ANSWER;
      recordAnswer(CHILD, session.id, { ...attempt, response });
      if (!planNext(context, [...current.attempts, attempt])) {
        completeSession(CHILD, session.id, answeredAt);
      }
    }
  }
  const openTest = (now = evening(20)) =>
    openSession({ childId: CHILD, grade: 'CM1', now, id: 'test-1', seed: 5, placement: true });

  it('asks its own questions, places the child and is not the daily mission', () => {
    const session = openTest();
    expect(session).toMatchObject({
      kind: 'placement',
      goal: { type: 'count', count: PLACEMENT_MAX_QUESTIONS },
      placed: false,
    });
    expect(plannerContext(session).placement).toBe(true);
    playTest(session);

    const child = childPractice(CHILD);
    const [finished] = child.outbox;
    expect(finished?.attempts.length).toBeGreaterThanOrEqual(15);
    expect(child.placedAt).toBe(finished?.completedAt);
    expect(child.lastDailyDate).toBeNull();
    // A CE2 calculation skill it did not ask (the rung asks two of four) is acquired too.
    const asked = new Set<string>(finished?.attempts.map((attempt) => attempt.skill));
    const calculation = [
      'ce2.addition-posee',
      'ce2.doubles-moities',
      'ce2.tables-multiplication',
      'ce2.multiplication-posee',
    ] as const;
    const unasked = calculation.find((code) => !asked.has(code)) ?? 'ce2.addition-posee';
    expect(child.mastery[unasked]).toMatchObject({ attempts: 0 });
    expect(child.mastery[unasked]?.masteredAt).toBe(finished?.completedAt);
    // The next daily session trusts the test.
    expect(open(evening(21)).placed).toBe(true);
  });

  it('sends what it concluded on the skills it did not ask, and « Je ne sais pas »', () => {
    playTest(openTest());
    const [finished] = childPractice(CHILD).outbox;
    if (!finished) throw new Error('no test');
    const payload = sessionPayload(finished);
    expect(payload.kind).toBe('placement');
    const codes = payload.mastery.map((row) => JSON.stringify(row));
    const sent = (code: string) => codes.some((row) => row.includes(`"skill_code":"${code}"`));
    // Every skill it can practise, asked or not.
    expect(sent('ce2.comparer-ranger-nombres') && sent('cm1.perimetre')).toBe(true);
    expect(codes.length).toBeGreaterThan(finished.attempts.length / 3);
    expect(finished.attempts.every((attempt) => sent(attempt.skill))).toBe(true);
    expect(payload.attempts.some((row) => JSON.stringify(row).includes('"skipped"'))).toBe(true);
  });

  it('takes the place of a daily session not started yet, never of one under way', () => {
    const daily = open(evening(20));
    expect(openTest().kind).toBe('placement');
    expect(childPractice(CHILD).active?.id).toBe('test-1');
    play(open(evening(22)), 3);
    expect(openTest(evening(22)).kind).not.toBe('placement');
    expect(daily.kind).toBe('daily');
  });

  it('keeps the latest test, from this device or another one', () => {
    mergePlacedAt(CHILD, '2026-09-01T10:00:00.000Z');
    mergePlacedAt(CHILD, '2026-08-01T10:00:00.000Z');
    expect(childPractice(CHILD).placedAt).toBe('2026-09-01T10:00:00.000Z');
  });
});

describe('a session without network', () => {
  it('plays 15 minutes offline, keeps everything, and syncs once online', async () => {
    const session = open(evening(15));
    play(session);

    const child = childPractice(CHILD);
    expect(child.active).toBeNull();
    expect(child.lastDailyDate).toBe('2026-10-15');
    expect(child.outbox).toHaveLength(1);
    const [finished] = child.outbox;
    expect(finished?.attempts.length).toBeGreaterThanOrEqual(45);
    expect(finished?.completedAt).not.toBeNull();
    expect(Object.keys(child.mastery).length).toBeGreaterThan(2);

    // No network: nothing is lost.
    await expect(sendPendingSessions(offline, never)).resolves.toEqual({
      sent: 0,
      failed: 1,
      finished: [],
    });
    expect(pendingSessions()).toHaveLength(1);

    // Back online: the whole session goes in one call, then leaves the outbox.
    const received: SyncPayload[] = [];
    await expect(
      sendPendingSessions(async (payload) => void received.push(payload), never),
    ).resolves.toMatchObject({ sent: 1, finished: [CHILD] });
    expect(pendingSessions()).toHaveLength(0);
    expect(childPractice(CHILD).outbox).toHaveLength(0);

    const [payload] = received;
    expect(payload).toMatchObject({
      id: session.id,
      child_id: CHILD,
      kind: 'daily',
      local_date: '2026-10-15',
      goal: { type: 'duration', value: 15 },
    });
    expect(payload?.completed_at).toBe(finished?.completedAt);
    expect(payload?.attempts).toHaveLength(finished?.attempts.length ?? 0);
    expect(payload?.attempts[0]).toMatchObject({ position: 0, time_ms: 9000 });
    expect(payload?.mastery.length).toBeGreaterThan(2);
  });

  it('keeps the answers on the device across restarts', async () => {
    const session = open(evening(15));
    play(session, 5);
    // zustand writes asynchronously to AsyncStorage.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const saved = await AsyncStorage.getItem('math-genius.practice');
    expect(saved).toContain(session.id);

    usePracticeStore.setState({ children: {}, itemRatings: {} });
    await AsyncStorage.setItem('math-genius.practice', saved ?? '');
    await usePracticeStore.persist.rehydrate();
    expect(childPractice(CHILD).active?.attempts).toHaveLength(5);
  });

  it('remembers who met the mascot, and starts empty on a device saved before', async () => {
    usePracticeStore.setState({ introSeen: {} });
    markIntroSeen(CHILD);
    expect(usePracticeStore.getState().introSeen).toEqual({ [CHILD]: true });

    // A device saved before the mascot existed shows its intro once.
    await AsyncStorage.setItem(
      'math-genius.practice',
      JSON.stringify({ state: { children: {}, itemRatings: {} }, version: 1 }),
    );
    usePracticeStore.setState({ introSeen: {} });
    await usePracticeStore.persist.rehydrate();
    expect(usePracticeStore.getState().introSeen).toEqual({});
  });

  it('resumes the same session later that day, exactly where it stopped', () => {
    const session = open(evening(15));
    play(session, 6);
    const resumed = open(evening(15, 40));
    expect(resumed.id).toBe(session.id);
    expect(resumed.attempts).toHaveLength(6);
    const context = plannerContext(resumed);
    expect(planNext(context, resumed.attempts)).toEqual(planNext(context, resumed.attempts));
  });

  it('sends a session in progress, then only the new answers count', async () => {
    const session = open(evening(15));
    play(session, 4);
    const received: SyncPayload[] = [];
    const send = async (payload: SyncPayload) => void received.push(payload);

    await sendPendingSessions(send, never);
    expect(childPractice(CHILD).active?.synced).toEqual({ attempts: 4, completed: false });
    await sendPendingSessions(send, never);
    expect(received).toHaveLength(1);

    play(session, 2);
    await sendPendingSessions(send, never);
    expect(received.map((payload) => payload.attempts.length)).toEqual([4, 6]);
    expect(received[1]?.completed_at).toBeNull();
  });

  it('closes yesterday’s unfinished session and starts a new daily one', () => {
    const yesterday = open(evening(14));
    play(yesterday, 3);
    const today = open(evening(15));
    expect(today.id).not.toBe(yesterday.id);
    expect(today.kind).toBe('daily');
    const [abandoned] = childPractice(CHILD).outbox;
    expect(abandoned?.id).toBe(yesterday.id);
    expect(abandoned?.completedAt).toBeNull();
    expect(sessionPayload(abandoned as StoredSession).completed_at).toBeNull();
    expect(today.masteryAtStart).toEqual(childPractice(CHILD).mastery);
  });

  it('turns a second session the same day into bonus training', () => {
    play(open(evening(15)));
    expect(open(evening(15, 30)).kind).toBe('bonus');
    expect(open(evening(16)).kind).toBe('daily');
  });

  it('drops a session the server will never accept', async () => {
    play(open(evening(15)));
    const result = await sendPendingSessions(
      () => Promise.reject(new Error('child_not_found')),
      () => true,
    );
    expect(result).toEqual({ sent: 0, failed: 0, finished: [] });
    expect(pendingSessions()).toHaveLength(0);
  });

  it('keeps the most recent mastery when another device played', () => {
    play(open(evening(15)));
    const local = childPractice(CHILD).mastery;
    const [skill] = Object.keys(local) as (keyof typeof local)[];
    if (!skill) throw new Error('No mastery recorded');
    const record = local[skill];
    if (!record) throw new Error('No mastery recorded');

    mergeMastery(CHILD, { [skill]: { ...record, elo: 100, practicedAt: '2026-10-01T17:00:00Z' } });
    expect(childPractice(CHILD).mastery[skill]?.elo).toBe(record.elo);

    mergeMastery(CHILD, { [skill]: { ...record, elo: 1700, practicedAt: '2026-10-20T17:00:00Z' } });
    expect(childPractice(CHILD).mastery[skill]?.elo).toBe(1700);
  });
});
