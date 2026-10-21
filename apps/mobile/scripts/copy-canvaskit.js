// Skia on the web runs on CanvasKit: its WebAssembly file is served next to the app (public/), as
// in Expo's with-skia example. Run after every install (postinstall); the copy is not committed.
const fs = require('fs');
const path = require('path');

const publicFolder = path.join(__dirname, '..', 'public');
fs.mkdirSync(publicFolder, { recursive: true });
const wasm = require.resolve('canvaskit-wasm/bin/full/canvaskit.wasm', {
  paths: [path.dirname(require.resolve('@shopify/react-native-skia/package.json'))],
});
fs.copyFileSync(wasm, path.join(publicFolder, 'canvaskit.wasm'));
