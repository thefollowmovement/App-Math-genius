import {
  add,
  equals,
  formatAnswer,
  mul,
  rational,
  gradeResponse,
  type Exercise,
  type ExerciseResponse,
  type Slot,
} from '@math-genius/exercise-engine';
import { getSkill } from '@math-genius/curriculum';
import type { Avatar } from '@math-genius/shared';
import { fireEvent, screen } from '@testing-library/react-native';

import { HeroProvider } from '@/components/hero/hero-context';
import { strings } from '@/i18n';
import { exerciseOfType } from '@/test-utils/exercises';
import { rightAnswerText } from '@/utils/exercise-text';
import { renderWithTheme } from '@/test-utils/render';
import { wrongResponse } from '@/test-utils/responses';

import { PracticeScreen, type PracticeFeedback } from '.';
import { graduationCount } from './inputs/number-line-input';
import type { SessionCount } from './session-header';

const t = strings.practice;

async function renderPractice(
  exercise: Exercise,
  options: {
    feedback?: PracticeFeedback;
    notice?: string;
    reminder?: boolean;
    boss?: { grade: 'CM1'; domain: 'measures' };
    combo?: number;
    count?: SessionCount;
    slot?: Slot;
    /** The child's hero, and maybe a companion (the default hero without). */
    avatar?: Avatar;
  } = {},
) {
  const handlers = {
    onSubmit: jest.fn<void, [ExerciseResponse]>(),
    onContinue: jest.fn(),
    onShowHint: jest.fn(),
    onPause: jest.fn(),
  };
  const screenOf = (
    <PracticeScreen
      exercise={exercise}
      slot={options.slot ?? 'current'}
      twin={false}
      boss={options.boss}
      reminder={options.reminder ?? false}
      progress={0.3}
      count={options.count ?? { done: 6, total: 15, unit: 'exercises' }}
      combo={options.combo ?? 0}
      hintShown={false}
      notice={options.notice ?? null}
      feedback={options.feedback ?? null}
      {...handlers}
    />
  );
  await renderWithTheme(
    options.avatar ? <HeroProvider avatar={options.avatar}>{screenOf}</HeroProvider> : screenOf,
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

describe('the session header', () => {
  it('names the skill, a timed calculation, or the island of a boss', async () => {
    const exercise = exerciseOfType('numeric');
    await renderPractice(exercise);
    expect(screen.getByText(getSkill(exercise.skill).title)).toBeOnTheScreen();
    expect(screen.queryByText(t.slots.current)).toBeNull();
    await renderPractice(exercise, { slot: 'automatism' });
    expect(screen.getByText(t.slots.automatism)).toBeOnTheScreen();
    await renderPractice(exercise, { boss: { grade: 'CM1', domain: 'measures' } });
    expect(screen.getByText(t.boss(strings.map.islands.measures.name))).toBeOnTheScreen();
  });

  it('counts exercises or minutes, pauses, and shows the combo from 3 in a row', async () => {
    const { onPause } = await renderPractice(exerciseOfType('numeric'), { combo: 2 });
    expect(screen.getByLabelText(t.counter.countLabel(6, 15))).toHaveTextContent(
      t.counter.count(6, 15),
    );
    expect(screen.queryByLabelText(t.comboLabel(2))).toBeNull();
    await press(t.pauseLabel);
    expect(onPause).toHaveBeenCalled();

    await renderPractice(exerciseOfType('numeric'), {
      combo: 3,
      count: { done: 4, total: 15, unit: 'minutes' },
    });
    expect(screen.getByLabelText(t.comboLabel(3))).toBeOnTheScreen();
    expect(screen.getByText(t.combo(3))).toBeOnTheScreen();
    expect(screen.getByLabelText(t.counter.minutesLabel(4, 15))).toBeOnTheScreen();
  });
});

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

  it('picks an option, can change its mind, then validates', async () => {
    const exercise = exerciseOfType('choice');
    const { onSubmit } = await renderPractice(exercise);
    expect(screen.getByLabelText(t.submit)).toBeDisabled();
    const other = exercise.options.find((_, index) => index !== exercise.answer)?.label ?? '';
    await press(other);
    expect(screen.getByLabelText(other)).toBeSelected();
    expect(onSubmit).not.toHaveBeenCalled();
    await press(exercise.options[exercise.answer]?.label ?? '');
    expect(screen.getByLabelText(other)).not.toBeSelected();
    await press(t.submit);
    submitted(onSubmit, exercise);
  });

  it('answers true or false, then validates', async () => {
    const exercise = exerciseOfType('true-false');
    const { onSubmit } = await renderPractice(exercise);
    await press(exercise.answer ? t.trueLabel : t.falseLabel);
    await press(t.submit);
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
    // The hero encourages, never scolds.
    const { encourage } = strings.heroes;
    expect(screen.getByText(encourage[exercise.seed % encourage.length] ?? '')).toBeOnTheScreen();
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
    const praise = t.correct[exercise.seed % t.correct.length] ?? '';
    expect(screen.getByText(`${praise} ${t.fast}`)).toBeOnTheScreen();
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
    expect(screen.getByText(`${t.reminder}\u00a0: ${exercise.hint}`)).toBeOnTheScreen();
    expect(screen.queryByLabelText(t.hint)).toBeNull();
  });
});

describe('with a companion', () => {
  const talk = strings.companions.talk;
  const pick = (lines: readonly string[], seed: number) => lines[seed % lines.length] ?? '';
  const withCompanion = (companion: 'dragon' | 'phenix' | 'chat'): Avatar => ({
    hero: 'kai',
    wear: { companion },
  });

  it('offers the hint, gives it and encourages, in its own name', async () => {
    const exercise = exerciseOfType('numeric');
    const { onShowHint } = await renderPractice(exercise, { avatar: withCompanion('chat') });
    expect(screen.getByText('Chaton Cosmique')).toBeOnTheScreen();
    expect(screen.getByText(pick(talk.chat.ask, exercise.seed))).toBeOnTheScreen();
    await press(t.hint);
    expect(onShowHint).toHaveBeenCalled();

    await renderPractice(exercise, { avatar: withCompanion('chat'), reminder: true });
    expect(screen.getByText(`${t.reminder}\u00a0: ${exercise.hint}`)).toBeOnTheScreen();

    await renderPractice(exercise, {
      avatar: withCompanion('chat'),
      feedback: { response: wrongResponse(exercise), correct: false, fast: false, finished: false },
    });
    expect(screen.getByText(pick(talk.chat.encourage, exercise.seed))).toBeOnTheScreen();
    expect(screen.queryByText(pick(strings.heroes.encourage, exercise.seed))).toBeNull();
  });

  it('talks of its specialty: Draco on geometry', async () => {
    const exercise = { ...exerciseOfType('numeric'), skill: 'cm1.perimetre' as const };
    await renderPractice(exercise, { avatar: withCompanion('dragon') });
    expect(screen.getByText(pick(talk.dragon.special.ask, exercise.seed))).toBeOnTheScreen();
  });

  it('lets the hero cheer, except Phénix on fire from 3 in a row', async () => {
    const exercise = exerciseOfType('choice');
    const feedback = {
      response: { type: 'choice' as const, index: exercise.answer },
      correct: true,
      fast: false,
      finished: false,
    };
    await renderPractice(exercise, { avatar: withCompanion('phenix'), combo: 2, feedback });
    expect(screen.getByText(pick(t.correct, exercise.seed))).toBeOnTheScreen();
    expect(screen.queryByText('Phénix')).toBeNull();

    await renderPractice(exercise, { avatar: withCompanion('phenix'), combo: 3, feedback });
    expect(screen.getByText('Phénix')).toBeOnTheScreen();
    expect(screen.getByText(pick(talk.phenix.fire, exercise.seed))).toBeOnTheScreen();
  });

  it('changes nothing without one', async () => {
    const exercise = exerciseOfType('numeric');
    await renderPractice(exercise, { avatar: { hero: 'kai', wear: { frame: 'frame-neon' } } });
    expect(screen.getByText(t.hintAsk)).toBeOnTheScreen();
  });
});
