import { build } from 'esbuild';

import { RECAPS_BUNDLE, recapsBundleOptions } from './bundle-options';

void build({ ...recapsBundleOptions, outfile: RECAPS_BUNDLE }).then(() =>
  console.log(`Wrote ${RECAPS_BUNDLE}`),
);
