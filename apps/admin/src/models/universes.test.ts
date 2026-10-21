import { addMonths, daysBetween, isIsoDate } from './dates';
import {
  draftOf,
  gradesLabel,
  reviewState,
  slugOf,
  universeProblems,
  universeRecord,
  type UniverseRow,
} from './universes';

const MINECRAFT: UniverseRow = {
  id: 'minecraft',
  name: 'Minecraft',
  category: 'game',
  grades: ['CP', 'CE1', 'CE2', 'CM1', 'CM2', '6e', '5e', '4e', '3e'],
  pegi: 7,
  status: 'active',
  vocabulary: { words: ['blocs', 'pioche'], images: ['une tour de blocs'] },
  review_at: '2027-01-20',
  created_at: '2026-10-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
};

describe('a reference of the catalogue', () => {
  it('gets a stable id from its name', () => {
    expect(slugOf('Zelda : Tears of the Kingdom')).toBe('zelda-tears-of-the-kingdom');
    expect(slugOf('Pokémon Écarlate')).toBe('pokemon-ecarlate');
    expect(slugOf('  ')).toBe('');
  });

  it('starts « en test », for every grade, with a review in 3 months', () => {
    const draft = draftOf(null, '2026-10-20', { name: 'Zelda', category: 'game' });
    expect(draft).toMatchObject({ id: 'zelda', status: 'testing', reviewAt: '2027-01-20' });
    expect(draft.grades).toHaveLength(9);
  });

  it('is edited as it is stored, and stored as it was edited', () => {
    const draft = draftOf(MINECRAFT, '2026-10-20');
    expect(draft).toMatchObject({ pegi: '7', words: 'blocs, pioche', images: 'une tour de blocs' });
    expect(universeRecord({ ...draft, words: 'blocs, , pioche, blocs' })).toMatchObject({
      pegi: 7,
      vocabulary: { words: ['blocs', 'pioche'], images: ['une tour de blocs'] },
    });
    expect(universeRecord({ ...draft, words: '', images: '', pegi: '' })).toMatchObject({
      pegi: null,
      vocabulary: {},
    });
  });

  it('follows the age rules of the database', () => {
    const draft = draftOf(MINECRAFT, '2026-10-20');
    expect(universeProblems(draft)).toEqual([]);
    expect(universeProblems({ ...draft, pegi: '18' })).toEqual(['pegiBanned']);
    expect(universeProblems({ ...draft, pegi: '12' })).toEqual(['pegi12']);
    expect(universeProblems({ ...draft, pegi: '12', grades: ['5e', '4e'] })).toEqual([]);
    expect(universeProblems({ ...draft, id: 'Mine Craft', name: '', grades: [] })).toEqual([
      'id',
      'name',
      'grades',
    ]);
    expect(universeProblems({ ...draft, reviewAt: '2027-02-30' })).toEqual(['review']);
  });

  it('says when its review is late or due soon', () => {
    expect(reviewState('2026-10-10', '2026-10-20')).toEqual({ kind: 'overdue', days: 10 });
    expect(reviewState('2026-10-30', '2026-10-20')).toEqual({ kind: 'soon', days: 10 });
    expect(reviewState('2027-01-20', '2026-10-20').kind).toBe('ok');
  });

  it('shows its grades as a range', () => {
    expect(gradesLabel(MINECRAFT.grades)).toBe('CP → 3e');
    expect(gradesLabel(['5e', '4e', '3e'])).toBe('5e → 3e');
    expect(gradesLabel(['CP', 'CM1'])).toBe('CP, CM1');
    expect(gradesLabel(['CM2'])).toBe('CM2');
  });
});

describe('dates', () => {
  it('adds months without overflowing the end of a month', () => {
    expect(addMonths('2026-11-30', 3)).toBe('2027-02-28');
    expect(addMonths('2026-10-20', 3)).toBe('2027-01-20');
    expect(daysBetween('2026-10-20', '2026-10-30')).toBe(10);
    expect(isIsoDate('2026-02-29')).toBe(false);
  });
});
