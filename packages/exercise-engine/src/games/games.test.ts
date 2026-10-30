import { getSkill } from '@math-genius/curriculum';

import { type PlannerContext } from '../adaptive/planner';
import { DIFFICULTIES } from '../exercise';
import { generateExercise, generatorId } from '../generator';
import { generators } from '../generators';
import { gradeResponse } from '../grade';
import { createRng } from '../random';
import { add, equals, mul, rational } from '../rational';
import { planGameQuestion } from './plan';
import {
  GAME_CARD_MAX,
  GAME_LABEL_MAX,
  GAME_PROMPT_MAX,
  choiceQuestion,
  pairQuestion,
  sumQuestion,
  sumResponse,
} from './questions';

const SEEDS = 80;

describe('questions for the mini-games, on every generator', () => {
  const stats = { choices: 0, duel: 0, sum: 0, pair: 0 };

  it.each(generators.map((generator) => [generatorId(generator), generator] as const))(
    '%s: one right choice, graded by the engine; parts that make the target',
    (_id, generator) => {
      for (const difficulty of DIFFICULTIES) {
        for (let seed = 1; seed <= SEEDS; seed++) {
          const exercise = generateExercise(generator, difficulty, seed);
          for (const count of [2, 3, 4]) {
            const question = choiceQuestion(exercise, count, createRng(seed));
            if (!question) continue;
            stats[count === 2 ? 'duel' : 'choices'] += 1;
            expect(question.prompt.length).toBeLessThanOrEqual(GAME_PROMPT_MAX);
            expect(question.choices).toHaveLength(count);
            const labels = question.choices.map((choice) => choice.label);
            expect(new Set(labels).size).toBe(count);
            for (const choice of question.choices) {
              expect(choice.label.length).toBeLessThanOrEqual(GAME_LABEL_MAX);
              expect(gradeResponse(exercise, choice.response).correct).toBe(choice.correct);
            }
            expect(question.choices.filter((choice) => choice.correct)).toHaveLength(1);
          }

          const sum = sumQuestion(exercise, 6, createRng(seed));
          if (sum) {
            stats.sum += 1;
            expect(sum.numbers).toHaveLength(6);
            const values = sum.numbers.map((number) => number.value);
            const make = (a: (typeof values)[number], b: (typeof values)[number]) =>
              sum.operator === '+' ? add(a, b) : mul(a, b);
            // Labels are distinct, except the two equal parts of a double (« 7 + 7 »).
            const labels = sum.numbers.map((number) => number.label);
            const repeated = sum.numbers.filter(
              (number, index) => labels.indexOf(number.label) !== index,
            );
            expect(repeated.length).toBeLessThanOrEqual(1);
            for (const number of repeated) {
              expect(
                exercise.type === 'numeric' &&
                  equals(make(number.value, number.value), exercise.answer),
              ).toBe(true);
            }
            // Some two bubbles make the target, and popping them is graded right.
            const pairs = values.flatMap((a, i) => values.slice(i + 1).map((b) => [a, b] as const));
            const right = pairs.find(([a, b]) =>
              exercise.type === 'numeric' ? equals(make(a, b), exercise.answer) : false,
            );
            expect(right).toBeDefined();
            if (right) {
              expect(gradeResponse(exercise, sumResponse(sum, right)).correct).toBe(true);
            }
            expect(gradeResponse(exercise, sumResponse(sum, [rational(0)])).correct).toBe(
              exercise.type === 'numeric' && equals(exercise.answer, rational(0)),
            );
          }

          const pair = pairQuestion(exercise);
          if (pair) {
            stats.pair += 1;
            expect(pair.left.length).toBeLessThanOrEqual(GAME_CARD_MAX);
            expect(pair.right.length).toBeLessThanOrEqual(GAME_CARD_MAX);
            expect(pair.left).not.toContain('?');
            expect(pair.right).not.toContain('?');
            expect(gradeResponse(exercise, pair.response).correct).toBe(true);
          }
        }
      }
    },
  );

  it('finds plenty of each kind across the engine', () => {
    expect(stats.choices).toBeGreaterThan(2000);
    expect(stats.duel).toBeGreaterThan(1000);
    expect(stats.sum).toBeGreaterThan(500);
    expect(stats.pair).toBeGreaterThan(500);
  });
});

describe('the examples behind the rules', () => {
  const tables = generators.find((generator) => generator.skill === 'ce2.tables-multiplication');
  const addition = generators.find((generator) => generator.skill === 'ce2.addition-posee');
  if (!tables || !addition) throw new Error('missing generators');

  it('offers the typical mistakes first among the wrong answers', () => {
    const exercise = generateExercise(addition, 2, 7);
    const question = choiceQuestion(exercise, 3, createRng(1));
    if (exercise.type !== 'numeric' || !question) throw new Error('no question');
    const forgotCarry = exercise.mistakes?.['forgot-carry']?.[0];
    if (forgotCarry && !equals(forgotCarry, exercise.answer)) {
      expect(question.choices.map((choice) => choice.label)).toContain(String(forgotCarry.num));
    }
  });

  it('turns « a × b = ? » into two memory cards and a target to make', () => {
    const exercise = generateExercise(tables, 3, 5);
    const pair = pairQuestion(exercise);
    expect(pair?.left).toMatch(/^\d+ × \d+$/);
    expect(pair?.right).toMatch(/^\d+$/);
    const sum = sumQuestion(exercise, 4, createRng(2));
    expect(sum?.operator).toBe('×');
  });
});

describe('the next question of a game', () => {
  const START = '2026-10-21T17:00:00.000Z';
  const context = (grade: PlannerContext['childGrade'], seed = 7): PlannerContext => ({
    childGrade: grade,
    mastery: {},
    itemRatings: {},
    startedAt: START,
    seed,
  });

  it.each(['CE2', 'CM1', 'CM2', '6e', '5e'] as const)(
    'always has one for a new %s child, from skills at or below the grade',
    (grade) => {
      for (const request of [
        { kind: 'choices', count: 3 },
        { kind: 'choices', count: 2 },
        { kind: 'sum', count: 6 },
        { kind: 'pair' },
      ] as const) {
        for (let index = 0; index < 12; index++) {
          const next = planGameQuestion(context(grade), index, request);
          expect(next).not.toBeNull();
          expect(next?.question.kind).toBe(request.kind);
          const skillGrade = next ? getSkill(next.planned.skill).grade : grade;
          expect(['CE2', 'CM1', 'CM2', '6e', '5e'].indexOf(skillGrade)).toBeLessThanOrEqual(
            ['CE2', 'CM1', 'CM2', '6e', '5e'].indexOf(grade),
          );
        }
      }
    },
  );

  it('is a pure function of the context and the index', () => {
    const first = planGameQuestion(context('CM1'), 3, { kind: 'choices', count: 3 });
    const again = planGameQuestion(context('CM1'), 3, { kind: 'choices', count: 3 });
    expect(again?.planned).toEqual(first?.planned);
    expect(
      again?.question.kind === 'choices' && again.question.choices.map((c) => c.label),
    ).toEqual(first?.question.kind === 'choices' && first.question.choices.map((c) => c.label));
  });

  it('asks quick recall first, and harder questions of a stronger child', () => {
    const first = planGameQuestion(context('CM1'), 0, { kind: 'choices', count: 3 });
    expect(first?.planned.slot).toBe('automatism');
    const strong: PlannerContext = {
      ...context('CM1'),
      mastery: {
        'ce2.tables-multiplication': {
          elo: 1500,
          attempts: 60,
          practicedAt: START,
          masteredAt: START,
          streak: 2,
        },
      },
    };
    const weak: PlannerContext = {
      ...context('CM1'),
      mastery: {
        'ce2.tables-multiplication': {
          elo: 500,
          attempts: 60,
          practicedAt: START,
          masteredAt: null,
          streak: 0,
        },
      },
    };
    const level = (ctx: PlannerContext) => {
      const levels: number[] = [];
      for (let index = 0; index < 40; index++) {
        const next = planGameQuestion(ctx, index, { kind: 'choices', count: 3 });
        if (next?.planned.skill === 'ce2.tables-multiplication')
          levels.push(next.planned.difficulty);
      }
      return levels.reduce((total, value) => total + value, 0) / Math.max(1, levels.length);
    };
    expect(level(strong)).toBeGreaterThan(level(weak));
  });
});
