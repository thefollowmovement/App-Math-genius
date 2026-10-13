import { CHUNK_LENGTH, createChunkedStorage, type KeyValueStorage } from './chunked-storage';

function memoryStore() {
  const entries = new Map<string, string>();
  const store: KeyValueStorage = {
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async (key, value) => void entries.set(key, value),
    removeItem: async (key) => void entries.delete(key),
  };
  return { entries, store };
}

describe('createChunkedStorage', () => {
  it('round-trips values longer than one chunk', async () => {
    const { entries, store } = memoryStore();
    const storage = createChunkedStorage(store);
    const value = 'é'.repeat(CHUNK_LENGTH * 2 + 10);

    await storage.setItem('session', value);

    expect(await storage.getItem('session')).toBe(value);
    for (const [key, chunk] of entries) {
      if (key !== 'session.count') expect(chunk.length).toBeLessThanOrEqual(CHUNK_LENGTH);
    }
  });

  it('drops leftover chunks when a value shrinks, and everything on removal', async () => {
    const { entries, store } = memoryStore();
    const storage = createChunkedStorage(store);

    await storage.setItem('session', 'x'.repeat(CHUNK_LENGTH * 3));
    await storage.setItem('session', 'court');
    expect(await storage.getItem('session')).toBe('court');
    expect([...entries.keys()].sort()).toEqual(['session.0', 'session.count']);

    await storage.removeItem('session');
    expect(entries.size).toBe(0);
    expect(await storage.getItem('session')).toBeNull();
  });
});
