import type { Exercise } from '../exercise';
import { formatAnswer, formatFraction, formatNumber } from '../format';
import type { ExerciseResponse } from '../grade';
import type { Rational } from '../rational';
import { numberTokens, numbersOf } from './numbers';

/**
 * What the coach knows of an exercise (docs/specs.md, « le code calcule, l'IA raconte »): its text
 * with each number replaced by a slot, the child's answer, the right one and the correction steps.
 * An explanation is written with these slots, never with digits, so the numbers it shows always
 * come from the exercise: the same explanation serves every exercise of the skill.
 */

export type CoachFrame = {
  /** Slot name → text it stands for: n1, n2… (the exercise), e1… (correction), reponse, solution. */
  slots: Readonly<Record<string, string>>;
  /** The exercise as the child sees it, numbers as slots. */
  exercise: string;
  /** The correction steps of the generator, numbers as slots. */
  steps: readonly string[];
  /** Every value an explanation may show. */
  allowed: readonly Rational[];
};

const TRUE = 'vrai';
const FALSE = 'faux';
const shade = (count: number, parts: number) => `${count} part${count > 1 ? 's' : ''} sur ${parts}`;

/** The expected answer, as the child reads it after a mistake. */
export function answerText(exercise: Exercise): string {
  switch (exercise.type) {
    case 'numeric':
      return [formatAnswer(exercise), exercise.unit].filter(Boolean).join(' ');
    case 'choice':
      return exercise.options[exercise.answer]?.label ?? '';
    case 'true-false':
      return exercise.answer ? TRUE : FALSE;
    case 'number-line':
      return exercise.target;
    case 'order':
      return ordered(exercise.items, exercise.answer, exercise.direction);
    case 'match':
      return paired(exercise.left, exercise.right, exercise.answer);
    case 'fraction-shade':
      return shade(exercise.answer, exercise.parts);
  }
}

/** The child's answer, written like the expected one. */
export function givenText(exercise: Exercise, response: ExerciseResponse): string {
  switch (response.type) {
    case 'numeric':
      return [response.text, exercise.type === 'numeric' ? exercise.unit : undefined]
        .filter(Boolean)
        .join(' ');
    case 'choice':
      return exercise.type === 'choice' ? (exercise.options[response.index]?.label ?? '') : '';
    case 'true-false':
      return response.value ? TRUE : FALSE;
    case 'number-line':
      return exercise.type === 'number-line' && exercise.target.includes('/')
        ? formatFraction(response.value.num, response.value.den)
        : formatNumber(response.value);
    case 'order':
      return exercise.type === 'order'
        ? ordered(exercise.items, response.order, exercise.direction)
        : '';
    case 'match':
      return exercise.type === 'match' ? paired(exercise.left, exercise.right, response.pairs) : '';
    case 'fraction-shade':
      return exercise.type === 'fraction-shade' ? shade(response.shaded, exercise.parts) : '';
  }
}

const ordered = (items: readonly string[], order: readonly number[], direction: string) =>
  order.map((index) => items[index] ?? '').join(direction === 'ascending' ? ' < ' : ' > ');

const paired = (left: readonly string[], right: readonly string[], pairs: readonly number[]) =>
  left.map((label, index) => `${label} → ${right[pairs[index] ?? 0] ?? ''}`).join(' ; ');

/** What the child sees: the prompt, and the choices or items to work with. */
function shown(exercise: Exercise): string {
  switch (exercise.type) {
    case 'choice':
      return `${exercise.prompt} Choix : ${exercise.options.map((option) => option.label).join(' ; ')}.`;
    case 'order':
      return `${exercise.prompt} Nombres : ${exercise.items.join(' ; ')}.`;
    case 'match':
      return `${exercise.prompt} À relier : ${exercise.left.join(' ; ')} avec ${exercise.right.join(' ; ')}.`;
    default:
      return exercise.prompt;
  }
}

/** Replaces each number of `text` by a slot `{<prefix><n>}`, numbered from `first`. */
function slotted(text: string, prefix: string, slots: Record<string, string>, first = 1) {
  let index = first;
  let out = '';
  let last = 0;
  for (const token of numberTokens(text)) {
    const name = `${prefix}${index++}`;
    slots[name] = token.text;
    out += `${text.slice(last, token.start)}{${name}}`;
    last = token.end;
  }
  return { text: out + text.slice(last), next: index };
}

export function coachFrame(exercise: Exercise, response: ExerciseResponse): CoachFrame {
  const slots: Record<string, string> = {};
  const seen = shown(exercise);
  const exerciseText = slotted(seen, 'n', slots).text;
  let next = 1;
  const steps = exercise.explanation.map((step) => {
    const result = slotted(step, 'e', slots, next);
    next = result.next;
    return result.text;
  });
  slots.reponse = givenText(exercise, response);
  slots.solution = answerText(exercise);
  const allowed = [seen, ...exercise.explanation, slots.reponse, slots.solution].flatMap(numbersOf);
  return { slots, exercise: exerciseText, steps, allowed };
}
