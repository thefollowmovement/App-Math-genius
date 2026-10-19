import { screen } from '@testing-library/react-native';

import { strings } from '@/i18n';
import { exerciseOfType } from '@/test-utils/exercises';
import { renderWithTheme } from '@/test-utils/render';

import { FeedbackPanel } from './feedback-panel';

const exercise = exerciseOfType('numeric');
const { encourage } = strings.heroes;

describe('FeedbackPanel', () => {
  it('has the mascot encourage the child after a mistake', async () => {
    await renderWithTheme(
      <FeedbackPanel
        exercise={exercise}
        correct={false}
        fast={false}
        finished={false}
        onContinue={jest.fn()}
      />,
    );
    expect(screen.getByText(strings.practice.wrong)).toBeOnTheScreen();
    expect(screen.getByText(encourage[exercise.seed % encourage.length] ?? '')).toBeOnTheScreen();
  });

  it('keeps a right answer short', async () => {
    await renderWithTheme(
      <FeedbackPanel exercise={exercise} correct fast finished onContinue={jest.fn()} />,
    );
    expect(screen.getByText(strings.practice.fast)).toBeOnTheScreen();
    expect(screen.queryByText(encourage[exercise.seed % encourage.length] ?? '')).toBeNull();
    expect(screen.getByRole('button', { name: strings.practice.finish })).toBeOnTheScreen();
  });
});
