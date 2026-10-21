import type { NextConfig } from 'next';

const config: NextConfig = {
  // The domain packages are TypeScript sources of the monorepo.
  transpilePackages: [
    '@math-genius/curriculum',
    '@math-genius/exercise-engine',
    '@math-genius/shared',
  ],
  reactStrictMode: true,
  poweredByHeader: false,
};

export default config;
