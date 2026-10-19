// Bundled pictures: Metro turns an imported image into an asset id (and picks its @2x or @3x).
declare module '*.webp' {
  const source: number;
  export default source;
}
