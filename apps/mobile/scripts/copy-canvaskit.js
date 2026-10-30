// Skia draws with CanvasKit on the web: its WebAssembly file is served from public/ (copied at
// install, never committed). The app loads it only when a game opens (src/games/load-stage.web.ts).
// Run by `postinstall`, from apps/mobile.
const fs = require('fs');
const path = require('path');

const publicFolder = path.join(process.cwd(), 'public');
fs.mkdirSync(publicFolder, { recursive: true });
const wasm = require.resolve('canvaskit-wasm/bin/full/canvaskit.wasm', {
  paths: [path.dirname(require.resolve('@shopify/react-native-skia/package.json'))],
});
fs.copyFileSync(wasm, path.join(publicFolder, 'canvaskit.wasm'));
