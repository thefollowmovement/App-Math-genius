/* eslint-disable @typescript-eslint/no-require-imports -- Jest mocks are loaded with require. */
import 'react-native-gesture-handler/jestSetup';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock'),
);

// Sounds play nowhere in tests.
jest.mock('expo-audio', () => ({
  createAudioPlayer: () => ({
    volume: 1,
    play: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
    remove: jest.fn(),
  }),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));
