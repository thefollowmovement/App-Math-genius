import { readFileSync } from 'node:fs';

import { build } from 'esbuild';

import { SERVER_BUNDLE, serverBundleOptions } from '../scripts/server-bundle';

describe('engine bundle of the award-session Edge Function', () => {
  it('matches the engine (run `pnpm functions:bundle` after changing it)', async () => {
    const result = await build({ ...serverBundleOptions, write: false, outfile: SERVER_BUNDLE });
    const fresh = result.outputFiles?.[0]?.text;
    expect(fresh).toBeDefined();
    expect(readFileSync(SERVER_BUNDLE, 'utf8')).toBe(fresh);
    // Deno loads it without resolving anything.
    expect(fresh).not.toMatch(/^\s*import\s/m);
  });
});
