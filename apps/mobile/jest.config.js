/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@expo/ui$': '<rootDir>/jest/expo-ui.tsx',
  },
  // The first render in a cold worker (empty transform cache, as in CI) can exceed the default 5 s.
  testTimeout: 20_000,
};
