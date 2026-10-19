import type { SkillCode } from '@math-genius/curriculum';

import type { Difficulty, Exercise, ExerciseContent } from './exercise';
import { type Rng, createRng } from './random';

/**
 * One pure function per skill: from a difficulty (1 to 5) and a random source, an exercise with
 * its answer, hint and explanation.
 */
export type Generator = {
  skill: SkillCode;
  /** Defaults to the skill code; set it when a skill gets several generators. */
  id?: string;
  generate: (rng: Rng, difficulty: Difficulty) => ExerciseContent;
};

export const defineGenerator = (generator: Generator): Generator => generator;

export const generatorId = (generator: Generator): string => generator.id ?? generator.skill;

export function generateExercise(
  generator: Generator,
  difficulty: Difficulty,
  seed: number,
): Exercise {
  return {
    ...generator.generate(createRng(seed), difficulty),
    generatorId: generatorId(generator),
    skill: generator.skill,
    difficulty,
    seed,
  };
}
