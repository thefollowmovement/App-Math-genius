import { generateExercise, generators, parseTypedNumber } from '@math-genius/exercise-engine';

import { applyKey, type KeypadKey } from './keypad';
import { retryNotice, rightAnswerText } from './exercise-text';

const type = (keys: KeypadKey[]) => keys.reduce(applyKey, '');
const generator = (skill: string) => {
  const found = generators.find((candidate) => candidate.skill === skill);
  if (!found) throw new Error(skill);
  return found;
};

describe('keypad', () => {
  it('types numbers the parser reads', () => {
    expect(type(['1', '2', ',', '5'])).toBe('12,5');
    expect(type([',', '5'])).toBe('0,5');
    expect(type(['3', '/', '4'])).toBe('3/4');
    expect(type(['7', '−'])).toBe('−7');
    for (const text of ['12,5', '0,5', '3/4', '−7', '−3/4']) {
      expect(parseTypedNumber(text)).not.toBeNull();
    }
  });

  it('refuses keys that would make the text unreadable', () => {
    expect(type(['1', ',', '2', ','])).toBe('1,2');
    expect(type(['/'])).toBe('');
    expect(type(['3', '/', '4', '/'])).toBe('3/4');
    expect(type(['3', ',', '5', '/'])).toBe('3,5');
    expect(type(['3', '/', ','])).toBe('3/');
    expect(type(['−', '−'])).toBe('');
  });

  it('deletes and limits the length', () => {
    expect(type(['1', '2', 'delete'])).toBe('1');
    expect(type(['delete'])).toBe('');
    expect(type(Array<KeypadKey>(20).fill('9'))).toHaveLength(12);
  });
});

describe('answer texts', () => {
  it('writes the expected answer of every exercise type', () => {
    const text = (skill: string, difficulty: 1 | 2 | 3 | 4 | 5 = 2) =>
      rightAnswerText(generateExercise(generator(skill), difficulty, 4));
    expect(text('ce2.tables-multiplication')).toMatch(/^\d+$/);
    expect(text('cm2.aire-rectangle')).toMatch(/ cm²$|m²$/);
    expect(['Vrai', 'Faux']).toContain(text('cm2.multiples-diviseurs'));
    expect(text('ce2.comparer-ranger-nombres')).toMatch(/ [<>] /);
    expect(text('cm2.fractions-decimaux-equivalences')).toContain('→');
    expect(text('ce2.fractions-unitaires')).toMatch(/parts coloriées sur/);
    expect(text('cm1.fractions-droite-graduee')).not.toBe('');
    expect(text('6e.nombres-premiers')).not.toBe('');
  });

  it('asks to correct the form without counting an error', () => {
    const exercise = generateExercise(generator('5e.fractions-addition'), 5, 1);
    expect(retryNotice(exercise, { correct: false, reason: 'wrong-form' })).toMatch(/fraction/);
    expect(retryNotice(exercise, { correct: false, reason: 'not-irreducible' })).toMatch(
      /simplifie/,
    );
    expect(retryNotice(exercise, { correct: false, reason: 'unreadable' })).toMatch(/lire/);
    expect(retryNotice(exercise, { correct: false, reason: 'incorrect' })).toBeNull();
    expect(retryNotice(exercise, { correct: true })).toBeNull();
  });
});
