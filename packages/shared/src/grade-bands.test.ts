import { GRADES } from './grade';
import { GRADE_BANDS, gradeBand } from './grade-bands';

describe('age groups of the coach', () => {
  it('put every grade in one group, two grades or three at a time', () => {
    const counts = GRADE_BANDS.map(
      (band) => GRADES.filter((grade) => gradeBand(grade) === band).length,
    );
    expect(counts).toEqual([3, 2, 2, 2]);
    expect(gradeBand('CE1')).toBe('cp-ce2');
    expect(gradeBand('5e')).toBe('6e-5e');
  });
});
