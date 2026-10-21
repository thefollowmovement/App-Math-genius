import { readFileSync } from 'node:fs';

import { build } from 'esbuild';

import { RECAPS_BUNDLE, recapsBundleOptions } from '../scripts/bundle-options';

describe('recaps bundle of the recaps Edge Function', () => {
  it('matches the recaps (run `pnpm functions:bundle` after changing them, the gateway or the engine)', async () => {
    const result = await build({ ...recapsBundleOptions, write: false, outfile: RECAPS_BUNDLE });
    const fresh = result.outputFiles?.[0]?.text;
    expect(fresh).toBeDefined();
    expect(readFileSync(RECAPS_BUNDLE, 'utf8')).toBe(fresh);
    // Deno loads it without resolving anything; Zod stays out.
    expect(fresh).not.toMatch(/^\s*import\s/m);
    expect(fresh).not.toContain('ZodError');
  });
});
