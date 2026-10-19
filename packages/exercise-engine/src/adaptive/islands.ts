import {
  DOMAINS,
  type Domain,
  type SkillCode,
  getSkill,
  isSkillCode,
  skills,
} from '@math-genius/curriculum';
import { BOSS_MAX_EXERCISES, BOSS_MIN_EXERCISES, type Grade } from '@math-genius/shared';

import { type Generator, generatorId } from '../generator';
import { generators as allGenerators } from '../generators';
import { createRng, deriveSeed } from '../random';
import {
  type MasteryMap,
  type MasteryStatus,
  decayedElo,
  isAcquired,
  masteryOf,
  masteryStatus,
  startingRecord,
} from './mastery';
import type { PlannedExercise, PlannerContext } from './planner';
import { difficultyFor, itemRating } from './ratings';

/**
 * The world map (docs/specs.md, Gamification): one island per domain of the child's grade, a path
 * through its skills, and a boss at the end, a short evaluation on every skill of the island.
 */

export type Island = { grade: Grade; domain: Domain };
export const islandKey = ({ grade, domain }: Island) => `${grade}.${domain}`;

/** Locked: a prerequisite is not acquired yet. Coming soon: no exercise exists for it yet. */
export type NodeStatus = MasteryStatus | 'locked' | 'coming_soon';
export type SkillNode = { code: SkillCode; status: NodeStatus; mastery: number | null };
/** Ready once every skill of the island that can be practised has been mastered. */
export type BossState = 'locked' | 'ready' | 'defeated';
export type IslandView = Island & {
  skills: SkillNode[];
  /** Skills with exercises, and how many of them were mastered at least once. */
  playable: number;
  mastered: number;
  boss: BossState;
};

const islandCodes = ({ grade, domain }: Island): SkillCode[] =>
  skills
    .filter((skill) => skill.grade === grade && skill.domain === domain)
    .map((skill) => skill.code)
    .filter(isSkillCode);

/** Skills of the island that have exercises, in programme order. */
export function bossSkills(island: Island, generators = allGenerators): SkillCode[] {
  const withGenerator = new Set<string>(generators.map((generator) => generator.skill));
  return islandCodes(island).filter((code) => withGenerator.has(code));
}

export const bossLength = (island: Island, generators = allGenerators) =>
  Math.min(
    BOSS_MAX_EXERCISES,
    Math.max(BOSS_MIN_EXERCISES, 2 * bossSkills(island, generators).length),
  );

export function worldMap(input: {
  grade: Grade;
  mastery: MasteryMap;
  at: string;
  /** Islands whose boss the server says was beaten (islandKey). */
  defeated: readonly string[];
  generators?: readonly Generator[];
}): IslandView[] {
  const { grade, mastery, at } = input;
  const generators = input.generators ?? allGenerators;
  const withGenerator = new Set<string>(generators.map((generator) => generator.skill));
  // As for the planner: a prerequisite without exercises does not block.
  const acquired = (code: SkillCode) =>
    !withGenerator.has(code) || isAcquired(mastery[code], getSkill(code), grade, at);

  return DOMAINS.map((domain) => {
    const island = { grade, domain };
    const nodes = islandCodes(island).map((code): SkillNode => {
      const record = mastery[code];
      if (!withGenerator.has(code)) return { code, status: 'coming_soon', mastery: null };
      if (record && record.attempts > 0) {
        return { code, status: masteryStatus(record, at), mastery: masteryOf(record, at) };
      }
      const open = getSkill(code).prerequisites.every(
        (prerequisite) => !isSkillCode(prerequisite) || acquired(prerequisite),
      );
      return { code, status: open ? 'to_discover' : 'locked', mastery: null };
    });
    const playable = nodes.filter((node) => node.status !== 'coming_soon');
    const mastered = playable.filter((node) => mastery[node.code]?.masteredAt).length;
    const boss: BossState = input.defeated.includes(islandKey(island))
      ? 'defeated'
      : playable.length > 0 && mastered === playable.length
        ? 'ready'
        : 'locked';
    return { ...island, skills: nodes, playable: playable.length, mastered, boss };
  });
}

/**
 * A boss exercise: every skill of the island in turn (from a seeded start), at the child's own
 * difficulty, with no twins, reminders or boosts. A pure function of the context, as planNext.
 */
export function planBossExercise(
  context: PlannerContext,
  boss: Island,
  attempts: readonly unknown[],
): PlannedExercise | null {
  const generators = context.generators ?? allGenerators;
  const codes = bossSkills(boss, generators);
  if (codes.length === 0) return null;
  const index = attempts.length;
  const start = createRng(context.seed).int(0, codes.length - 1);
  const skill = codes[(start + index) % codes.length];
  const rng = createRng(deriveSeed(context.seed, index));
  const seed = rng.int(0, 2 ** 31 - 1);
  const candidates = generators.filter((generator) => generator.skill === skill);
  if (!skill || candidates.length === 0) return null;

  const id = generatorId(rng.pick(candidates));
  const record =
    context.mastery[skill] ?? startingRecord(getSkill(skill), context.childGrade, context.mastery);
  const difficulty = difficultyFor(decayedElo(record, context.startedAt), (level) =>
    itemRating(context.itemRatings, id, level),
  );
  return {
    generatorId: id,
    skill,
    difficulty,
    seed,
    slot: 'current',
    twinOf: null,
    reminder: false,
  };
}
