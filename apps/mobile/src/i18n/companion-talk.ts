import { getSkill } from '@math-genius/curriculum';
import type { Exercise, Slot } from '@math-genius/exercise-engine';
import { companionOf, type CompanionId, type CompanionSpecialty } from '@math-genius/shared';

import { COMBO_FROM } from '@/data/practice/summary';

import type { CompanionTalk } from './fr';
import { strings } from './index';

/** Where the session stands when the companion talks. */
export type TalkContext = {
  exercise: Pick<Exercise, 'skill' | 'seed' | 'hint'>;
  slot: Slot;
  /** Right answers in a row, the current one included. */
  combo: number;
  /** Errors in a row: the hint comes as a reminder. */
  reminder: boolean;
};

/**
 * When the companion talks: it offers the hint, gives it, encourages after a wrong answer, and
 * cheers a right one only in its specialty (Phénix on fire).
 */
export type TalkMoment = 'ask' | 'hint' | 'encourage' | 'correct';

// Measures of figures (perimeters, areas, angles) are geometry for a child, as fractions are
// what their slug says. Skill codes are stable (packages/curriculum).
const FIGURE_MEASURES = /^(perimetre|aire|angles)/;

/** Whether the exercise is the companion's specialty (Draco on geometry…). */
export function inSpecialty(specialty: CompanionSpecialty, context: TalkContext): boolean {
  const { exercise, slot, combo } = context;
  const slug = exercise.skill.split('.')[1] ?? '';
  switch (specialty) {
    case 'geometry':
      return getSkill(exercise.skill).domain === 'geometry' || FIGURE_MEASURES.test(slug);
    case 'fractions':
      return slug.startsWith('fraction');
    case 'speed':
      return slot === 'automatism';
    case 'fire':
      return combo >= COMBO_FROM;
    default:
      return false;
  }
}

/** Phénix catches fire: right answers in a row are its specialty. */
export const onFire = (companion: CompanionId, context: TalkContext): boolean =>
  companionOf(companion)?.specialty === 'fire' && inSpecialty('fire', context);

/** What the companion says, or null when it lets the hero talk. */
export function companionLine(
  companion: CompanionId,
  moment: TalkMoment,
  context: TalkContext,
): string | null {
  const talk: CompanionTalk = strings.companions.talk[companion];
  const specialty = companionOf(companion)?.specialty;
  const special = specialty && inSpecialty(specialty, context) ? talk.special : undefined;
  // The same exercise always gets the same line.
  const pick = (lines: readonly string[]) =>
    lines[context.exercise.seed % lines.length] ?? lines[0] ?? '';
  switch (moment) {
    case 'ask':
      return pick(special?.ask ?? talk.ask);
    case 'hint': {
      const title = context.reminder ? strings.practice.reminder : (special?.hint ?? talk.hint);
      return `${title}\u00a0: ${context.exercise.hint}`;
    }
    case 'encourage':
      return pick(special?.encourage ?? talk.encourage);
    case 'correct':
      return talk.fire && onFire(companion, context) ? pick(talk.fire) : null;
  }
}
