import { circleTouchesBox, type Box } from '../kit/physics';
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
 * Vol du Chaton: a tap beats the wings, gravity does the rest. The companion flies between pillars
 * of clouds; every third pillar has two passages, each with an answer in a bubble: fly through the
 * right one. A pillar costs a heart (then a moment to get away); the ground and the sky only stop
 * the flight. Gentle at first, a little faster with every pillar.
 */

export type Pillar = {
  x: number;
  /** A gate has two passages and the answers of the question `key`. */
  gate: boolean;
  key: number;
  /** Center of the passage (one passage), or of the upper and lower passages (a gate). */
  gaps: number[];
  passed: boolean;
  hit: boolean;
  /** The passage flown through, once decided; -1 before. */
  picked: number;
  /** The engine's verdict on it: 1 right, -1 wrong, 0 not yet. */
  outcome: number;
};

export type FlightWorld = WorldBase & {
  width: number;
  height: number;
  speed: number;
  time: number;
  /** Nothing moves until the first tap. */
  flying: boolean;
  y: number;
  vy: number;
  pillars: Pillar[];
  /** Pillars made so far: every third is a gate. */
  made: number;
  taps: number;
  verdict: number;
  /** After a pillar, a moment when nothing hurts. */
  safeUntil: number;
  mood: Mood;
};

export const FLIGHT = {
  x: 0.28,
  size: 0.2,
  /** The body that touches, as a share of the width. */
  radius: 0.055,
  /** Heights per second (squared). */
  gravity: 1.5,
  flap: 0.5,
  maxFall: 0.7,
  /** Widths per second, plus a little per pillar passed. */
  scroll: 0.22,
  scrollGrowth: 0.01,
  maxScroll: 0.38,
  spacing: 0.62,
  pillarWidth: 0.17,
  gap: 0.3,
  gateGap: 0.22,
  every: 3,
  safeMs: 1500,
  top: 0.06,
  bottom: 0.9,
} as const;

export function createFlight(settings: SceneSettings): FlightWorld {
  'worklet';
  return {
    events: NO_EVENTS,
    width: settings.width,
    height: settings.height,
    speed: speedOf(settings),
    time: 0,
    flying: false,
    y: settings.height * 0.45,
    vy: 0,
    pillars: [],
    made: 0,
    taps: 0,
    verdict: 0,
    safeUntil: 0,
    mood: IDLE,
  };
}

/** The clouds of a pillar, from the top: everything but the passages. */
export function pillarBoxes(world: FlightWorld, pillar: Pillar): Box[] {
  'worklet';
  const width = world.width * FLIGHT.pillarWidth;
  const half = (world.height * (pillar.gate ? FLIGHT.gateGap : FLIGHT.gap)) / 2;
  const boxes: Box[] = [];
  let top = 0;
  for (const gap of pillar.gaps) {
    boxes.push({ x: pillar.x, y: top, width, height: gap - half - top });
    top = gap + half;
  }
  boxes.push({ x: pillar.x, y: top, width, height: world.height - top });
  return boxes;
}

function newPillar(world: FlightWorld, feed: SceneFeed, x: number): Pillar {
  'worklet';
  world.made += 1;
  const { height } = world;
  const gate = world.made % FLIGHT.every === 0 && feed.labels.length >= 2;
  // The passage wanders a little from one pillar to the next.
  const wave = Math.sin(world.made * 1.7);
  const gaps = gate ? [height * 0.3, height * 0.66] : [height * (0.45 + 0.17 * wave)];
  return {
    x,
    gate,
    key: gate ? feed.key : 0,
    gaps,
    passed: false,
    hit: false,
    picked: -1,
    outcome: 0,
  };
}

export const scrollSpeed = (world: FlightWorld) => {
  'worklet';
  const passed = Math.max(0, world.made - 3);
  return (
    Math.min(FLIGHT.maxScroll, FLIGHT.scroll + FLIGHT.scrollGrowth * passed) *
    world.width *
    world.speed
  );
};

export function stepFlight(
  previous: FlightWorld,
  dt: number,
  input: SceneInput,
  feed: SceneFeed,
): FlightWorld {
  'worklet';
  const world: FlightWorld = {
    ...previous,
    pillars: previous.pillars.map((pillar) => ({ ...pillar, gaps: [...pillar.gaps] })),
    events: NO_EVENTS,
  };
  const events: SceneEvent[] = [];
  const { width, height, speed } = world;
  const seconds = dt / 1000;
  world.time += dt;

  const verdict = feed.verdict;
  if (verdict && verdict.serial !== world.verdict) {
    world.verdict = verdict.serial;
    world.mood = { kind: verdict.correct ? 'joy' : 'sad', since: world.time };
    for (const pillar of world.pillars) {
      if (pillar.gate && pillar.key === verdict.key && pillar.picked === verdict.index) {
        pillar.outcome = verdict.correct ? 1 : -1;
      }
    }
  }

  // Gates still ahead show the question being asked now.
  if (feed.labels.length >= 2) {
    for (const pillar of world.pillars) {
      if (pillar.gate && pillar.picked === -1) pillar.key = feed.key;
    }
  }

  if (input.taps > world.taps) {
    world.taps = input.taps;
    world.flying = true;
    world.vy = -FLIGHT.flap * height * speed;
    events.push({ type: 'sound', sound: 'flap' });
  }
  if (!world.flying) {
    world.events = events.length > 0 ? events : NO_EVENTS;
    return world;
  }

  // Wings and gravity (slower with fewer animations, along the same curve).
  world.vy = Math.min(
    FLIGHT.maxFall * height * speed,
    world.vy + FLIGHT.gravity * height * speed * speed * seconds,
  );
  world.y += world.vy * seconds;
  if (world.y < height * FLIGHT.top) {
    world.y = height * FLIGHT.top;
    world.vy = 0;
  }
  if (world.y > height * FLIGHT.bottom) {
    world.y = height * FLIGHT.bottom;
    world.vy = 0;
  }

  // The pillars come: the first one a little later, to get going.
  const scroll = scrollSpeed(world) * seconds;
  for (const pillar of world.pillars) pillar.x -= scroll;
  world.pillars = world.pillars.filter((pillar) => pillar.x > -width * FLIGHT.pillarWidth);
  const last = world.pillars[world.pillars.length - 1];
  if (!last || last.x < width + width * FLIGHT.pillarWidth - width * FLIGHT.spacing) {
    world.pillars.push(
      newPillar(world, feed, last ? last.x + width * FLIGHT.spacing : width * 1.2),
    );
  }

  const body = { x: width * FLIGHT.x, y: world.y, r: width * FLIGHT.radius };
  const pillarWidth = width * FLIGHT.pillarWidth;
  for (const pillar of world.pillars) {
    // Through a gate: the passage it flies in is its answer.
    if (pillar.gate && pillar.picked === -1 && body.x >= pillar.x + pillarWidth / 2) {
      const half = (height * FLIGHT.gateGap) / 2;
      const passage = pillar.gaps.findIndex((gap) => Math.abs(world.y - gap) <= half);
      if (passage >= 0 && pillar.key === feed.key) {
        pillar.picked = passage;
        events.push({ type: 'choice', key: pillar.key, index: passage });
      } else {
        pillar.picked = -2;
      }
    }
    if (!pillar.passed && body.x > pillar.x + pillarWidth) {
      pillar.passed = true;
      if (!pillar.gate && !pillar.hit) events.push({ type: 'points', points: 10 });
    }
    if (pillar.hit || world.time < world.safeUntil) continue;
    if (pillarBoxes(world, pillar).some((box) => box.height > 0 && circleTouchesBox(body, box))) {
      pillar.hit = true;
      world.safeUntil = world.time + FLIGHT.safeMs;
      world.mood = { kind: 'sad', since: world.time };
      events.push({ type: 'hurt' });
      events.push({ type: 'sound', sound: 'thud' });
    }
  }

  world.events = events.length > 0 ? events : NO_EVENTS;
  return world;
}

/** Whether the companion shows: it blinks while nothing can hurt it. */
export function visible(world: FlightWorld): boolean {
  'worklet';
  return world.time >= world.safeUntil || Math.floor(world.time / 120) % 2 === 0;
}
