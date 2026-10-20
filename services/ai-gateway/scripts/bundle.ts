import { build } from 'esbuild';

import { GATEWAY_BUNDLE, gatewayBundleOptions } from './bundle-options';

void build({ ...gatewayBundleOptions, outfile: GATEWAY_BUNDLE }).then(() =>
  console.log(`Wrote ${GATEWAY_BUNDLE}`),
);
