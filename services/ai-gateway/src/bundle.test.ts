import { readFileSync } from 'node:fs';

import { build } from 'esbuild';

import { GATEWAY_BUNDLE, gatewayBundleOptions } from '../scripts/bundle-options';

describe('gateway bundle of the ai-gateway Edge Function', () => {
  it('matches the gateway (run `pnpm functions:bundle` after changing it or the engine)', async () => {
    const result = await build({ ...gatewayBundleOptions, write: false, outfile: GATEWAY_BUNDLE });
    const fresh = result.outputFiles?.[0]?.text;
    expect(fresh).toBeDefined();
    expect(readFileSync(GATEWAY_BUNDLE, 'utf8')).toBe(fresh);
    // Deno loads it without resolving anything; Zod stays out.
    expect(fresh).not.toMatch(/^\s*import\s/m);
    expect(fresh).not.toContain('ZodError');
  });
});
