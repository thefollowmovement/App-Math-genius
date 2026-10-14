/** Seeded pseudo-random numbers: the same seed always rebuilds the same exercise. */
export interface Rng {
  /** Float in [0, 1). */
  next(): number;
  /** Integer between `min` and `max`, both included. */
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  /** `count` distinct items, in random order. */
  sample<T>(items: readonly T[], count: number): T[];
  shuffle<T>(items: readonly T[]): T[];
  chance(probability: number): boolean;
}

/** mulberry32: small, fast and good enough to vary exercises. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));

  const shuffle = <T>(items: readonly T[]): T[] => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = int(0, i);
      [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
    }
    return copy;
  };

  return {
    next,
    int,
    pick: (items) => {
      if (items.length === 0) throw new RangeError('pick from an empty list');
      return items[int(0, items.length - 1)] as (typeof items)[number];
    },
    sample: (items, count) => {
      if (count > items.length) throw new RangeError('sample larger than the list');
      return shuffle(items).slice(0, count);
    },
    shuffle,
    chance: (probability) => next() < probability,
  };
}
