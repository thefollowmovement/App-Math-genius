import { fireEvent, screen, userEvent } from '@testing-library/react-native';
import { makeMutable } from 'react-native-reanimated';
import { View } from '@math-genius/ui';

import { fishingRules } from '@/games/fishing/rules';
import { gemRainRules } from '@/games/gem-rain/rules';
import { NO_INPUT } from '@/games/kit/scene';
import { newRound } from '@/games/round';
import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { GamePlay, type GamePlayProps } from '.';

const t = strings.games;

function props(overrides: Partial<GamePlayProps> = {}): GamePlayProps {
  return {
    game: 'peche-eclair',
    rules: fishingRules,
    phase: 'playing',
    round: { ...newRound(null), score: 240 },
    prompt: '7 × 8',
    companion: { id: 'hibou', stage: 1 },
    clock: makeMutable(30_000),
    input: makeMutable(NO_INPUT),
    limitMs: 90_000,
    outcome: null,
    award: { status: 'pending' },
    loading: false,
    canReplay: true,
    sound: true,
    vibration: false,
    stage: () => <View testID="stage" />,
    onStart: jest.fn(),
    onPause: jest.fn(),
    onResume: jest.fn(),
    onQuit: jest.fn(),
    onAction: jest.fn(),
    onToggleSound: jest.fn(),
    onToggleVibration: jest.fn(),
    onReplay: jest.fn(),
    onRoom: jest.fn(),
    ...overrides,
  };
}

describe('GamePlay', () => {
  it('starts with the rules of the game', async () => {
    const user = userEvent.setup();
    const all = props({ phase: 'ready' });
    await renderWithTheme(<GamePlay {...all} />);
    expect(screen.getByText(t.items['peche-eclair'].howTo)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.play.start }));
    expect(all.onStart).toHaveBeenCalled();
  });

  it('shows the question, the score and the time left; « Pêcher ! » acts as the finger lands', async () => {
    const user = userEvent.setup();
    const all = props();
    await renderWithTheme(<GamePlay {...all} />);
    expect(screen.getByLabelText('7 × 8')).toBeOnTheScreen();
    expect(screen.getByLabelText(t.play.scoreLabel(240))).toBeOnTheScreen();
    expect(screen.getByLabelText(t.play.timeLabel(60))).toBeOnTheScreen();
    // A screen reader activates « Pêcher ! » as an action.
    fireEvent(screen.getByRole('button', { name: t.play.fishHint }), 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });
    expect(all.onAction).toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: t.play.pause }));
    expect(all.onPause).toHaveBeenCalled();
  });

  it('counts the hearts of a game that has some', async () => {
    await renderWithTheme(
      <GamePlay {...props({ game: 'pluie-de-gemmes', rules: gemRainRules, round: newRound(2) })} />,
    );
    expect(screen.getByLabelText(t.play.hearts(2))).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: t.play.fishHint })).toBeNull();
  });

  it('pauses with sounds and vibrations to switch, or the round to stop', async () => {
    const user = userEvent.setup();
    const all = props({ phase: 'paused' });
    await renderWithTheme(<GamePlay {...all} />);
    await user.press(screen.getByRole('button', { name: t.play.sound }));
    expect(all.onToggleSound).toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: t.play.quit }));
    expect(all.onQuit).toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: t.play.resume }));
    expect(all.onResume).toHaveBeenCalled();
  });

  it('ends with the stars, the score, a new record and the rewards', async () => {
    const user = userEvent.setup();
    const all = props({
      phase: 'over',
      outcome: { roundId: 'r1', score: 760, stars: 2, record: true, right: 6, answered: 8 },
      award: { status: 'done', xp: 70, gems: 2, gemsFull: false },
    });
    await renderWithTheme(<GamePlay {...all} />);
    expect(screen.getByText(t.end.titles[2])).toBeOnTheScreen();
    expect(screen.getByText(t.end.record)).toBeOnTheScreen();
    expect(screen.getByLabelText(t.end.tile(t.end.xp, '70'))).toBeOnTheScreen();
    expect(screen.getByLabelText(t.end.tile(t.end.gems, '2'))).toBeOnTheScreen();
    expect(screen.getByText(t.end.right(6, 8))).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.end.again }));
    expect(all.onReplay).toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: t.end.room }));
    expect(all.onRoom).toHaveBeenCalled();
  });

  it('plays no more once today’s time is up', async () => {
    await renderWithTheme(
      <GamePlay
        {...props({
          phase: 'over',
          canReplay: false,
          outcome: { roundId: 'r1', score: 0, stars: 0, record: false, right: 0, answered: 0 },
          award: { status: 'saving' },
        })}
      />,
    );
    expect(screen.getByText(t.end.limitReached)).toBeOnTheScreen();
    expect(screen.getByText(t.end.saved)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: t.end.again })).toBeNull();
  });
});
