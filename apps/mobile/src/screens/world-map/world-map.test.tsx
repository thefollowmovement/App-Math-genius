import { getSkill } from '@math-genius/curriculum';
import { bossSkills, worldMap, type MasteryRecord } from '@math-genius/exercise-engine';
import { fireEvent, screen, userEvent } from '@testing-library/react-native';

import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { WorldMap } from '.';

const t = strings.map;
const at = '2026-10-18T17:00:00.000Z';
const mastered: MasteryRecord = {
  elo: 1500,
  attempts: 30,
  streak: 2,
  masteredAt: '2026-10-15T17:00:00.000Z',
  practicedAt: '2026-10-17T17:00:00.000Z',
};
const measures = { grade: 'CE2', domain: 'measures' } as const;
const islands = worldMap({
  grade: 'CE2',
  mastery: Object.fromEntries(bossSkills(measures).map((code) => [code, mastered])),
  at,
  defeated: [],
});
// Lays the path out, as a phone would.
const layOut = () =>
  fireEvent(screen.getByLabelText(t.pathLabel(t.islands.numbers.name)), 'layout', {
    nativeEvent: { layout: { width: 350, height: 2000 } },
  });

describe('WorldMap', () => {
  it('opens on the island where the child stands, with the hero on its stop', async () => {
    await renderWithTheme(<WorldMap islands={islands} busy={false} onFightBoss={jest.fn()} />);
    expect(screen.getByRole('header', { name: t.islands.numbers.name })).toBeOnTheScreen();
    expect(screen.getByText(t.island(1, 'CE2'))).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: t.previous })).toBeDisabled();
    await layOut();
    expect(screen.getByText(t.here)).toBeOnTheScreen();
    // Every skill of the island, with its status (locked until a prerequisite is acquired).
    const labels = screen
      .getAllByRole('button')
      .map((button) => String(button.props.accessibilityLabel));
    for (const node of islands[0]?.skills ?? []) {
      const label = t.node(getSkill(node.code).title, t.status[node.status], node.mastery);
      expect(labels.some((spoken) => spoken.endsWith(label))).toBe(true);
    }
    expect(labels.some((spoken) => spoken.startsWith(t.hereLabel))).toBe(true);
    expect(labels.some((spoken) => spoken.endsWith(t.status.locked))).toBe(true);
  });

  it('goes from island to island, and opens a ready boss', async () => {
    const onFightBoss = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(<WorldMap islands={islands} busy={false} onFightBoss={onFightBoss} />);
    await user.press(screen.getByRole('button', { name: t.next }));
    expect(screen.getByRole('header', { name: t.islands.measures.name })).toBeOnTheScreen();
    // No stop of the child here: the boss is shown, ready since every skill is mastered.
    expect(screen.getByText(t.boss.ready)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.boss.fight }));
    expect(onFightBoss).toHaveBeenCalledWith(measures);
  });

  it('tells about a skill touched on the path', async () => {
    const user = userEvent.setup();
    await renderWithTheme(<WorldMap islands={islands} busy={false} onFightBoss={jest.fn()} />);
    await layOut();
    const locked = islands[0]?.skills.find((node) => node.status === 'locked');
    if (!locked) throw new Error('No locked skill');
    const title = getSkill(locked.code).title;
    await user.press(screen.getByRole('button', { name: t.node(title, t.status.locked, null) }));
    expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    expect(screen.getByText(t.masteryLine(t.status.locked, null))).toBeOnTheScreen();
  });

  it('keeps the boss waiting while a session is in progress', async () => {
    const user = userEvent.setup();
    await renderWithTheme(<WorldMap islands={islands} busy onFightBoss={jest.fn()} />);
    await user.press(screen.getByRole('button', { name: t.next }));
    expect(screen.getByText(t.boss.busy)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: t.boss.fight })).toBeNull();
  });
});
