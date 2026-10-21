import { changesOf } from './audit';

describe('the change log', () => {
  it('shows what changed, never the timestamps', () => {
    expect(
      changesOf(
        { id: 'roblox', status: 'active', grades: ['CP'], updated_at: 'a' },
        { id: 'roblox', status: 'retired', grades: ['CP'], updated_at: 'b' },
      ),
    ).toEqual([{ field: 'status', before: 'active', after: 'retired' }]);
  });

  it('shows every field of an addition', () => {
    expect(changesOf(null, { word: 'nul', created_by: null })).toEqual([
      { field: 'word', before: null, after: 'nul' },
    ]);
    expect(changesOf({ vocabulary: { words: ['a'] } }, null)).toEqual([
      { field: 'vocabulary', before: '{"words":["a"]}', after: null },
    ]);
  });
});
