import { PARENT_REWARD_TARGETS, parentRewardSchema } from './parent-rewards';

describe('parentRewardSchema', () => {
  it('trims the title and checks the goal', () => {
    expect(
      parentRewardSchema.parse({ title: '  Une sortie  ', goal: 'streak', target: 7 }),
    ).toEqual({
      title: 'Une sortie',
      goal: 'streak',
      target: 7,
    });
    expect(parentRewardSchema.safeParse({ title: '   ', goal: 'xp', target: 500 }).success).toBe(
      false,
    );
    expect(
      parentRewardSchema.safeParse({ title: 'x'.repeat(61), goal: 'xp', target: 500 }).success,
    ).toBe(false);
    expect(
      parentRewardSchema.safeParse({ title: 'Un livre', goal: 'gems', target: 5 }).success,
    ).toBe(false);
  });

  it('offers targets the database accepts', () => {
    const targets = Object.values(PARENT_REWARD_TARGETS).flat();
    expect(targets.every((target) => target >= 1 && target <= 100000)).toBe(true);
  });
});
