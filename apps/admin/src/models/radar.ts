import type { GradeBand } from '@math-genius/shared';

import { isoDate } from './dates';

/** admin_interest_counts: children who chose a reference, by age group and month. */
export type InterestCount = {
  universe_id: string;
  grade_band: string;
  month: string;
  children: number;
};

/** admin_other_answers: an « Autre » answer, without the child. */
export type OtherAnswer = {
  id: string;
  question_id: string;
  answer: string;
  status: string;
  grade_band: string;
  created_at: string;
};

/** Steps of the heatmap's one-hue scale. */
export const HEAT_STEPS = 5;

/** The first day of the last `count` months, oldest first. */
export function monthsBack(today: Date, count: number): string[] {
  return Array.from({ length: count }, (_, index) =>
    isoDate(new Date(today.getFullYear(), today.getMonth() - (count - 1 - index), 1)),
  );
}

export type RadarRow = { id: string; name: string; cells: number[]; latest: number; total: number };
export type RadarGrid = { months: string[]; rows: RadarRow[]; max: number };

/**
 * The radar's grid: the references chosen most (this month first), one cell per month. Without an
 * age group, the groups add up (a child is in one group only).
 */
export function radarGrid(
  counts: readonly InterestCount[],
  options: {
    band: GradeBand | null;
    months: readonly string[];
    names: ReadonlyMap<string, string>;
    limit?: number;
  },
): RadarGrid {
  const { band, months, names, limit = 15 } = options;
  const byUniverse = new Map<string, number[]>();
  for (const count of counts) {
    if (band !== null && count.grade_band !== band) continue;
    const column = months.indexOf(count.month.slice(0, 10));
    if (column < 0) continue;
    const cells = byUniverse.get(count.universe_id) ?? months.map(() => 0);
    cells[column] = (cells[column] ?? 0) + count.children;
    byUniverse.set(count.universe_id, cells);
  }
  const rows = [...byUniverse.entries()]
    .map(([id, cells]) => ({
      id,
      name: names.get(id) ?? id,
      cells,
      latest: cells.at(-1) ?? 0,
      total: cells.reduce((sum, value) => sum + value, 0),
    }))
    .sort((a, b) => b.latest - a.latest || b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, limit);
  const max = Math.max(0, ...rows.flatMap((row) => row.cells));
  return { months: [...months], rows, max };
}

/** The scale step of a value (1 … HEAT_STEPS), 0 for none. */
export const heatStep = (value: number, max: number) =>
  value <= 0 || max <= 0 ? 0 : Math.max(1, Math.ceil((value / max) * HEAT_STEPS));

const normalized = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();

export type OtherGroup = {
  key: string;
  /** The spelling children used most. */
  answer: string;
  questionId: string;
  ids: string[];
  count: number;
  bands: string[];
};

/** « Autre » answers that say the same thing (accents, case and spaces aside), most frequent first. */
export function otherGroups(answers: readonly OtherAnswer[]): OtherGroup[] {
  const groups = new Map<string, { group: OtherGroup; spellings: Map<string, number> }>();
  for (const answer of answers) {
    const key = `${answer.question_id}|${normalized(answer.answer)}`;
    const entry = groups.get(key) ?? {
      group: {
        key,
        answer: answer.answer.trim(),
        questionId: answer.question_id,
        ids: [],
        count: 0,
        bands: [],
      },
      spellings: new Map<string, number>(),
    };
    entry.group.ids.push(answer.id);
    entry.group.count += 1;
    if (!entry.group.bands.includes(answer.grade_band)) entry.group.bands.push(answer.grade_band);
    const spelling = answer.answer.trim();
    entry.spellings.set(spelling, (entry.spellings.get(spelling) ?? 0) + 1);
    groups.set(key, entry);
  }
  return [...groups.values()]
    .map(({ group, spellings }) => ({
      ...group,
      answer:
        [...spellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
        group.answer,
      bands: [...group.bands].sort(),
    }))
    .sort((a, b) => b.count - a.count || a.answer.localeCompare(b.answer));
}
