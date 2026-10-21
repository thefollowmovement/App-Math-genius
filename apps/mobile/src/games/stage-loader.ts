import { lazy } from 'react';

import { loadStage } from './load-stage';

let loading: ReturnType<typeof loadStage> | null = null;

/** Loads the game's canvas once (and CanvasKit on the web), however many rounds are played. */
export const preloadStage = () => {
  loading ??= loadStage();
  return loading;
};

export const LazyStage = lazy(preloadStage);
