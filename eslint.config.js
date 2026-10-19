const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['**/dist/', '**/.expo/', '**/coverage/', 'supabase/.temp/'],
  },
  {
    settings: {
      'import/resolver': {
        typescript: { project: ['apps/*/tsconfig.json', 'packages/*/tsconfig.json'] },
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    // Domain packages stay framework-free so they run in the app, in tests and on the server.
    files: ['packages/{shared,curriculum,exercise-engine}/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'react/*', 'expo', 'expo-*', '@math-genius/ui'],
              message:
                'Domain packages must stay pure TypeScript (no React, React Native or Expo).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/mobile/src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['View', 'Text', 'Pressable', 'ScrollView'],
              message: 'Use the className-aware primitives from @math-genius/ui.',
            },
          ],
        },
      ],
    },
  },
]);
