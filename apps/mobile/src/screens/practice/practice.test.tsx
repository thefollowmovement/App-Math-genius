import {
  add,
  equals,
  formatAnswer,
  mul,
  rational,
  gradeResponse,
  type Exercise,
  type ExerciseResponse,
} from '@math-genius/exercise-engine';
import { fireEvent, screen } from '@testing-library/react-native';

import { strings } from '@/i18n';
import { exerciseOfType } from '@/test-utils/exercises';
import { rightAnswerText } from '@/utils/exercise-text';
import { renderWithTheme } from '@/test-utils/render';
import { wrongResponse } from '@/test-utils/responses';

import { PracticeScreen, type PracticeFeedback } from '.';
import { graduationCount } from './inputs/number-line-input';

const t = strings.practice;

async function renderPractice(
  exercise: Exercise,
  options: { feedback?: PracticeFeedback; notice?: string; reminder?: boolean } = {},
) {
  const handlers = {
    onSubmit: jest.fn<void, [ExerciseResponse]>(),
    onContinue: jest.fn(),
    onShowHint: jest.fn(),
    onPause: jest.fn(),
  };
  await renderWithTheme(
    <PracticeScreen
      exercise={exercise}
      slot="current"
      twin={false}
      reminder={options.reminder ?? false}
      progress={0.3}
      hintShown={false}
      notice={options.notice ?? null}
      feedback={options.feedback ?? null}
      {...handlers}
    />,
  );
  return handlers;
}

/** The single response the child submitted, checked against the engine. */
function submitted(onSubmit: jest.Mock<void, [ExerciseResponse]>, exercise: Exercise) {
  expect(onSubmit).toHaveBeenCalledTimes(1);
  const [response] = onSubmit.mock.calls[0] ?? [];
  if (!response) throw new Error('Nothing submitted');
  expect(gradeResponse(exercise, response)).toEqual({ correct: true });
  return response;
}

const press = (label: string) => fireEvent.press(screen.getByLabelText(label));
const pressText = (text: string) => fireEvent.press(screen.getByText(text));

describe('answering each type of exercise by touch', () => {
  it('types a number on the built-in keypad', async () => {
    const exercise = exerciseOfType('numeric');
    const { onSubmit } = await renderPractice(exercise);
    const keys: Record<string, string> = {
      ',': t.keypad.comma,
      '/': t.keypad.fraction,
      '−': t.keypad.minus,
    };

    expect(screen.getByLabelText(t.submit)).toBeDisabled();
    for (const character of formatAnswer(exercise).replace(/\s/g, '')) {
      await press(keys[character] ?? character);
    }
    await press(t.submit);
    expect(submitted(onSubmit, exercise)).toEqual({
      type: 'numeric',
      text: formatAnswer(exercise).replace(/\s/g, ''),
    });
  });

  it('corrects a typo with the delete key', async () => {
    const exercise = exerciseOfType('numeric');
    const { onSubmit } = await renderPractice(exercise);
    await press('9');
    await press(t.keypad.delete);
    await press(t.keypad.delete);
    expect(screen.getByLabelText(t.submit)).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('picks an option', async () => {
    const exercise = exerciseOfType('choice');
    const { onSubmit } = await renderPractice(exercise);
    await press(exercise.options[exercise.answer]?.label ?? '');
    submitted(onSubmit, exercise);
  });

  it('answers true or false', async () => {
    const exercise = exerciseOfType('true-false');
    const { onSubmit } = await renderPractice(exercise);
    await press(exercise.answer ? t.trueLabel : t.falseLabel);
    submitted(onSubmit, exercise);
  });

  it('moves the cursor of the number line to a graduation', async () => {
    const exercise = exerciseOfType('number-line');
    const { onSubmit } = await renderPractice(exercise);
    const count = graduationCount(exercise);
    const target = Array.from({ length: count + 1 }, (_, i) => i).find((i) =>
      equals(add(exercise.min, mul(exercise.step, rational(i))), exercise.answer),
    );
    if (target === undefined) throw new Error('Target off the line');
    const start = Math.floor(count / 2);
    for (let i = start; i !== target; i += Math.sign(target - start)) {
      await press(target > start ? t.numberLine.right : t.numberLine.left);
    }
    await press(t.submit);
    submitted(onSubmit, exercise);
  });

  it('orders labels by touching them in turn, and can take one back', async () => {
    const exercise = exerciseOfType('order');
    const { onSubmit } = await renderPractice(exercise);
    const [first = 0, ...rest] = exercise.answer;
    await pressText(exercise.items[first] ?? '');
    await press(t.order.remove(exercise.items[first] ?? ''));
    expect(screen.getByLabelText(t.submit)).toBeDisabled();
    for (const index of [first, ...rest]) await pressText(exercise.items[index] ?? '');
    await press(t.submit);
    submitted(onSubmit, exercise);
  });

  it('matches labels two by two', async () => {
    const exercise = exerciseOfType('match');
    const { onSubmit } = await renderPractice(exercise);
    for (const [index, left] of exercise.left.entries()) {
      await pressText(left);
      await pressText(exercise.right[exercise.answer[index] ?? 0] ?? '');
    }
    await press(t.submit);
    submitted(onSubmit, exercise);
  });

  it('shades parts of a bar', async () => {
    const exercise = exerciseOfType('fraction-shade');
    const { onSubmit } = await renderPractice(exercise);
    for (let part = 1; part <= exercise.answer + 1; part++) await press(t.shade.part(part, false));
    await press(t.shade.part(1, true));
    await press(t.submit);
    submitted(onSubmit, exercise);
  });
});

describe('after an answer', () => {
  it('shows the right answer and the explanation after a mistake', async () => {
    const exercise = exerciseOfType('numeric');
    const { onContinue } = await renderPractice(exercise, {
      feedback: { response: wrongResponse(exercise), correct: false, fast: false, finished: false },
    });
    expect(screen.getByText(t.wrong)).toBeOnTheScreen();
    expect(screen.getByText(rightAnswerText(exercise))).toBeOnTheScreen();
    for (const step of exercise.explanation) expect(screen.getByText(step)).toBeOnTheScreen();
    expect(screen.queryByLabelText(t.submit)).toBeNull();
    await press(t.continue);
    expect(onContinue).toHaveBeenCalled();
  });

  it('cheers a right answer and offers the summary at the end', async () => {
    const exercise = exerciseOfType('choice');
    await renderPractice(exercise, {
      feedback: {
        response: { type: 'choice', index: exercise.answer },
        correct: true,
        fast: true,
        finished: true,
      },
    });
    expect(screen.getByText(t.fast)).toBeOnTheScreen();
    expect(screen.queryByText(t.wrong)).toBeNull();
    expect(screen.getByLabelText(t.finish)).toBeOnTheScreen();
  });

  it('asks for a hint, shows reminders and notices', async () => {
    const exercise = exerciseOfType('numeric');
    const { onShowHint } = await renderPractice(exercise, { notice: t.unreadable });
    await press(t.hint);
    expect(onShowHint).toHaveBeenCalled();
    expect(screen.getByText(t.unreadable)).toBeOnTheScreen();

    await renderPractice(exercise, { reminder: true });
    expect(screen.getByText(t.reminder)).toBeOnTheScreen();
    expect(screen.getByText(exercise.hint)).toBeOnTheScreen();
  });
});
