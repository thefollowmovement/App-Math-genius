/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest/setup.ts'],
  // Worklets (Reanimated 4) runs its JavaScript implementation in tests.
  resolver: 'react-native-worklets/jest/resolver',
  moduleNameMapper: {
    '^@expo/ui$': '<rootDir>/jest/expo-ui.tsx',
  },
  // The first render in a cold worker (empty transform cache, as in CI) can exceed the default 5 s.
  testTimeout: 20_000,
};
