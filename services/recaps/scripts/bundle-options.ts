import { join } from 'node:path';

import type { BuildOptions } from 'esbuild';

const root = join(__dirname, '..', '..', '..');

/** Where the recaps Edge Function finds the recaps, gateway and engine included, as one module. */
export const RECAPS_BUNDLE = join(root, 'supabase', 'functions', '_shared', 'recaps.js');

/** Deno runs it as is: one ES module, nothing left to resolve. */
export const recapsBundleOptions: BuildOptions = {
  entryPoints: [join(__dirname, '..', 'src', 'index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  mainFields: ['module', 'main'],
  target: 'es2022',
  legalComments: 'none',
  banner: {
    js: '// Generated from services/recaps/src/index.ts by `pnpm functions:bundle`. Do not edit.',
  },
};
