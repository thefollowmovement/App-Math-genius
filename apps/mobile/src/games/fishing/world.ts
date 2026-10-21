import { approach, random } from '../kit/physics';
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
 * Pêche éclair: three fish carry the answers. One at a time, a fish swims to the float, nibbles,
 * then bites: the float dives and « Pêcher ! » catches it. Too early or too late, it swims away
 * and comes back later. Only the fish with the right answer should be caught.
 */

/** idle: swimming; come: toward the float; nibble: no catching yet; bite: catch it now! */
export type FishPhase = 'idle' | 'come' | 'nibble' | 'bite' | 'flee' | 'reel' | 'won' | 'release';

export type Fish = {
  index: number;
  x: number;
  y: number;
  /** 1: swimming right. */
  dir: number;
  phase: FishPhase;
  /** Time in this phase. */
  t: number;
  /** How long the nibble lasts this time. */
  nibble: number;
  /** Caught by mistake once: it stays away until the next question. */
  away: boolean;
};

export type FishingWorld = WorldBase & {
  width: number;
  height: number;
  speed: number;
  time: number;
  seed: number;
  /** The question the fish carry. */
  key: number;
  fish: Fish[];
  /** The fish's turns to come to the float. */
  order: number[];
  /** The fish at the float, or -1. */
  active: number;
  /** Before the next fish comes. */
  wait: number;
  taps: number;
  verdict: number;
  mood: Mood;
};

export const FISHING = {
  float: { x: 0.62, y: 0.6 },
  rod: { x: 0.3, y: 0.37 },
  companion: { x: 0.17, y: 0.44, size: 0.27 },
  /** The band the fish swim in. */
  water: { top: 0.68, bottom: 0.9 },
  fishSize: 0.21,
  floatSize: 0.12,
  /** Fractions of the width per second. */
  swim: 0.12,
  come: 0.35,
  flee: 0.6,
  nibbleMs: [700, 1500],
  biteMs: 900,
  waitMs: 650,
  reelMs: 650,
} as const;

function rand(world: FishingWorld): number {
  'worklet';
  const next = random(world.seed);
  world.seed = next.seed;
  return next.value;
}

function shuffled(world: FishingWorld, count: number): number[] {
  'worklet';
  const list = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand(world) * (i + 1));
    const swap = list[i] ?? 0;
    list[i] = list[j] ?? 0;
    list[j] = swap;
  }
  return list;
}

function freshFish(world: FishingWorld, count: number): Fish[] {
  'worklet';
  const { width, height } = world;
  const band = FISHING.water.bottom - FISHING.water.top;
  return Array.from({ length: count }, (_, index) => ({
    index,
    x: width * (0.15 + 0.7 * rand(world)),
    y: height * (FISHING.water.top + (band * (index + 0.5)) / count),
    dir: rand(world) < 0.5 ? -1 : 1,
    phase: 'idle' as FishPhase,
    t: 0,
    nibble: 0,
    away: false,
  }));
}

export function createFishing(settings: SceneSettings, seed: number): FishingWorld {
  'worklet';
  return {
    events: NO_EVENTS,
    width: settings.width,
    height: settings.height,
    speed: speedOf(settings),
    time: 0,
    seed,
    key: 0,
    fish: [],
    order: [],
    active: -1,
    wait: FISHING.waitMs,
    taps: 0,
    verdict: 0,
    mood: IDLE,
  };
}

/** Where the active fish waits under the float. */
const floatX = (world: FishingWorld) => {
  'worklet';
  return world.width * FISHING.float.x;
};
const floatY = (world: FishingWorld) => {
  'worklet';
  return world.height * (FISHING.float.y + 0.08);
};

function nextTurn(world: FishingWorld) {
  'worklet';
  const waiting = world.fish.filter((fish) => !fish.away && fish.phase === 'idle');
  if (waiting.length === 0) return;
  if (world.order.length === 0) world.order = shuffled(world, world.fish.length);
  while (world.order.length > 0) {
    const index = world.order.shift() ?? -1;
    const fish = world.fish[index];
    if (fish && !fish.away && fish.phase === 'idle') {
      fish.phase = 'come';
      fish.t = 0;
      const [shortest, longest] = FISHING.nibbleMs;
      fish.nibble = shortest + (longest - shortest) * rand(world);
      world.active = index;
      return;
    }
  }
}

function leave(world: FishingWorld, fish: Fish) {
  'worklet';
  fish.phase = 'flee';
  fish.t = 0;
  fish.dir = fish.x < world.width / 2 ? -1 : 1;
  world.active = -1;
  world.wait = FISHING.waitMs;
}

/** One frame of the lake. Returns a new world: the one given is never changed. */
export function stepFishing(
  previous: FishingWorld,
  dt: number,
  input: SceneInput,
  feed: SceneFeed,
): FishingWorld {
  'worklet';
  const world: FishingWorld = {
    ...previous,
    fish: previous.fish.map((fish) => ({ ...fish })),
    order: [...previous.order],
    events: NO_EVENTS,
  };
  const events: SceneEvent[] = [];
  const { width, height, speed } = world;
  world.time += dt;

  // A new question: new fish.
  if (feed.key !== world.key && feed.labels.length > 0) {
    world.key = feed.key;
    world.fish = freshFish(world, feed.labels.length);
    world.order = [];
    world.active = -1;
    world.wait = FISHING.waitMs;
  }

  // The engine's verdict on the fish just caught.
  const verdict = feed.verdict;
  if (verdict && verdict.serial !== world.verdict) {
    world.verdict = verdict.serial;
    world.mood = { kind: verdict.correct ? 'joy' : 'sad', since: world.time };
    const fish = world.fish[verdict.index];
    if (verdict.key === world.key && fish) {
      fish.phase = verdict.correct ? 'won' : 'release';
      fish.t = 0;
      fish.away = !verdict.correct;
    }
  }

  // « Pêcher ! »: at the bite, the fish is caught; before, it is scared away.
  if (input.taps > world.taps) {
    world.taps = input.taps;
    const fish = world.fish[world.active];
    if (fish && fish.phase === 'bite') {
      fish.phase = 'reel';
      fish.t = 0;
      world.active = -1;
      events.push({ type: 'choice', key: world.key, index: fish.index });
      events.push({ type: 'sound', sound: 'splash' });
    } else if (fish && (fish.phase === 'come' || fish.phase === 'nibble')) {
      leave(world, fish);
      events.push({ type: 'sound', sound: 'splash' });
    }
  }

  for (const fish of world.fish) {
    fish.t += dt;
    const seconds = dt / 1000;
    switch (fish.phase) {
      case 'idle': {
        fish.x += fish.dir * FISHING.swim * width * speed * seconds;
        if (fish.x < width * 0.1) fish.dir = 1;
        if (fish.x > width * 0.9) fish.dir = -1;
        break;
      }
      case 'come': {
        const step = FISHING.come * width * speed * seconds;
        fish.dir = floatX(world) >= fish.x ? 1 : -1;
        fish.x = approach(fish.x, floatX(world), step);
        fish.y = approach(fish.y, floatY(world), step);
        if (fish.x === floatX(world) && fish.y === floatY(world)) {
          fish.phase = 'nibble';
          fish.t = 0;
        }
        break;
      }
      case 'nibble':
        if (fish.t >= fish.nibble) {
          fish.phase = 'bite';
          fish.t = 0;
          events.push({ type: 'sound', sound: 'pop' });
        }
        break;
      case 'bite':
        // Too late: it got away.
        if (fish.t >= FISHING.biteMs / speed) leave(world, fish);
        break;
      case 'flee': {
        fish.x += fish.dir * FISHING.flee * width * speed * seconds;
        const home =
          height *
          (FISHING.water.top +
            ((FISHING.water.bottom - FISHING.water.top) * (fish.index + 0.5)) / world.fish.length);
        fish.y = approach(fish.y, home, FISHING.come * width * seconds);
        if (fish.x < width * 0.1 || fish.x > width * 0.9) {
          fish.x = Math.min(width * 0.9, Math.max(width * 0.1, fish.x));
          fish.dir = -fish.dir;
          fish.phase = 'idle';
          fish.t = 0;
        }
        break;
      }
      case 'release':
        if (fish.t >= FISHING.reelMs) {
          fish.phase = 'flee';
          fish.t = 0;
          fish.x = floatX(world);
          fish.y = floatY(world);
          fish.dir = 1;
          events.push({ type: 'sound', sound: 'splash' });
          world.wait = FISHING.waitMs;
        }
        break;
      default:
        break;
    }
  }

  // The next fish comes once the float is free (and nobody is being reeled in).
  const busy = world.fish.some((fish) => fish.phase === 'reel' || fish.phase === 'won');
  if (world.active === -1 && !busy) {
    world.wait -= dt;
    if (world.wait <= 0) nextTurn(world);
  }

  world.events = events.length > 0 ? events : NO_EVENTS;
  return world;
}

/** The float: still, wiggling while a fish nibbles, under water when it bites. */
export function floatDip(world: FishingWorld): { dy: number; wiggle: number; bite: boolean } {
  'worklet';
  const fish = world.fish[world.active];
  if (!fish) return { dy: 0, wiggle: 0, bite: false };
  if (fish.phase === 'nibble') return { dy: 0, wiggle: Math.sin(fish.t / 60), bite: false };
  if (fish.phase === 'bite') return { dy: world.height * 0.025, wiggle: 0, bite: true };
  return { dy: 0, wiggle: 0, bite: false };
}
