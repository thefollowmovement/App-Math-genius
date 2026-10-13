import type { KeyValueStorage } from './chunked-storage';

/** The browser has no keychain: the session lives in localStorage, as Supabase does by default. */
export const secureStorage: KeyValueStorage = {
  getItem: async (key) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: async (key, value) => globalThis.localStorage?.setItem(key, value),
  removeItem: async (key) => globalThis.localStorage?.removeItem(key),
};
