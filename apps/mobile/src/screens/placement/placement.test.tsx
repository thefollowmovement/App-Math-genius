import { worldMap } from '@math-genius/exercise-engine';
import { screen, userEvent } from '@testing-library/react-native';

import { currentStop } from '@/data/mission-model';
import { strings } from '@/i18n';
import { exerciseOfType } from '@/test-utils/exercises';
import { renderWithTheme } from '@/test-utils/render';

import { PlacementScreen } from '.';
import { PlacementIntro } from './placement-intro';
import { PlacementResult } from './placement-result';

const t = strings.placement;

describe('PlacementIntro', () => {
  it('says there is no score nor timer, and lets the child start or come back later', async () => {
    const onStart = jest.fn();
    const onLater = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <PlacementIntro childName="Léa" recheck={false} onStart={onStart} onLater={onLater} />,
    );
    expect(screen.getByRole('header', { name: t.intro.first.title('Léa') })).toBeOnTheScreen();
    for (const point of t.intro.points) expect(screen.getByText(point)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.intro.start }));
    await user.press(screen.getByRole('button', { name: t.intro.later }));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onLater).toHaveBeenCalledTimes(1);
  });

  it('presents a recheck as a check of the progress', async () => {
    await renderWithTheme(
      <PlacementIntro childName="Léa" recheck onStart={jest.fn()} onLater={jest.fn()} />,
    );
    expect(screen.getByText(t.intro.recheck.label)).toBeOnTheScreen();
  });
});

describe('PlacementScreen', () => {
  it('validates a chosen answer, offers « Je ne sais pas », and never shows a score', async () => {
    const exercise = exerciseOfType('choice');
    const onSubmit = jest.fn();
    const onSkip = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <PlacementScreen
        exercise={exercise}
        progress={0.4}
        recheck={false}
        notice={null}
        onSubmit={onSubmit}
        onSkip={onSkip}
        onPause={jest.fn()}
      />,
    );
    expect(screen.getByRole('header', { name: exercise.prompt })).toBeOnTheScreen();
    expect(screen.getByLabelText(t.test.progress(40))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: t.test.submit })).toBeDisabled();
    await user.press(screen.getByText(exercise.options[0]?.label ?? ''));
    await user.press(screen.getByRole('button', { name: t.test.submit }));
    expect(onSubmit).toHaveBeenCalledWith({ type: 'choice', index: 0 });
    await user.press(screen.getByRole('button', { name: t.test.skip }));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(strings.practice.rightAnswer)).toBeNull();
  });
});

describe('PlacementResult', () => {
  it('reveals the islands and the first mission', async () => {
    const islands = worldMap({ grade: 'CM1', mastery: {}, at: '2026-10-20', defeated: [] });
    const stop = currentStop(islands);
    const onPlay = jest.fn();
    const onOpenMap = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(
      <PlacementResult
        islands={islands}
        stop={stop}
        onPlay={onPlay}
        onOpenMap={onOpenMap}
        onHome={jest.fn()}
      />,
    );
    expect(screen.getByRole('header', { name: t.result.title })).toBeOnTheScreen();
    for (const island of islands) {
      const name = strings.map.islands[island.domain].name;
      const status =
        island.playable === 0 ? t.result.soon : strings.map.progress(0, island.playable);
      expect(screen.getByLabelText(`${name} : ${status}`)).toBeOnTheScreen();
    }
    expect(screen.getByText(t.result.mission)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.result.play }));
    await user.press(screen.getByRole('button', { name: t.result.map }));
    expect(onPlay).toHaveBeenCalledTimes(1);
    expect(onOpenMap).toHaveBeenCalledTimes(1);
  });
});
