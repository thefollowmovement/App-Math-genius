import * as SecureStore from 'expo-secure-store';

import { createChunkedStorage } from './chunked-storage';

/** Session and device data, kept in the Keychain (iOS) or the Keystore (Android). */
export const secureStorage = createChunkedStorage({
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
});
