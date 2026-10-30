/**
 * Small helpers for the scenes' worlds, run in worklets on the UI thread (and as plain functions in
 * the tests): a seeded random generator and simple collisions.
 */

/** Seeded random numbers (mulberry32): the same seed always gives the same scene. */
export function random(seed: number): { value: number; seed: number } {
  'worklet';
  const next = (seed + 0x6d2b79f5) | 0;
  let r = Math.imul(next ^ (next >>> 15), 1 | next);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return { value: ((r ^ (r >>> 14)) >>> 0) / 4294967296, seed: next };
}

export type Circle = { x: number; y: number; r: number };
export type Box = { x: number; y: number; width: number; height: number };

export function circlesTouch(a: Circle, b: Circle): boolean {
  'worklet';
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const reach = a.r + b.r;
  return dx * dx + dy * dy <= reach * reach;
}

export function circleTouchesBox(circle: Circle, box: Box): boolean {
  'worklet';
  const nearestX = Math.max(box.x, Math.min(circle.x, box.x + box.width));
  const nearestY = Math.max(box.y, Math.min(circle.y, box.y + box.height));
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy <= circle.r * circle.r;
}

export function clamp(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(max, Math.max(min, value));
}

/** Moves `from` toward `to` by at most `step`. */
export function approach(from: number, to: number, step: number): number {
  'worklet';
  return from < to ? Math.min(to, from + step) : Math.max(to, from - step);
}
