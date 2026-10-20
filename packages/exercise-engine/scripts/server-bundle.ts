import { join } from 'node:path';

import type { BuildOptions } from 'esbuild';

const root = join(__dirname, '..', '..', '..');

/** Where the Edge Functions find the engine, as a single dependency-free module. */
export const SERVER_BUNDLE = join(root, 'supabase', 'functions', '_shared', 'engine.js');

/** Deno runs it as is: one ES module, nothing left to resolve. */
export const serverBundleOptions: BuildOptions = {
  entryPoints: [join(__dirname, '..', 'src', 'server.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  mainFields: ['module', 'main'],
  target: 'es2022',
  legalComments: 'none',
  banner: {
    js: '// Generated from packages/exercise-engine/src/server.ts by `pnpm functions:bundle`. Do not edit.',
  },
};
