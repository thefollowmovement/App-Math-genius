import { ERROR_TYPES, getSkill } from '@math-genius/curriculum';

import { DIFFICULTIES } from '../exercise';
import { generateExercise } from '../generator';
import { generators } from '../generators';
import { diagnoseResponse, mistakeList } from '../diagnose';
import { gradeResponse } from '../grade';
import { rational } from '../rational';
import { responseWith } from '../respond';
import { coachFrame } from './frame';
import { foreignNumbers, numberTokens, numbersOf } from './numbers';
import { coachSample } from './sample';
import {
  type Explanation,
  explanationProblems,
  renderExplanation,
  showableExplanation,
} from './template';
import { wrongAnswer } from './wrong';

const forgotCarry = () => {
  const sample = coachSample('ce2.addition-posee', 'forgot-carry');
  if (!sample) throw new Error('no sample');
  return sample;
};

describe('numbers in a text', () => {
  it('reads them as the engine writes them', () => {
    const text = 'On a 12 500 billes, 3,25 kg, −7 °C, 3/4 de tarte et 10³ grains.';
    expect(numberTokens(text).map((token) => token.text)).toEqual([
      '12 500',
      '3,25',
      '−7',
      '3/4',
      '10',
      '³',
    ]);
    expect(numbersOf('3/4')).toEqual([rational(3, 4), rational(3), rational(4)]);
  });

  it('compares by value, without the sign', () => {
    const allowed = numbersOf('0,3 et −5');
    expect(foreignNumbers('0,30 puis 5 et 0,25', allowed)).toEqual(['0,25']);
  });
});

describe('what the coach knows of an exercise', () => {
  it('puts a slot for each number of the exercise and of its correction', () => {
    const { exercise, response } = forgotCarry();
    const frame = coachFrame(exercise, response);
    expect(frame.exercise).toBe('{n1} + {n2} = ?');
    expect(frame.steps.at(-1)).toBe('{e1} + {e2} = {e3}');
    expect(frame.slots.reponse).not.toBe(frame.slots.solution);
    expect(Number(frame.slots.solution)).toBe(Number(frame.slots.n1) + Number(frame.slots.n2));
  });
});

describe('an explanation template', () => {
  const { exercise, response } = forgotCarry();
  const frame = coachFrame(exercise, response);
  const good: Explanation = {
    what: 'Tu as écrit {reponse} : la retenue s’est envolée !',
    image: 'Dans Minecraft, dix blocs empilés font une rangée de plus.',
    tip: 'Pose la retenue en haut de la colonne suivante : {n1} + {n2} = {solution}.',
  };

  it('shows the exercise’s own numbers', () => {
    expect(
      explanationProblems({ ...good, image: 'Une rangée de plus dans Minecraft.' }, frame),
    ).toEqual([]);
    expect(showableExplanation({ ...good, image: 'Une rangée de plus.' }, frame)?.tip).toBe(
      `Pose la retenue en haut de la colonne suivante : ${frame.slots.n1} + ${frame.slots.n2} = ${frame.slots.solution}.`,
    );
  });

  it('refuses digits and numbers in words, which nothing could check', () => {
    expect(explanationProblems(good, frame)).toEqual(['number-words']);
    expect(explanationProblems({ ...good, image: 'Il manque 1 bloc.' }, frame)).toContain('digits');
    expect(explanationProblems({ ...good, image: 'Pense à ta tour ²' }, frame)).toContain('digits');
    // Ordinals and « zéro » are words, not quantities to check.
    expect(
      explanationProblems({ ...good, image: 'La deuxième colonne reçoit un zéro de plus.' }, frame),
    ).toEqual([]);
  });

  it('refuses a slot the exercise does not have, an empty part or too many words', () => {
    expect(explanationProblems({ ...good, image: 'Voir {n7}.' }, frame)).toContain('unknown-slot');
    expect(explanationProblems({ ...good, image: 'Voir {nombre }.' }, frame)).toContain(
      'unknown-slot',
    );
    expect(explanationProblems({ ...good, image: ' ' }, frame)).toContain('empty');
    const long = Array.from({ length: 61 }, () => 'mot').join(' ');
    expect(explanationProblems({ ...good, image: long }, frame)).toContain('too-long');
    expect(renderExplanation({ ...good, image: '{n9}' }, frame.slots)).toBeNull();
  });

  it('refuses a number shown that the correction does not have', () => {
    const narrower = { ...frame, allowed: numbersOf(frame.slots.reponse ?? '') };
    expect(explanationProblems({ ...good, image: 'Une rangée.' }, narrower)).toEqual([
      'foreign-number',
    ]);
  });
});

describe('the night’s samples', () => {
  it('find an exercise for every typical mistake of the referential', () => {
    for (const type of ERROR_TYPES) {
      for (const skill of type.skills) {
        const sample = coachSample(skill, type.code);
        expect(sample && diagnoseResponse(sample.exercise, sample.response)).toBe(type.code);
      }
    }
  });

  it('find a wrong answer the engine cannot explain, for the other mistakes', () => {
    const skills = new Set(generators.map((generator) => generator.skill));
    for (const skill of skills) {
      const sample = coachSample(skill, null);
      expect(sample).not.toBeNull();
      if (!sample) continue;
      expect(gradeResponse(sample.exercise, sample.response).correct).toBe(false);
      expect(diagnoseResponse(sample.exercise, sample.response)).toBeNull();
      expect(getSkill(sample.exercise.skill).code).toBe(skill);
    }
  });
});

/**
 * The phase 7c criterion (docs/specs.md): every explanation shown has numbers that agree with the
 * correction. A template written for one exercise of a skill, shown for any other exercise of the
 * same skill, either shows only that exercise's numbers or is not shown at all.
 */
describe('numbers of every explanation shown', () => {
  const DRAWS = 40;

  it('come from the exercise or its correction, for every generator', () => {
    let shown = 0;
    for (const generator of generators) {
      const template = (() => {
        const sample = coachSample(generator.skill, null, [generator]);
        if (!sample) throw new Error(`no sample for ${generator.skill}`);
        const slots = Object.keys(coachFrame(sample.exercise, sample.response).slots);
        return {
          what: `Tu as répondu {reponse} au lieu de {solution}.`,
          image: slots
            .filter((slot) => /^n\d+$/.test(slot))
            .map((slot) => `{${slot}}`)
            .join(', '),
          tip: slots
            .filter((slot) => /^e\d+$/.test(slot))
            .map((slot) => `{${slot}}`)
            .join(' puis '),
        } satisfies Explanation;
      })();
      for (const difficulty of DIFFICULTIES) {
        for (let seed = 1; seed <= DRAWS; seed++) {
          const exercise = generateExercise(generator, difficulty, seed);
          const responses = [
            wrongAnswer(exercise),
            ...mistakeList(exercise).map((mistake) => responseWith(exercise, mistake.answer)),
          ].filter((response) => response !== null);
          for (const response of responses) {
            const frame = coachFrame(exercise, response);
            const rendered = showableExplanation(template, frame);
            if (!rendered) continue;
            shown += 1;
            for (const text of [rendered.what, rendered.image, rendered.tip]) {
              expect(foreignNumbers(text, frame.allowed)).toEqual([]);
            }
          }
        }
      }
    }
    expect(shown).toBeGreaterThan(1000);
  });
});
