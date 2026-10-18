import { getSkill } from '@math-genius/curriculum';
import { bossSkills, worldMap, type MasteryRecord } from '@math-genius/exercise-engine';
import { screen, userEvent } from '@testing-library/react-native';

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

describe('WorldMap', () => {
  it('shows each island with its path, and opens a ready boss', async () => {
    const onFightBoss = jest.fn();
    const user = userEvent.setup();
    await renderWithTheme(<WorldMap islands={islands} busy={false} onFightBoss={onFightBoss} />);
    for (const domain of ['numbers', 'measures', 'geometry', 'data'] as const) {
      expect(
        screen.getByText(`${t.islands[domain].icon} ${t.islands[domain].name}`),
      ).toBeOnTheScreen();
    }
    expect(screen.getByText(t.boss.ready)).toBeOnTheScreen();
    // Every skill of the island, with its status (locked until a prerequisite is acquired).
    for (const node of islands[0]?.skills ?? []) {
      const label = t.node(getSkill(node.code).title, t.status[node.status], node.mastery);
      expect(screen.getByLabelText(label)).toBeOnTheScreen();
    }
    expect(screen.getAllByLabelText(new RegExp(t.status.locked)).length).toBeGreaterThan(0);
    await user.press(screen.getByRole('button', { name: t.boss.fight }));
    expect(onFightBoss).toHaveBeenCalledWith(measures);
  });

  it('keeps the boss waiting while a session is in progress', async () => {
    await renderWithTheme(<WorldMap islands={islands} busy onFightBoss={jest.fn()} />);
    expect(screen.getByText(t.boss.busy)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: t.boss.fight })).toBeNull();
  });
});
