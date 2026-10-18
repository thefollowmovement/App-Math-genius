import { GRADES } from './grade';
import { gradeSchema } from './grade-schema';

describe('gradeSchema', () => {
  it('accepts every grade from CP to 3e', () => {
    for (const grade of GRADES) {
      expect(gradeSchema.parse(grade)).toBe(grade);
    }
  });

  it('rejects grades outside the V1 scope', () => {
    expect(gradeSchema.safeParse('2nde').success).toBe(false);
    expect(gradeSchema.safeParse('cp').success).toBe(false);
  });
});
