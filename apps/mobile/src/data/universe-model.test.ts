import { catalogue } from '@/test-utils/universes';

import {
  answersOf,
  answersPayload,
  chosenOf,
  questionsFor,
  toggled,
  universeOffer,
} from './universe-model';

describe('« Ton univers »', () => {
  it('asks the questions in order, with the choices allowed for the grade', () => {
    const cm1 = questionsFor(catalogue, 'CM1');
    expect(cm1.map((question) => question.id)).toEqual(['games', 'music']);
    expect(cm1[0]?.options.map((option) => option.name)).toEqual(['Minecraft', 'Roblox']);
    expect(cm1[1]?.options.map((option) => option.name)).toEqual(['Pop']);
    expect(cm1.every((question) => !question.allowsOther)).toBe(true);

    const fifth = questionsFor(catalogue, '5e');
    expect(fifth[0]?.options.map((option) => option.name)).toEqual([
      'Minecraft',
      'Roblox',
      'Fortnite',
    ]);
    expect(fifth.every((question) => question.allowsOther)).toBe(true);
  });

  it('starts from the child’s answers and sends every question shown', () => {
    const answers = answersOf({
      chosen: [
        { universe_id: 'minecraft', question_id: 'games', source: 'questionnaire' },
        { universe_id: 'pop', question_id: 'music', source: 'parent' },
      ],
      others: [{ question_id: 'music', answer: 'Du rock', status: 'pending' }],
    });
    const questions = questionsFor(catalogue, 'CM1');
    const changed = toggled(toggled(answers, 'games', 'roblox'), 'music', 'pop');
    expect(answersPayload(questions, changed)).toEqual([
      { question: 'games', universes: ['minecraft', 'roblox'], other: '' },
      // No free answer before collège; a choice removed is sent removed.
      { question: 'music', universes: [], other: '' },
    ]);
    expect(chosenOf(questions, changed).map((option) => option.name)).toEqual([
      'Minecraft',
      'Roblox',
    ]);
  });

  it('leaves out a universe no longer offered to the grade', () => {
    const answers = answersOf({
      chosen: [{ universe_id: 'rap-fr', question_id: 'music', source: 'questionnaire' }],
      others: [],
    });
    const payload = answersPayload(questionsFor(catalogue, 'CM2'), answers);
    expect(payload[1]).toEqual({ question: 'music', universes: [], other: '' });
  });

  it('is offered once the parent agreed, then every 3 months', () => {
    const now = new Date(2026, 10, 20);
    const consent = '2026-10-01T00:00:00Z';
    expect(
      universeOffer({ personalization_consent_at: null, universe_asked_at: null }, now),
    ).toBeNull();
    expect(
      universeOffer({ personalization_consent_at: consent, universe_asked_at: null }, now),
    ).toBe('first');
    expect(
      universeOffer({ personalization_consent_at: consent, universe_asked_at: consent }, now),
    ).toBeNull();
    expect(
      universeOffer(
        { personalization_consent_at: consent, universe_asked_at: '2026-08-01T00:00:00Z' },
        now,
      ),
    ).toBe('again');
  });
});
