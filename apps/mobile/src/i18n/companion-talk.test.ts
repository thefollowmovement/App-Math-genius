import type { Slot } from '@math-genius/exercise-engine';

import { strings } from '@/i18n';
import type { CompanionTalk } from '@/i18n/fr';

import { companionLine, inSpecialty, onFire, type TalkContext } from './companion-talk';

const talk = strings.companions.talk;

const context = (overrides: Partial<TalkContext> & { skill?: string } = {}): TalkContext => {
  const { skill = 'ce2.tables-multiplication', ...rest } = overrides;
  return {
    exercise: {
      skill: skill as TalkContext['exercise']['skill'],
      seed: 0,
      hint: 'Compte de 7 en 7.',
    },
    slot: 'current' as Slot,
    combo: 0,
    reminder: false,
    ...rest,
  };
};

describe('companion talk', () => {
  it('knows when an exercise is a companion’s specialty', () => {
    expect(inSpecialty('geometry', context({ skill: '6e.angles-degres' }))).toBe(true);
    expect(inSpecialty('geometry', context({ skill: 'cm1.perimetre' }))).toBe(true);
    expect(inSpecialty('geometry', context({ skill: 'cm2.triangles-particuliers' }))).toBe(true);
    expect(inSpecialty('geometry', context({ skill: 'ce2.longueurs-conversions' }))).toBe(false);
    expect(inSpecialty('geometry', context())).toBe(false);
    expect(inSpecialty('fractions', context({ skill: 'cm1.fractions-simples' }))).toBe(true);
    expect(inSpecialty('fractions', context({ skill: '6e.fraction-d-une-quantite' }))).toBe(true);
    expect(inSpecialty('speed', context({ slot: 'automatism' }))).toBe(true);
    expect(inSpecialty('fire', context({ combo: 2 }))).toBe(false);
    expect(inSpecialty('fire', context({ combo: 3 }))).toBe(true);
    expect(inSpecialty('gentle', context())).toBe(false);
  });

  it('offers the hint and encourages in its own words, its specialty’s on its exercises', () => {
    expect(companionLine('dragon', 'ask', context())).toBe(talk.dragon.ask[0]);
    expect(companionLine('dragon', 'ask', context({ skill: '6e.angles-degres' }))).toBe(
      talk.dragon.special.ask[0],
    );
    expect(companionLine('dragon', 'encourage', context({ skill: '6e.angles-degres' }))).toBe(
      talk.dragon.special.encourage[0],
    );
    expect(companionLine('lapin', 'ask', context({ slot: 'automatism' }))).toBe(
      talk.lapin.special.ask[0],
    );
    expect(companionLine('chat', 'encourage', context())).toBe(talk.chat.encourage[0]);
    // The seed of the exercise picks the line.
    expect(
      companionLine('chat', 'encourage', {
        ...context(),
        exercise: { ...context().exercise, seed: 1 },
      }),
    ).toBe(talk.chat.encourage[1]);
  });

  it('gives the hint, as a reminder after errors in a row', () => {
    expect(companionLine('hibou', 'hint', context())).toBe(
      `${talk.hibou.hint}\u00a0: Compte de 7 en 7.`,
    );
    expect(companionLine('licorne', 'hint', context({ skill: 'cm1.fractions-simples' }))).toBe(
      `${talk.licorne.special.hint}\u00a0: Compte de 7 en 7.`,
    );
    expect(companionLine('hibou', 'hint', context({ reminder: true }))).toBe(
      `${strings.practice.reminder}\u00a0: Compte de 7 en 7.`,
    );
  });

  it('lets the hero cheer right answers, except Phénix on fire', () => {
    expect(companionLine('renard', 'correct', context({ combo: 5 }))).toBeNull();
    expect(companionLine('phenix', 'correct', context({ combo: 2 }))).toBeNull();
    expect(companionLine('phenix', 'correct', context({ combo: 3 }))).toBe(talk.phenix.fire[0]);
    expect(companionLine('phenix', 'ask', context({ combo: 4 }))).toBe(talk.phenix.special.ask[0]);
    expect(onFire('phenix', context({ combo: 3 }))).toBe(true);
    expect(onFire('dragon', context({ combo: 10 }))).toBe(false);
  });

  it('never reproaches', () => {
    const lines: CompanionTalk[] = Object.values(talk);
    for (const { encourage, special } of lines) {
      for (const line of [...encourage, ...(special?.encourage ?? [])]) {
        expect(line).not.toMatch(/nul|mauvais|raté\b|dommage/i);
      }
    }
  });
});
