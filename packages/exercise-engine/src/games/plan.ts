import { getSkill, type SkillCode } from '@math-genius/curriculum';

import {
  type PlannedExercise,
  type PlannerContext,
  buildExercise,
  skillPool,
} from '../adaptive/planner';
import { decayedElo, startingRecord } from '../adaptive/mastery';
import { clampDifficulty, difficultyFor, itemRating } from '../adaptive/ratings';
import type { Slot } from '../adaptive/session';
import { DIFFICULTIES } from '../exercise';
import { type Generator, generateExercise, generatorId } from '../generator';
import { generators as allGenerators } from '../generators';
import { type Rng, createRng, deriveSeed } from '../random';
import { type GameQuestion, choiceQuestion, pairQuestion, sumQuestion } from './questions';

/**
 * The next question of a mini-game, adapted to the child: the skills a session would draw from
 * (skillPool: quick recall, review, the skills being learnt), at the child's own difficulty, one
 * notch easier because the reflex adds its own. Only exercises that fit the game's question (short
 * enough, with the shape it needs) are kept. A pure function of the context and the question's
 * index, as planNext: the answers are recorded like a session's and update mastery the same way.
 */

/** Quick recall first: the arcade rewards what is known by heart. */
export const GAME_PATTERN: readonly Slot[] = [
  'automatism',
  'review',
  'automatism',
  'current',
  'review',
];

export type GameQuestionRequest =
  { kind: 'choices'; count: number } | { kind: 'sum'; count: number } | { kind: 'pair' };

export type PlannedGameQuestion = { planned: PlannedExercise; question: GameQuestion };

/** Seeds tried on one generator before moving on to another skill. */
const SEEDS_PER_SKILL = 4;

function questionOf(
  exercise: Parameters<typeof choiceQuestion>[0],
  request: GameQuestionRequest,
  rng: Rng,
): GameQuestion | null {
  switch (request.kind) {
    case 'choices':
      return choiceQuestion(exercise, request.count, rng);
    case 'sum':
      return sumQuestion(exercise, request.count, rng);
    case 'pair':
      return pairQuestion(exercise);
  }
}

// Whether a generator ever gives a question of a kind (memoised: generators never change).
const fitting = new Map<string, boolean>();

function fits(generator: Generator, request: GameQuestionRequest): boolean {
  const key = `${generatorId(generator)}:${request.kind}:${'count' in request ? request.count : 0}`;
  const known = fitting.get(key);
  if (known !== undefined) return known;
  let found = false;
  for (const difficulty of DIFFICULTIES) {
    for (let seed = 1; seed <= 6 && !found; seed++) {
      const exercise = generateExercise(generator, difficulty, seed);
      found = questionOf(exercise, request, createRng(seed)) !== null;
    }
    if (found) break;
  }
  fitting.set(key, found);
  return found;
}

/** The skills a game can ask, each with the slot it comes from, in the order to try them. */
function candidates(context: PlannerContext, index: number, rng: Rng) {
  const pool = skillPool(context, context.mastery);
  const preferred = GAME_PATTERN[index % GAME_PATTERN.length] ?? 'automatism';
  const order: Slot[] = [preferred, 'automatism', 'review', 'current'];
  const seen = new Set<SkillCode>();
  const list: { slot: Slot; skill: SkillCode }[] = [];
  for (const slot of order) {
    if (slot === 'challenge') continue;
    for (const skill of rng.shuffle(pool[slot])) {
      if (seen.has(skill)) continue;
      seen.add(skill);
      list.push({ slot, skill });
    }
  }
  return list;
}

export function planGameQuestion(
  context: PlannerContext,
  index: number,
  request: GameQuestionRequest,
): PlannedGameQuestion | null {
  const generators = context.generators ?? allGenerators;
  const rng = createRng(deriveSeed(context.seed, index));
  for (const { slot, skill } of candidates(context, index, rng)) {
    const usable = generators.filter(
      (generator) => generator.skill === skill && fits(generator, request),
    );
    if (usable.length === 0) continue;
    const generator = rng.pick(usable);
    const id = generatorId(generator);
    const record =
      context.mastery[skill] ??
      startingRecord(getSkill(skill), context.childGrade, context.mastery);
    const level = difficultyFor(decayedElo(record, context.startedAt), (difficulty) =>
      itemRating(context.itemRatings, id, difficulty),
    );
    // Easier levels as a fallback: a hard level of a skill may not fit the game.
    const levels = [...new Set([clampDifficulty(level - 1), clampDifficulty(level - 2), level])];
    for (const difficulty of levels) {
      for (let attempt = 0; attempt < SEEDS_PER_SKILL; attempt++) {
        const seed = rng.int(0, 2 ** 31 - 1);
        const planned: PlannedExercise = {
          generatorId: id,
          skill,
          difficulty,
          seed,
          slot,
          twinOf: null,
          reminder: false,
        };
        const question = questionOf(buildExercise(planned, generators), request, rng);
        if (question) return { planned, question };
      }
    }
  }
  return null;
}
