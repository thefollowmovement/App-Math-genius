import { build } from 'esbuild';

import { SERVER_BUNDLE, serverBundleOptions } from './server-bundle';

void build({ ...serverBundleOptions, outfile: SERVER_BUNDLE }).then(() =>
  console.log(`Wrote ${SERVER_BUNDLE}`),
);
