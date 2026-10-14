import type { Exercise } from '../exercise';
import { formatAnswer, formatNumber } from '../format';
import { gradeResponse } from '../grade';
import { add, isTerminating, rational } from '../rational';

import { type Q, evaluate, fromEngine, numbersIn, parseNumber, sameValue } from './oracle';

const SUSPICIOUS = /undefined|NaN|Infinity|null|\[object/;

const abs = (value: Q): Q => ({ n: value.n < 0n ? -value.n : value.n, d: value.d });
const includesValue = (values: Q[], value: Q) =>
  values.some((other) => sameValue(other, abs(value)));
const isPermutation = (list: readonly number[], size: number) =>
  list.length === size && [...list].sort((a, b) => a - b).every((value, index) => value === index);

function value(expression: string): Q {
  const result = evaluate(expression);
  if (typeof result === 'boolean') throw new Error(`"${expression}" is a statement, not a number`);
  return result;
}

function statement(expression: string): boolean {
  const result = evaluate(expression);
  if (typeof result !== 'boolean') throw new Error(`"${expression}" is a number, not a statement`);
  return result;
}

/** Numbers of a check that do not appear in the text shown to the child. */
function unseenNumbers(check: string, shown: string): string[] {
  const visible = numbersIn(shown);
  return numbersIn(check)
    .filter((number) => !includesValue(visible, number))
    .map((number) => `${number.n}/${number.d}`);
}

/** Everything wrong with one exercise; empty when it is sound. */
export function auditExercise(exercise: Exercise): string[] {
  const problems: string[] = [];
  const fail = (message: string) => problems.push(message);
  const texts = [exercise.prompt, exercise.hint, ...exercise.explanation];

  if (!exercise.prompt.trim() || !exercise.hint.trim()) fail('empty prompt or hint');
  if (exercise.explanation.length < 1 || exercise.explanation.length > 3)
    fail('explanation must have 1 to 3 steps');
  if (exercise.explanation.some((step) => !step.trim())) fail('empty explanation step');

  switch (exercise.type) {
    case 'numeric': {
      const expected = fromEngine(exercise.answer);
      if (!sameValue(value(exercise.check), expected)) fail(`check ${exercise.check} ≠ answer`);
      const unseen = unseenNumbers(exercise.check, exercise.prompt);
      if (unseen.length) fail(`check uses numbers not in the prompt: ${unseen.join(', ')}`);
      const lastStep = exercise.explanation.at(-1) ?? '';
      if (!includesValue(numbersIn(lastStep), expected))
        fail('explanation does not end with the answer');

      const written = formatAnswer(exercise);
      if (!gradeResponse(exercise, { type: 'numeric', text: written }).correct)
        fail(`"${written}" is refused`);
      if (!exercise.forms) {
        const { num, den } = exercise.answer;
        // The same value typed as a fraction, and as a decimal with a dot ("0.25", "-3").
        const typed = formatNumber(exercise.answer)
          .replace(',', '.')
          .replace(/ /g, '')
          .replace('−', '-');
        const alternatives = [`${num}/${den}`, ...(isTerminating(exercise.answer) ? [typed] : [])];
        for (const text of alternatives) {
          if (!exercise.irreducible || den === 1 || text.includes('/')) {
            if (!gradeResponse(exercise, { type: 'numeric', text }).correct)
              fail(`"${text}" is refused`);
          }
        }
      }
      const wrong = formatNumber(add(exercise.answer, rational(1)));
      if (gradeResponse(exercise, { type: 'numeric', text: wrong }).correct)
        fail(`"${wrong}" is accepted`);
      break;
    }

    case 'choice': {
      if (exercise.options.length < 3 || exercise.options.length > 4)
        fail('3 or 4 options expected');
      const labels = exercise.options.map((option) => option.label);
      if (new Set(labels).size !== labels.length) fail('duplicate options');
      const truths = exercise.options.map((option) => statement(option.check));
      if (truths.filter(Boolean).length !== 1)
        fail(`${truths.filter(Boolean).length} true options`);
      if (!truths[exercise.answer]) fail('the answer is not the true option');
      exercise.options.forEach((option) => {
        const unseen = unseenNumbers(option.check, `${exercise.prompt} ${option.label}`);
        if (unseen.length) fail(`option check uses unseen numbers: ${unseen.join(', ')}`);
      });
      texts.push(...labels);
      exercise.options.forEach((_, index) => {
        const verdict = gradeResponse(exercise, { type: 'choice', index });
        if (verdict.correct !== (index === exercise.answer)) fail(`option ${index} graded wrongly`);
      });
      break;
    }

    case 'true-false': {
      if (statement(exercise.check) !== exercise.answer)
        fail(`${exercise.check} is not ${exercise.answer}`);
      const unseen = unseenNumbers(exercise.check, exercise.prompt);
      if (unseen.length) fail(`check uses numbers not in the prompt: ${unseen.join(', ')}`);
      if (!gradeResponse(exercise, { type: 'true-false', value: exercise.answer }).correct)
        fail('right answer refused');
      if (gradeResponse(exercise, { type: 'true-false', value: !exercise.answer }).correct)
        fail('wrong answer accepted');
      break;
    }

    case 'number-line': {
      const [min, max, step, answer] = [
        exercise.min,
        exercise.max,
        exercise.step,
        exercise.answer,
      ].map(fromEngine) as [Q, Q, Q, Q];
      if (!sameValue(parseNumber(exercise.target), answer))
        fail(`target ${exercise.target} ≠ answer`);
      if (!exercise.prompt.includes(exercise.target)) fail('target not in the prompt');
      const position = (x: Q) =>
        evaluate(`(${x.n}/${x.d} − ${min.n}/${min.d}) ÷ (${step.n}/${step.d})`) as Q;
      if (
        statement(`${answer.n}/${answer.d} < ${min.n}/${min.d}`) ||
        statement(`${answer.n}/${answer.d} > ${max.n}/${max.d}`)
      )
        fail('target off the line');
      if (position(answer).d !== 1n) fail('target between two graduations');
      const graduations = position(max);
      if (graduations.d !== 1n || graduations.n < 2n || graduations.n > 40n)
        fail('line needs 2 to 40 whole graduations');
      if (!gradeResponse(exercise, { type: 'number-line', value: exercise.answer }).correct)
        fail('right position refused');
      if (
        gradeResponse(exercise, { type: 'number-line', value: add(exercise.answer, exercise.step) })
          .correct
      )
        fail('wrong position accepted');
      break;
    }

    case 'order': {
      const values = exercise.items.map(parseNumber);
      if (exercise.items.length < 3 || exercise.items.length > 6) fail('3 to 6 items expected');
      if (values.some((a, i) => values.some((b, j) => i < j && sameValue(a, b))))
        fail('two items are equal');
      const expected = values
        .map((itemValue, index) => ({ itemValue, index }))
        .sort(
          (a, b) =>
            (statement(`${a.itemValue.n}/${a.itemValue.d} < ${b.itemValue.n}/${b.itemValue.d}`)
              ? -1
              : 1) * (exercise.direction === 'ascending' ? 1 : -1),
        )
        .map(({ index }) => index);
      if (expected.join() !== exercise.answer.join()) fail(`expected order ${expected.join()}`);
      if (!isPermutation(exercise.answer, exercise.items.length))
        fail('answer is not a permutation');
      texts.push(...exercise.items);
      if (!gradeResponse(exercise, { type: 'order', order: exercise.answer }).correct)
        fail('right order refused');
      if (gradeResponse(exercise, { type: 'order', order: [...exercise.answer].reverse() }).correct)
        fail('reversed order accepted');
      break;
    }

    case 'match': {
      const [left, right] = [exercise.left.map(parseNumber), exercise.right.map(parseNumber)];
      if (left.length !== right.length || left.length < 2 || left.length > 5)
        fail('2 to 5 pairs expected');
      for (const side of [left, right]) {
        if (side.some((a, i) => side.some((b, j) => i < j && sameValue(a, b))))
          fail('two items of a column are equal');
      }
      if (!isPermutation(exercise.answer, right.length)) fail('answer is not a permutation');
      exercise.answer.forEach((rightIndex, leftIndex) => {
        const [a, b] = [left[leftIndex], right[rightIndex]];
        if (!a || !b || !sameValue(a, b))
          fail(`${exercise.left[leftIndex]} does not match ${exercise.right[rightIndex]}`);
      });
      texts.push(...exercise.left, ...exercise.right);
      if (!gradeResponse(exercise, { type: 'match', pairs: exercise.answer }).correct)
        fail('right pairs refused');
      const swapped = [
        exercise.answer[1] ?? 0,
        exercise.answer[0] ?? 0,
        ...exercise.answer.slice(2),
      ];
      if (gradeResponse(exercise, { type: 'match', pairs: swapped }).correct)
        fail('swapped pairs accepted');
      break;
    }

    case 'fraction-shade': {
      const fraction = parseNumber(exercise.fraction);
      const shaded = evaluate(`${exercise.parts} × ${fraction.n}/${fraction.d}`) as Q;
      if (!exercise.prompt.includes(exercise.fraction)) fail('fraction not in the prompt');
      if (exercise.parts < 2 || exercise.parts > 30) fail('2 to 30 parts expected');
      if (shaded.d !== 1n || shaded.n !== BigInt(exercise.answer))
        fail(`${exercise.fraction} of ${exercise.parts} parts is not ${exercise.answer}`);
      if (exercise.answer < 1 || exercise.answer > exercise.parts)
        fail('nothing or too much to shade');
      if (!gradeResponse(exercise, { type: 'fraction-shade', shaded: exercise.answer }).correct)
        fail('right shading refused');
      if (gradeResponse(exercise, { type: 'fraction-shade', shaded: exercise.answer + 1 }).correct)
        fail('wrong shading accepted');
      break;
    }
  }

  if (texts.some((text) => SUSPICIOUS.test(text))) fail('a text shows undefined, NaN or similar');
  return problems;
}

/** What makes two draws the same exercise for the child (explanations aside). */
export function exerciseKey(exercise: Exercise): string {
  const { hint: _hint, explanation: _explanation, seed: _seed, ...shown } = exercise;
  return JSON.stringify(shown);
}
