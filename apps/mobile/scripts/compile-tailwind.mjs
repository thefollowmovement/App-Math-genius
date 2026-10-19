// Prints src/global.css compiled by Tailwind (same plugin as postcss.config.mjs).
// This is the CSS Metro hands to NativeWind before compiling it to native styles.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/postcss';
import postcss from 'postcss';

const appRoot = fileURLToPath(new URL('..', import.meta.url));
const input = fileURLToPath(new URL('../src/global.css', import.meta.url));

const { css } = await postcss([tailwindcss({ base: appRoot })]).process(
  readFileSync(input, 'utf8'),
  {
    from: input,
  },
);

process.stdout.write(css);
