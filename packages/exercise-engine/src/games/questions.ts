import type { Exercise, ExerciseContent, NumericExercise } from '../exercise';
import { MINUS, formatAnswer, formatFraction, formatNumber } from '../format';
import { type ExerciseResponse, gradeResponse } from '../grade';
import type { Rng } from '../random';
import { type Rational, add, div, equals, isTerminating, mul, rational, sub } from '../rational';
import { numberTokens } from '../coach/numbers';

/**
 * The engine's exercises, asked the arcade way (docs/design/mini-jeux.md): a short question and a
 * few answers to catch, a target to make with bubbles, or two cards that go together. Every answer
 * a game shows is graded by the engine itself (gradeResponse): exactly one choice is right,
 * whatever the game draws. The code computes, the game only shows.
 */

/** A question fits on the game's banner (two short lines at most). */
export const GAME_PROMPT_MAX = 40;
/** What a fish, a gem or a bubble carries. */
export const GAME_LABEL_MAX = 7;
/** Each side of a memory card. */
export const GAME_CARD_MAX = 12;

export type GameChoice = { label: string; response: ExerciseResponse; correct: boolean };

/** Catch, pick or fly through the right answer (fishing, gems, flight, race). */
export type ChoiceQuestion = {
  kind: 'choices';
  exercise: Exercise;
  prompt: string;
  /** In the order to show them; exactly one is right. */
  choices: GameChoice[];
};

export type SumOperator = '+' | '×';

/** Pop the bubbles that make the target (the parts of « a + b » or « a × b »). */
export type SumQuestion = {
  kind: 'sum';
  exercise: Exercise;
  operator: SumOperator;
  target: string;
  /** The bubbles: the two right parts among others, in the order to show them. */
  numbers: { label: string; value: Rational }[];
};

/** A calculation and its result, on two memory cards. */
export type PairQuestion = {
  kind: 'pair';
  exercise: Exercise;
  left: string;
  right: string;
  /** The answer the pair stands for. */
  response: ExerciseResponse;
};

export type GameQuestion = ChoiceQuestion | SumQuestion | PairQuestion;
export type GameQuestionKind = GameQuestion['kind'];

/** « Calcule : 2 + 9 × 7 » reads « 2 + 9 × 7 » on a banner. */
export const gamePrompt = (prompt: string) => prompt.replace(/^Calcule\s*:\s*/, '');

const numericResponse = (text: string): ExerciseResponse => ({ type: 'numeric', text });

/** The way the exercise writes its answer: fractions stay fractions. */
function labelOf(exercise: NumericExercise, value: Rational): string {
  const asFraction = exercise.display === 'fraction' || !isTerminating(exercise.answer);
  return asFraction && value.den !== 1 ? formatFraction(value.num, value.den) : formatNumber(value);
}

/** Wrong values a child could plausibly give, near the answer. */
function nearValues(exercise: NumericExercise): Rational[] {
  const { answer } = exercise;
  if (answer.den === 1) {
    return [1, -1, 2, -2, 10, -10, 3, -3, 5, -5, 20, -20, 100].map((step) =>
      rational(answer.num + step),
    );
  }
  if (isTerminating(answer) && exercise.display !== 'fraction') {
    const places = Math.round(Math.log10(answer.den));
    const unit = rational(1, 10 ** places);
    return [
      add(answer, unit),
      sub(answer, unit),
      add(answer, rational(1)),
      sub(answer, rational(1)),
      mul(answer, rational(10)),
      div(answer, rational(10)),
      add(answer, mul(unit, rational(2))),
    ];
  }
  const { num, den } = answer;
  return [
    rational(num + 1, den),
    rational(num, den + 1),
    ...(num > 1 ? [rational(num - 1, den)] : []),
    ...(den > 2 ? [rational(num, den - 1)] : []),
    ...(num !== 0 ? [rational(den, num)] : []),
    rational(num + den, den),
  ];
}

/** Wrong in value, not the right value written another way (the engine says « incorrect »). */
const plainlyWrong = (exercise: ExerciseContent, response: ExerciseResponse) => {
  const verdict = gradeResponse(exercise, response);
  return !verdict.correct && verdict.reason === 'incorrect';
};

function numericChoices(exercise: NumericExercise, count: number, rng: Rng): GameChoice[] | null {
  const right = formatAnswer(exercise);
  if (right.length > GAME_LABEL_MAX) return null;
  const rightResponse = numericResponse(right);
  if (!gradeResponse(exercise, rightResponse).correct) return null;
  const negativeAnswer = exercise.answer.num < 0;
  const typical = Object.values(exercise.mistakes ?? {}).flatMap((values) =>
    (values ?? []).filter((value): value is Rational => value !== undefined),
  );
  const wrong: GameChoice[] = [];
  // The typical mistakes first (they are what a child really answers), then near values.
  for (const value of [...typical, ...rng.shuffle(nearValues(exercise))]) {
    if (wrong.length === count - 1) break;
    if (value.num < 0 && !negativeAnswer) continue;
    if (equals(value, exercise.answer)) continue;
    const label = labelOf(exercise, value);
    if (label.length > GAME_LABEL_MAX || label === right) continue;
    if (wrong.some((choice) => choice.label === label)) continue;
    const response = numericResponse(label);
    if (plainlyWrong(exercise, response)) wrong.push({ label, response, correct: false });
  }
  if (wrong.length < count - 1) return null;
  return rng.shuffle([{ label: right, response: rightResponse, correct: true }, ...wrong]);
}

function optionChoices(exercise: Exercise, count: number, rng: Rng): GameChoice[] | null {
  if (exercise.type === 'true-false') {
    if (count !== 2) return null;
    return rng.shuffle(
      [true, false].map((value) => ({
        label: value ? 'Vrai' : 'Faux',
        response: { type: 'true-false', value } satisfies ExerciseResponse,
        correct: value === exercise.answer,
      })),
    );
  }
  if (exercise.type !== 'choice') return null;
  const options = exercise.options.map((option, index) => ({
    label: option.label,
    response: { type: 'choice', index } satisfies ExerciseResponse,
    correct: index === exercise.answer,
  }));
  if (options.length < count || options.some((option) => option.label.length > GAME_LABEL_MAX)) {
    return null;
  }
  const right = options.filter((option) => option.correct);
  const others = options.filter((option) => !option.correct);
  return rng.shuffle([...right, ...rng.sample(others, count - 1)]);
}

/** The question with `count` answers to choose from, or null when the exercise does not fit. */
export function choiceQuestion(exercise: Exercise, count: number, rng: Rng): ChoiceQuestion | null {
  const prompt = gamePrompt(exercise.prompt);
  if (prompt.length > GAME_PROMPT_MAX) return null;
  const choices =
    exercise.type === 'numeric'
      ? numericChoices(exercise, count, rng)
      : optionChoices(exercise, count, rng);
  if (!choices) return null;
  // The engine's verdict, checked once more: one right answer, never two.
  const right = choices.filter((choice) => gradeResponse(exercise, choice.response).correct);
  if (right.length !== 1 || !right[0]?.correct) return null;
  return { kind: 'choices', exercise, prompt, choices };
}

const signed = (text: string, value: Rational) =>
  text.startsWith(MINUS) ? rational(-value.num, value.den) : value;

/** The two parts and the operator of « a + b », « a × b » or « double(a) », if that is all. */
function partsOf(exercise: NumericExercise): { operator: SumOperator; parts: Rational[] } | null {
  const double = /^double\((\d+)\)$/.exec(exercise.check);
  if (double) {
    const value = rational(Number(double[1]));
    return { operator: '+', parts: [value, value] };
  }
  const tokens = numberTokens(exercise.check);
  const [first, second] = tokens;
  if (tokens.length !== 2 || !first || !second) return null;
  const between = exercise.check
    .slice(first.end, second.start)
    .replace(/[()\s]/g, '')
    .trim();
  const outside = (exercise.check.slice(0, first.start) + exercise.check.slice(second.end))
    .replace(/[()\s]/g, '')
    .trim();
  if (outside !== '' || (between !== '+' && between !== '×')) return null;
  return {
    operator: between,
    parts: [signed(first.text, first.value), signed(second.text, second.value)],
  };
}

/**
 * The target to make with bubbles: the answer of « a + b » (or « a × b ») with whole parts, the
 * two parts among `count` bubbles. The other bubbles are near the parts; whatever bubbles the child pops,
 * the game grades their sum (or product) against the answer.
 */
export function sumQuestion(exercise: Exercise, count: number, rng: Rng): SumQuestion | null {
  if (exercise.type !== 'numeric') return null;
  const found = partsOf(exercise);
  if (!found) return null;
  const { operator, parts } = found;
  const [a, b] = parts;
  // Whole numbers only: bubbles carry « 7 » or « −3 », never « 4/3 ».
  if (!a || !b || a.den !== 1 || b.den !== 1) return null;
  const combined = operator === '+' ? add(a, b) : mul(a, b);
  if (!equals(combined, exercise.answer)) return null;
  const target = formatAnswer(exercise);
  if (target.length > GAME_LABEL_MAX) return null;
  const label = (value: Rational) => labelOf(exercise, value);
  // Both parts, even when equal: « 7 + 7 » shows two bubbles « 7 ».
  const numbers = parts.map((value) => ({ label: label(value), value }));
  if (numbers.some((number) => number.label.length > GAME_LABEL_MAX)) return null;
  const near = [1, -1, 2, -2, 3, -3, 10, -10].map((step) => rational(step));
  const far = [4, -4, 5, -5, 20, -20].map((step) => rational(step));
  // Near the parts first, a little further when they are not enough (a double has one part).
  const others = [
    ...rng.shuffle(parts.flatMap((part) => near.map((step) => add(part, step)))),
    ...rng.shuffle(parts.flatMap((part) => far.map((step) => add(part, step)))),
  ];
  for (const value of others) {
    if (numbers.length === count) break;
    if (value.num <= 0 && a.num > 0 && b.num > 0) continue;
    const text = label(value);
    if (text.length > GAME_LABEL_MAX || numbers.some((number) => number.label === text)) continue;
    numbers.push({ label: text, value });
  }
  if (numbers.length < count) return null;
  return { kind: 'sum', exercise, operator, target, numbers: rng.shuffle(numbers) };
}

/** What a set of popped bubbles answers: their sum (or product), as the child's answer. */
export function sumResponse(question: SumQuestion, values: readonly Rational[]): ExerciseResponse {
  const combined = values.reduce(
    (total, value) => (question.operator === '+' ? add(total, value) : mul(total, value)),
    rational(question.operator === '+' ? 0 : 1),
  );
  if (question.exercise.type !== 'numeric') return numericResponse(formatNumber(combined));
  return numericResponse(labelOf(question.exercise, combined));
}

/**
 * « 7 × 8 = ? » on one card and « 56 » on the other; « 2 m = ? cm » gives « 2 m » and « 200 cm ».
 * Only short calculations that ask for what follows the equals sign.
 */
export function pairQuestion(exercise: Exercise): PairQuestion | null {
  if (exercise.type !== 'numeric') return null;
  const match = /^(.+?) = (.*)$/.exec(gamePrompt(exercise.prompt));
  if (!match) return null;
  const [, left = '', rest = ''] = match;
  if (left.includes('?') || (rest.match(/\?/g) ?? []).length !== 1) return null;
  const answer = formatAnswer(exercise);
  const right = rest.replace('?', answer).trim();
  if (left.length > GAME_CARD_MAX || right.length > GAME_CARD_MAX) return null;
  const response = numericResponse(answer);
  if (!gradeResponse(exercise, response).correct) return null;
  return { kind: 'pair', exercise, left, right, response };
}
