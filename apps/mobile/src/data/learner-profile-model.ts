import { STRANDS, isErrorTypeCode, isSkillCode, type Strand } from '@math-genius/curriculum';
import type {
  AfterError,
  LearnerProfile,
  LearningStyle,
  Strength,
  TimeOfDay,
  Weakness,
} from '@math-genius/exercise-engine';
import { GRADES } from '@math-genius/shared';

/**
 * The learning profile the server computed (learner_profiles.profile, the engine's LearnerProfile),
 * read defensively: an item this version of the app does not know is left out.
 */

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const list = (value: unknown): Row[] => (Array.isArray(value) ? value.filter(isRow) : []);
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const strand = (value: unknown): Strand | null => STRANDS.find((item) => item === value) ?? null;

function strengthOf(row: Row): Strength | null {
  const area = strand(row.strand);
  switch (row.kind) {
    case 'ahead':
    case 'best':
      return area ? { kind: row.kind, strand: area } : null;
    case 'solid':
      return area ? { kind: 'solid', strand: area, mastered: num(row.mastered) } : null;
    case 'mental_speed':
      return { kind: 'mental_speed', medianMs: num(row.medianMs), rate: num(row.rate) };
    case 'flawless':
      return { kind: 'flawless', run: num(row.run) };
    default:
      return null;
  }
}

function weaknessOf(row: Row): Weakness | null {
  const area = strand(row.strand);
  const skill = typeof row.skill === 'string' && isSkillCode(row.skill) ? row.skill : null;
  switch (row.kind) {
    case 'error':
      return typeof row.error === 'string' && isErrorTypeCode(row.error)
        ? {
            kind: 'error',
            error: row.error,
            count: num(row.count),
            lastSeenAt: typeof row.lastSeenAt === 'string' ? row.lastSeenAt : '',
          }
        : null;
    case 'behind':
      return area ? { kind: 'behind', strand: area } : null;
    case 'fading':
      return skill ? { kind: 'fading', skill, mastery: num(row.mastery) } : null;
    case 'stuck':
      return skill
        ? { kind: 'stuck', skill, mastery: num(row.mastery), answers: num(row.answers) }
        : null;
    default:
      return null;
  }
}

const TIMES: readonly TimeOfDay[] = ['morning', 'afternoon', 'evening'];
const AFTER_ERROR: readonly AfterError[] = ['perseveres', 'gives_up', 'guesses'];

function styleOf(value: unknown): LearningStyle {
  const style = isRow(value) ? value : {};
  const attention = isRow(style.attention) ? style.attention : null;
  return {
    attention:
      attention?.kind === 'steady'
        ? { kind: 'steady', minutes: num(attention.minutes) }
        : attention?.kind === 'drops'
          ? { kind: 'drops', after: num(attention.after) }
          : null,
    bestTime: TIMES.find((time) => time === style.bestTime) ?? null,
    afterError: AFTER_ERROR.find((reaction) => reaction === style.afterError) ?? null,
    twinSuccess: typeof style.twinSuccess === 'number' ? style.twinSuccess : null,
  };
}

export function parseProfile(value: unknown): LearnerProfile | null {
  if (!isRow(value)) return null;
  const grade = GRADES.find((item) => item === value.grade);
  if (!grade) return null;
  return {
    grade,
    answers: num(value.answers),
    mastered: num(value.mastered),
    inProgress: num(value.inProgress),
    strengths: list(value.strengths)
      .map(strengthOf)
      .filter((item): item is Strength => item !== null),
    weaknesses: list(value.weaknesses)
      .map(weaknessOf)
      .filter((item): item is Weakness => item !== null),
    style: styleOf(value.style),
    computedAt: typeof value.computedAt === 'string' ? value.computedAt : '',
  };
}

/** The child's « super-pouvoir » (docs/specs.md): the first strength, if any. */
export type SuperPower =
  | { kind: 'mental_speed' }
  | { kind: 'flawless' }
  | { kind: 'strand'; strand: Strand; how: 'ahead' | 'solid' | 'best' };

export function superPower(profile: LearnerProfile | null | undefined): SuperPower | null {
  const [strength] = profile?.strengths ?? [];
  if (!strength) return null;
  if (strength.kind === 'mental_speed' || strength.kind === 'flawless') {
    return { kind: strength.kind };
  }
  return { kind: 'strand', strand: strength.strand, how: strength.kind };
}
