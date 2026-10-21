import { heatStep, monthsBack, otherGroups, radarGrid, type InterestCount } from './radar';

const MONTHS = monthsBack(new Date(2026, 9, 20), 3);
const names = new Map([
  ['minecraft', 'Minecraft'],
  ['roblox', 'Roblox'],
  ['foot', 'Football'],
]);
const counts: InterestCount[] = [
  { universe_id: 'minecraft', grade_band: 'cm1-cm2', month: '2026-10-01', children: 4 },
  { universe_id: 'minecraft', grade_band: '6e-5e', month: '2026-10-01', children: 2 },
  { universe_id: 'minecraft', grade_band: 'cm1-cm2', month: '2026-08-01', children: 9 },
  { universe_id: 'roblox', grade_band: 'cm1-cm2', month: '2026-10-01', children: 8 },
  { universe_id: 'foot', grade_band: '6e-5e', month: '2026-09-01', children: 3 },
  // Older than the radar: left out.
  { universe_id: 'foot', grade_band: '6e-5e', month: '2026-01-01', children: 50 },
];

describe('the trends radar', () => {
  it('covers the last months, oldest first', () => {
    expect(MONTHS).toEqual(['2026-08-01', '2026-09-01', '2026-10-01']);
    expect(monthsBack(new Date(2026, 0, 5), 2)).toEqual(['2025-12-01', '2026-01-01']);
  });

  it('puts the references chosen most this month first, the age groups added up', () => {
    const grid = radarGrid(counts, { band: null, months: MONTHS, names });
    expect(grid.rows.map((row) => [row.name, row.cells])).toEqual([
      ['Roblox', [0, 0, 8]],
      ['Minecraft', [9, 0, 6]],
      ['Football', [0, 3, 0]],
    ]);
    expect(grid.max).toBe(9);
  });

  it('shows one age group at a time', () => {
    const grid = radarGrid(counts, { band: '6e-5e', months: MONTHS, names, limit: 1 });
    expect(grid.rows.map((row) => [row.name, row.cells])).toEqual([['Minecraft', [0, 0, 2]]]);
  });

  it('shades a cell by its share of the largest value', () => {
    expect(heatStep(0, 9)).toBe(0);
    expect(heatStep(1, 9)).toBe(1);
    expect(heatStep(9, 9)).toBe(5);
    expect(heatStep(5, 0)).toBe(0);
  });

  it('gathers the « Autre » answers that say the same thing', () => {
    const answer = (id: string, text: string, band = 'cm1-cm2', question = 'games') => ({
      id,
      question_id: question,
      answer: text,
      status: 'pending',
      grade_band: band,
      created_at: '2026-10-20T10:00:00Z',
    });
    const groups = otherGroups([
      answer('1', 'Zelda'),
      answer('2', 'zelda ', '6e-5e'),
      answer('3', 'Zelda'),
      answer('4', 'Pokémon GO'),
      answer('5', 'Zelda', 'cm1-cm2', 'shows'),
    ]);
    expect(groups.map((group) => [group.answer, group.count, group.bands])).toEqual([
      ['Zelda', 3, ['6e-5e', 'cm1-cm2']],
      ['Pokémon GO', 1, ['cm1-cm2']],
      ['Zelda', 1, ['cm1-cm2']],
    ]);
    expect(groups[0]?.ids).toEqual(['1', '2', '3']);
  });
});
