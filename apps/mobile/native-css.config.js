/**
 * Options for NativeWind's native CSS compiler (react-native-css).
 * Shared by Metro and the native style tests so both compile global.css the same way.
 */
module.exports = {
  // As in Expo's with-tailwindcss example, Tailwind's root variables (spacing, containers, text sizes)
  // stay variables resolved on device, alongside the --theme-* ones set by ThemeProvider.
  inlineVariables: false,
  // Same rem as browsers, so spacing and text sizes match on every platform.
  inlineRem: 16,
};
