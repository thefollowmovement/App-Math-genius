import { join } from 'node:path';

import type { BuildOptions } from 'esbuild';

const root = join(__dirname, '..', '..', '..');

/** Where the ai-gateway Edge Function finds the gateway, engine included, as one module. */
export const GATEWAY_BUNDLE = join(root, 'supabase', 'functions', '_shared', 'ai-gateway.js');

/** Deno runs it as is: one ES module, nothing left to resolve. */
export const gatewayBundleOptions: BuildOptions = {
  entryPoints: [join(__dirname, '..', 'src', 'index.ts')],
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  mainFields: ['module', 'main'],
  target: 'es2022',
  legalComments: 'none',
  banner: {
    js: '// Generated from services/ai-gateway/src/index.ts by `pnpm functions:bundle`. Do not edit.',
  },
};
