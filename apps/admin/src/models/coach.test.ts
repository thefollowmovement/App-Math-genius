import {
  coachSkills,
  explanationExample,
  readExplanation,
  skillErrors,
  understoodRate,
} from './coach';

describe('what the back-office shows of the coach', () => {
  it('lists the skills with exercises and their typical mistakes', () => {
    const skills = coachSkills();
    expect(skills.length).toBeGreaterThan(20);
    expect(skills.find((skill) => skill.code === 'ce2.addition-posee')?.title).toBeTruthy();
    expect(skillErrors('ce2.addition-posee').map((error) => error.code)).toContain('forgot-carry');
  });

  it('shows a stored explanation on an example, with the example’s numbers', () => {
    const example = explanationExample(
      {
        what: 'Tu as écrit {reponse}.',
        image: 'Imagine des blocs.',
        tip: 'La bonne réponse : {solution}.',
      },
      'ce2.addition-posee',
      'forgot-carry',
    );
    expect(example?.exercise).toBeTruthy();
    expect(example?.explanation.what).toMatch(/^Tu as écrit \d/);
    expect(example?.showable).toBe(true);
    const lying = explanationExample(
      { what: 'Tu as écrit 12345.', image: 'Imagine.', tip: 'Astuce.' },
      'ce2.addition-posee',
      'forgot-carry',
    );
    expect(lying?.showable).toBe(false);
    expect(explanationExample({ what: 'a', image: 'b', tip: 'c' }, 'not.a-skill', null)).toBeNull();
  });

  it('reads a stored template and the rate of « J’ai compris »', () => {
    expect(readExplanation({ what: 'a', image: 'b', tip: 'c' })).toEqual({
      what: 'a',
      image: 'b',
      tip: 'c',
    });
    expect(readExplanation({ what: 'a' })).toBeNull();
    expect(understoodRate(3, 4)).toBe(0.75);
    expect(understoodRate(0, 0)).toBeNull();
  });
});
