import { canSee, homeFor, pageOf, pagesFor } from './navigation';

describe('the back-office’s pages by role', () => {
  it('shows the super-admin everything', () => {
    expect(pagesFor('super_admin')).toHaveLength(8);
    expect(canSee('super_admin', 'equipe')).toBe(true);
  });

  it('gives editors the contents, prompts and trends, never the team or the log', () => {
    expect(pagesFor('editor')).toEqual([
      'tendances',
      'radar',
      'questionnaire',
      'relecture',
      'prompts',
      'ia',
    ]);
    expect(canSee('editor', 'journal')).toBe(false);
  });

  it('gives moderators the review and the « Autre » answers', () => {
    expect(pagesFor('moderator')).toEqual(['radar', 'relecture']);
    expect(homeFor('moderator')).toBe('radar');
  });

  it('gives nothing to an account without a role', () => {
    expect(pagesFor(null)).toEqual([]);
    expect(homeFor(null)).toBeNull();
  });

  it('finds the page of an address', () => {
    expect(pageOf('/relecture')).toBe('relecture');
    expect(pageOf('/tendances/minecraft')).toBe('tendances');
    expect(pageOf('/')).toBeNull();
  });
});
