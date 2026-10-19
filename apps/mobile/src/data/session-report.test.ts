import { formatAnswer, rational } from '@math-genius/exercise-engine';
import type { DayPlan } from '@math-genius/shared';

import { exerciseOfType } from '@/test-utils/exercises';
import { attemptRow, sessionRow } from '@/test-utils/family';
import { rightResponse, wrongResponse } from '@/test-utils/responses';

import { attemptViews, childDay, familyDay, parseResponse, sessionState } from './session-report';

const PLANNED: DayPlan = { kind: 'planned', start: 17 * 60, deadline: 20 * 60 + 30 };
const AT = (hours: number, minutes = 0) => hours * 60 + minutes;

describe('a child’s day', () => {
  it('is not started without sessions, with its start time while it is to come', () => {
    expect(childDay([])).toEqual({ status: 'not_started', main: null, startsAt: null });
    expect(childDay([], PLANNED, AT(16, 30)).startsAt).toBe(AT(17));
    expect(childDay([], PLANNED, AT(17, 10))).toMatchObject({
      status: 'not_started',
      startsAt: null,
    });
  });

  it('is in progress while a session is open, and sums up with the daily session', () => {
    const daily = sessionRow({ completed_at: null, answered: 10, score: 8 });
    expect(childDay([daily])).toEqual({ status: 'in_progress', main: daily, startsAt: null });
  });

  it('is done once a session ends, even if bonus training follows', () => {
    const daily = sessionRow();
    const bonus = sessionRow({ id: 'bonus', kind: 'bonus', started_at: '2026-10-16T16:00:00Z' });
    expect(childDay([daily, bonus])).toMatchObject({ status: 'done', main: daily });
    const playing = { ...bonus, completed_at: null };
    expect(childDay([daily, playing]).status).toBe('done');
  });

  it('is missed past the deadline without a finished session, done if one ends late', () => {
    const playing = sessionRow({ completed_at: null });
    expect(childDay([], PLANNED, AT(20, 29)).status).toBe('not_started');
    expect(childDay([], PLANNED, AT(20, 30)).status).toBe('missed');
    expect(childDay([playing], PLANNED, AT(21)).status).toBe('missed');
    expect(childDay([sessionRow()], PLANNED, AT(21)).status).toBe('done');
  });

  it('is off on a day off or during holidays, unless the child plays anyway', () => {
    expect(childDay([], { kind: 'off' }, AT(21)).status).toBe('off');
    expect(childDay([], { kind: 'vacation' }, AT(21)).status).toBe('vacation');
    expect(childDay([sessionRow({ completed_at: null })], { kind: 'vacation' }).status).toBe(
      'in_progress',
    );
    expect(childDay([], { kind: 'no_routine' }, AT(23)).status).toBe('not_started');
  });

  it('splits the family’s sessions and plans by child', () => {
    const day = familyDay(
      ['lea', 'tom', 'zoe'],
      [sessionRow({ child_id: 'tom' })],
      (id) => (id === 'zoe' ? PLANNED : { kind: 'no_routine' }),
      AT(21),
    );
    expect(day.lea?.status).toBe('not_started');
    expect(day.tom?.status).toBe('done');
    expect(day.zoe?.status).toBe('missed');
  });

  it('labels each session', () => {
    expect(sessionState(sessionRow({ completed_at: null }))).toBe('in_progress');
    expect(sessionState(sessionRow({ goal_met: true }))).toBe('validated');
    expect(sessionState(sessionRow({ goal_met: false }))).toBe('not_validated');
  });
});

describe('answers read back from the server', () => {
  it('accepts every response shape the app stores', () => {
    expect(parseResponse({ type: 'numeric', text: '3,5' })).toEqual({
      type: 'numeric',
      text: '3,5',
    });
    expect(parseResponse({ type: 'choice', index: 2 })).toEqual({ type: 'choice', index: 2 });
    expect(parseResponse({ type: 'true-false', value: false })).toEqual({
      type: 'true-false',
      value: false,
    });
    expect(parseResponse({ type: 'number-line', value: { num: 6, den: 8 } })).toEqual({
      type: 'number-line',
      value: rational(3, 4),
    });
    expect(parseResponse({ type: 'order', order: [2, 0, 1] })).toEqual({
      type: 'order',
      order: [2, 0, 1],
    });
    expect(parseResponse({ type: 'match', pairs: [1, 0] })).toEqual({
      type: 'match',
      pairs: [1, 0],
    });
    expect(parseResponse({ type: 'fraction-shade', shaded: 3 })).toEqual({
      type: 'fraction-shade',
      shaded: 3,
    });
  });

  it('rejects anything else', () => {
    for (const value of [
      null,
      3,
      'text',
      [],
      { type: 'numeric' },
      { type: 'order', order: ['a'] },
    ]) {
      expect(parseResponse(value)).toBeNull();
    }
    expect(parseResponse({ type: 'number-line', value: { num: 1, den: 0 } })).toBeNull();
  });
});

describe('attempt views', () => {
  it('rebuilds the question and shows the right answer after a mistake only', () => {
    const exercise = exerciseOfType('numeric');
    const [wrong, right] = attemptViews([
      attemptRow(exercise, wrongResponse(exercise)),
      attemptRow(exercise, rightResponse(exercise), { position: 1, is_correct: true }),
    ]);
    expect(wrong?.prompt).toBe(exercise.prompt);
    expect(wrong?.answer).not.toBeNull();
    expect(wrong?.rightAnswer).toContain(formatAnswer(exercise));
    expect(wrong?.seconds).toBe(8);
    expect(right?.answer).toContain(formatAnswer(exercise));
    expect(right?.rightAnswer).toBeNull();
  });

  it('reads answers of every exercise type', () => {
    for (const type of [
      'choice',
      'true-false',
      'number-line',
      'order',
      'match',
      'fraction-shade',
    ] as const) {
      const exercise = exerciseOfType(type);
      const [view] = attemptViews([
        attemptRow(exercise, rightResponse(exercise), { is_correct: true }),
      ]);
      expect(view?.answer).toBeTruthy();
    }
  });

  it('copes with exercises this version of the app no longer knows', () => {
    const exercise = exerciseOfType('numeric');
    const [view] = attemptViews([
      attemptRow(exercise, rightResponse(exercise), {
        generator_id: 'retired.generator',
        skill_code: 'retired.skill',
      }),
    ]);
    expect(view).toMatchObject({ prompt: null, answer: null, skill: 'retired.skill' });
  });
});
