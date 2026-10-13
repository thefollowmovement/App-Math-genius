const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const nativeCssOptions = require('./native-css.config');

const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config, {
  ...nativeCssOptions,
  // Components get `className` support from @math-genius/ui primitives, not from patched imports.
  globalClassNamePolyfill: false,
  disableTypeScriptGeneration: true,
});
