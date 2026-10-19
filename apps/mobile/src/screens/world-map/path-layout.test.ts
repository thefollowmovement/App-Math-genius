import { BOSS_ROW, ROW, pathCurve, pathLayout } from './path-layout';

describe('an island path', () => {
  it('puts the boss on top and the first skill at the bottom, inside the width', () => {
    const { boss, nodes, height } = pathLayout(4, 300);
    expect(height).toBe(BOSS_ROW + 4 * ROW);
    expect(boss.y).toBeLessThan(BOSS_ROW);
    const [first, ...others] = nodes;
    for (const node of others) expect(node.y).toBeLessThan(first?.y ?? 0);
    for (const { x, y } of nodes) {
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(300);
      expect(y).toBeLessThan(height);
    }
  });

  it('draws one curve through every stop', () => {
    const { boss, nodes } = pathLayout(3, 300);
    const d = pathCurve([...nodes, boss]);
    expect(d.startsWith(`M${nodes[0]?.x} ${nodes[0]?.y}`)).toBe(true);
    expect(d.match(/C/g)).toHaveLength(3);
    expect(pathCurve([])).toBe('');
  });
});
