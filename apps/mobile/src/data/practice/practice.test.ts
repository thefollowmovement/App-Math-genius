import { bossLength, bossSkills, planNext } from '@math-genius/exercise-engine';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { playSession } from '@/test-utils/play-session';

import {
  childPractice,
  mergeMastery,
  openSession,
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
