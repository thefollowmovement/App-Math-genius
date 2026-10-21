import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

/**
 * On the web, Skia draws with CanvasKit (WebAssembly, served from public/ by
 * scripts/copy-canvaskit.js): it is loaded before the first canvas, and only when a game opens.
 */
export const loadStage = async () => {
  await LoadSkiaWeb({ locateFile: (file: string) => `/${file}` });
  return import('./stage');
};
