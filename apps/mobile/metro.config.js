const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config, {
  // Theme variables are set at runtime by ThemeProvider, so they must not be inlined at build time.
  inlineVariables: false,
  // Components get `className` support from @math-genius/ui primitives, not from patched imports.
  globalClassNamePolyfill: false,
  disableTypeScriptGeneration: true,
  // Same rem as browsers, so spacing and text sizes match on every platform.
  inlineRem: 16,
});
