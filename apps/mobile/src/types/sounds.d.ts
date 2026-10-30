// Bundled sounds: Metro turns an imported sound into an asset id.
declare module '*.wav' {
  const source: number;
  export default source;
}
