/** Height of the boss's row, at the top of an island's path. */
export const BOSS_ROW = 184;
/** Height of each skill's row. */
export const ROW = 128;
// The path winds from one side to the other (share of the width).
const COLUMNS = [0.5, 0.7, 0.32, 0.64, 0.38, 0.68, 0.3];

export type Point = { x: number; y: number };

/**
 * Where an island's stops stand, in pixels for a path `width` wide: its boss at the top, then
 * its skills from the last (just under the boss) down to the first, at the bottom.
 */
export function pathLayout(count: number, width: number) {
  const boss: Point = { x: width / 2, y: 64 };
  const nodes = Array.from({ length: count }, (_, index) => ({
    x: width * (COLUMNS[index % COLUMNS.length] ?? 0.5),
    y: BOSS_ROW + (count - 1 - index) * ROW + ROW / 2,
  }));
  return { boss, nodes, height: BOSS_ROW + count * ROW };
}

/** A winding curve from the first stop (bottom) up to the boss, through every stop. */
export function pathCurve(points: readonly Point[]): string {
  const [first, ...rest] = points;
  if (!first) return '';
  let previous = first;
  let d = `M${first.x} ${first.y}`;
  for (const point of rest) {
    const middle = (previous.y + point.y) / 2;
    d += ` C${previous.x} ${middle} ${point.x} ${middle} ${point.x} ${point.y}`;
    previous = point;
  }
  return d;
}
