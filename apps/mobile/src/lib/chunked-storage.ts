/** Async key-value store, the shape Supabase auth and Zustand persistence expect. */
export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * iOS Keychain entries should stay under 2 KB. 512 characters stay under that limit even when
 * every character takes 4 bytes in UTF-8.
 */
export const CHUNK_LENGTH = 512;

/**
 * Splits values across several entries of `store`: `<key>.count` holds the number of chunks and
 * `<key>.0`, `<key>.1`… hold the chunks.
 */
export function createChunkedStorage(store: KeyValueStorage): KeyValueStorage {
  const countKey = (key: string) => `${key}.count`;
  const chunkKey = (key: string, index: number) => `${key}.${index}`;

  async function readCount(key: string): Promise<number> {
    const count = Number(await store.getItem(countKey(key)));
    return Number.isInteger(count) && count > 0 ? count : 0;
  }

  async function removeChunks(key: string, from: number, to: number) {
    for (let index = from; index < to; index++) {
      await store.removeItem(chunkKey(key, index));
    }
  }

  return {
    async getItem(key) {
      const count = await readCount(key);
      if (count === 0) return null;

      const chunks: string[] = [];
      for (let index = 0; index < count; index++) {
        const chunk = await store.getItem(chunkKey(key, index));
        if (chunk === null) return null;
        chunks.push(chunk);
      }
      return chunks.join('');
    },

    async setItem(key, value) {
      const previousCount = await readCount(key);
      const count = Math.max(1, Math.ceil(value.length / CHUNK_LENGTH));

      for (let index = 0; index < count; index++) {
        await store.setItem(
          chunkKey(key, index),
          value.slice(index * CHUNK_LENGTH, (index + 1) * CHUNK_LENGTH),
        );
      }
      await store.setItem(countKey(key), String(count));
      await removeChunks(key, count, previousCount);
    },

    async removeItem(key) {
      const count = await readCount(key);
      await store.removeItem(countKey(key));
      await removeChunks(key, 0, count);
    },
  };
}
