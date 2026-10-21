import { approach, circlesTouch, random } from '../kit/physics';
import {
  IDLE,
  NO_EVENTS,
  speedOf,
  type SceneEvent,
  type SceneFeed,
  type SceneInput,
  type SceneSettings,
  type Mood,
  type WorldBase,
} from '../kit/scene';

/**
 * Pluie de gemmes: the companion slides left and right under a rain of croquettes (a few points),
 * gems carrying the answers and bombs. The right gem is a big bonus; a wrong one turns into a bomb
 * as it is caught. A bomb costs a heart.
 */

export type DropKind = 'gem' | 'croquette' | 'bomb';
/** fall; caught (a gem waiting for the engine's verdict); won; boom (a bomb, or a wrong gem). */
export type DropPhase = 'fall' | 'caught' | 'won' | 'boom' | 'gone';

export type Drop = {
  kind: DropKind;
  /** The answer a gem carries; -1 otherwise. */
  index: number;
  /** The question a gem belongs to. */
  key: number;
  x: number;
  y: number;
  phase: DropPhase;
  t: number;
};

export type GemRainWorld = WorldBase & {
  width: number;
  height: number;
  speed: number;
  time: number;
  seed: number;
  key: number;
  /** The companion. */
  x: number;
  drops: Drop[];
  /** Gems of the current question still to fall, in order. */
  queue: number[];
  nextGem: number;
  nextCroquette: number;
  nextBomb: number;
  verdict: number;
  mood: Mood;
};

export const GEM_RAIN = {
  ground: 0.8,
  companionSize: 0.24,
  /** The catching reach, as a share of the width. */
  reach: 0.1,
  dropSize: 0.15,
  /** Fractions of the height per second, growing a little over the round. */
  fall: 0.2,
  fallGrowth: 0.5,
  /** Fractions of the width per second. */
  slide: 1.6,
  gemEveryMs: 700,
  waveRestMs: 900,
  croquetteMs: [1100, 2000],
  bombMs: [2600, 4200],
  firstBombMs: 5000,
  columns: [0.18, 0.5, 0.82],
  outcomeMs: 700,
} as const;

function rand(world: GemRainWorld): number {
  'worklet';
  const next = random(world.seed);
  world.seed = next.seed;
  return next.value;
}

function between(world: GemRainWorld, [low, high]: readonly [number, number]) {
  'worklet';
  return low + (high - low) * rand(world);
}

export function createGemRain(settings: SceneSettings, seed: number): GemRainWorld {
  'worklet';
  const world: GemRainWorld = {
    events: NO_EVENTS,
    width: settings.width,
    height: settings.height,
    speed: speedOf(settings),
    time: 0,
    seed,
    key: 0,
    x: settings.width / 2,
    drops: [],
    queue: [],
    nextGem: GEM_RAIN.waveRestMs,
    nextCroquette: 0,
    nextBomb: GEM_RAIN.firstBombMs,
    verdict: 0,
    mood: IDLE,
  };
  world.nextCroquette = between(world, GEM_RAIN.croquetteMs);
  return world;
}

/** The answers fall in random order, a gem in each column. */
function newWave(world: GemRainWorld, count: number) {
  'worklet';
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand(world) * (i + 1));
    const swap = order[i] ?? 0;
    order[i] = order[j] ?? 0;
    order[j] = swap;
  }
  world.queue = order;
}

function columnX(world: GemRainWorld, column: number) {
  'worklet';
  return world.width * (GEM_RAIN.columns[column % GEM_RAIN.columns.length] ?? 0.5);
}

export const fallSpeed = (world: GemRainWorld) => {
  'worklet';
  const growth = 1 + GEM_RAIN.fallGrowth * Math.min(1, world.time / 90_000);
  return GEM_RAIN.fall * world.height * world.speed * growth;
};

export function stepGemRain(
  previous: GemRainWorld,
  dt: number,
  input: SceneInput,
  feed: SceneFeed,
): GemRainWorld {
  'worklet';
  const world: GemRainWorld = {
    ...previous,
    drops: previous.drops.map((drop) => ({ ...drop })),
    queue: [...previous.queue],
    events: NO_EVENTS,
  };
  const events: SceneEvent[] = [];
  const { width, height } = world;
  world.time += dt;

  // A new question: the gems of the last one vanish, a wave of the new one comes.
  if (feed.key !== world.key && feed.labels.length > 0) {
    world.key = feed.key;
    for (const drop of world.drops) {
      if (drop.kind === 'gem' && drop.phase === 'fall') drop.phase = 'gone';
    }
    newWave(world, feed.labels.length);
    world.nextGem = GEM_RAIN.waveRestMs;
  }

  const verdict = feed.verdict;
  if (verdict && verdict.serial !== world.verdict) {
    world.verdict = verdict.serial;
    world.mood = { kind: verdict.correct ? 'joy' : 'sad', since: world.time };
    for (const drop of world.drops) {
      if (drop.kind === 'gem' && drop.phase === 'caught' && drop.key === verdict.key) {
        drop.phase = verdict.correct ? 'won' : 'boom';
        drop.t = 0;
      }
    }
  }

  // The companion follows the finger.
  if (input.x !== null) {
    world.x = approach(world.x, input.x, GEM_RAIN.slide * width * world.speed * (dt / 1000));
  }
  world.x = Math.min(width * 0.92, Math.max(width * 0.08, world.x));

  // What falls next.
  world.nextGem -= dt;
  if (world.nextGem <= 0 && world.queue.length > 0 && feed.labels.length > 0) {
    const index = world.queue.shift() ?? 0;
    world.drops.push({
      kind: 'gem',
      index,
      key: world.key,
      x: columnX(world, Math.floor(rand(world) * 3)),
      y: -height * 0.05,
      phase: 'fall',
      t: 0,
    });
    world.nextGem = GEM_RAIN.gemEveryMs / world.speed;
  }
  const gemsFalling = world.drops.some((drop) => drop.kind === 'gem' && drop.phase !== 'gone');
  if (world.queue.length === 0 && !gemsFalling && feed.labels.length > 0 && world.nextGem <= 0) {
    // Nobody caught the right gem: the same answers fall again.
    newWave(world, feed.labels.length);
    world.nextGem = GEM_RAIN.waveRestMs;
  }
  world.nextCroquette -= dt;
  if (world.nextCroquette <= 0) {
    world.drops.push({
      kind: 'croquette',
      index: -1,
      key: 0,
      x: width * (0.1 + 0.8 * rand(world)),
      y: -height * 0.05,
      phase: 'fall',
      t: 0,
    });
    world.nextCroquette = between(world, GEM_RAIN.croquetteMs);
  }
  world.nextBomb -= dt;
  if (world.nextBomb <= 0) {
    world.drops.push({
      kind: 'bomb',
      index: -1,
      key: 0,
      x: width * (0.1 + 0.8 * rand(world)),
      y: -height * 0.05,
      phase: 'fall',
      t: 0,
    });
    world.nextBomb = between(world, GEM_RAIN.bombMs) / world.speed;
  }

  const catcher = {
    x: world.x,
    y: height * GEM_RAIN.ground - width * GEM_RAIN.companionSize * 0.15,
    r: width * GEM_RAIN.reach,
  };
  const fall = fallSpeed(world) * (dt / 1000);
  const dropRadius = width * GEM_RAIN.dropSize * 0.35;
  for (const drop of world.drops) {
    drop.t += dt;
    if (drop.phase !== 'fall') {
      if (drop.phase !== 'caught' && drop.t >= GEM_RAIN.outcomeMs) drop.phase = 'gone';
      continue;
    }
    drop.y += drop.kind === 'croquette' ? fall * 0.85 : fall;
    if (drop.y > height + dropRadius) {
      drop.phase = 'gone';
      continue;
    }
    if (!circlesTouch(catcher, { x: drop.x, y: drop.y, r: dropRadius })) continue;
    drop.t = 0;
    if (drop.kind === 'croquette') {
      drop.phase = 'gone';
      events.push({ type: 'points', points: 10 });
      events.push({ type: 'sound', sound: 'crunch' });
    } else if (drop.kind === 'bomb') {
      drop.phase = 'boom';
      world.mood = { kind: 'sad', since: world.time };
      events.push({ type: 'hurt' });
      events.push({ type: 'sound', sound: 'thud' });
    } else {
      drop.phase = 'caught';
      events.push({ type: 'choice', key: drop.key, index: drop.index });
      // The other gems of the question leave with it.
      for (const other of world.drops) {
        if (
          other !== drop &&
          other.kind === 'gem' &&
          other.key === drop.key &&
          other.phase === 'fall'
        ) {
          other.phase = 'gone';
        }
      }
      world.queue = [];
    }
  }
  world.drops = world.drops.filter((drop) => drop.phase !== 'gone');
  world.events = events.length > 0 ? events : NO_EVENTS;
  return world;
}
