import { approach, random } from '../kit/physics';
import {
  IDLE,
  NO_EVENTS,
  speedOf,
  type Mood,
  type SceneEvent,
  type SceneFeed,
  type SceneInput,
  type SceneSettings,
  type WorldBase,
} from '../kit/scene';

/**
 * Course des croquettes: the companion runs up three lanes. A swipe (or a touch on one side)
 * changes lane. A row of doors comes, one answer on each: the lane the companion is in when it
 * reaches them is its answer. Croquettes lie between the doors, a few points each.
 */

export type DoorRow = {
  key: number;
  y: number;
  /** The lane run through, once there; -1 before, -2 through a lane without an answer. */
  picked: number;
  /** The engine's verdict: 1 right, -1 wrong, 0 not yet. */
  outcome: number;
  t: number;
};

export type Croquette = { lane: number; y: number; taken: boolean; t: number };

export type RaceWorld = WorldBase & {
  width: number;
  height: number;
  speed: number;
  still: boolean;
  time: number;
  seed: number;
  key: number;
  /** The last question answered at a door. */
  answered: number;
  lane: number;
  /** Where the companion is drawn, on its way to its lane. */
  x: number;
  doors: DoorRow[];
  croquettes: Croquette[];
  nextCroquettes: number;
  /** How far the ground has scrolled (its stripes move with it). */
  ground: number;
  touches: number;
  /** Where the finger began (or last changed lane); null when it is up. */
  anchor: number | null;
  swiped: boolean;
  touchX: number;
  verdict: number;
  mood: Mood;
};

export const RACE = {
  lanes: [0.2, 0.5, 0.8],
  runner: 0.8,
  companionSize: 0.2,
  /** Heights per second, a little quicker over the round. */
  scroll: 0.22,
  scrollGrowth: 0.35,
  /** A swipe this long (a share of the width) changes lane. */
  swipe: 0.07,
  /** Widths per second, from one lane to the next. */
  slide: 2.6,
  doorHeight: 0.12,
  doorWidth: 0.27,
  /** Croquettes keep this far (in heights) from the doors. */
  clear: 0.22,
  croquetteSize: 0.11,
  croquetteEvery: [900, 1600],
  line: 3,
  lineSpacing: 0.085,
  /** How close (in heights) the companion must be to take a croquette. */
  reach: 0.06,
  outcomeMs: 700,
  stripe: 0.12,
} as const;

export function createRace(settings: SceneSettings, seed: number): RaceWorld {
  'worklet';
  return {
    events: NO_EVENTS,
    width: settings.width,
    height: settings.height,
    speed: speedOf(settings),
    still: settings.reducedMotion,
    time: 0,
    seed,
    key: 0,
    answered: 0,
    lane: 1,
    x: settings.width * (RACE.lanes[1] ?? 0.5),
    doors: [],
    croquettes: [],
    nextCroquettes: RACE.croquetteEvery[0],
    ground: 0,
    touches: 0,
    anchor: null,
    swiped: false,
    touchX: 0,
    verdict: 0,
    mood: IDLE,
  };
}

export const laneX = (world: RaceWorld, lane: number) => {
  'worklet';
  return world.width * (RACE.lanes[lane] ?? 0.5);
};

export const runSpeed = (world: RaceWorld) => {
  'worklet';
  const growth = 1 + RACE.scrollGrowth * Math.min(1, world.time / 90_000);
  return RACE.scroll * world.height * world.speed * growth;
};

function rand(world: RaceWorld): number {
  'worklet';
  const next = random(world.seed);
  world.seed = next.seed;
  return next.value;
}

/** Swipes and touches: a swipe moves one lane per stretch; a touch on one side, one lane. */
function steer(world: RaceWorld, input: SceneInput) {
  'worklet';
  const last = RACE.lanes.length - 1;
  if (input.touches > world.touches) {
    world.touches = input.touches;
    world.anchor = input.touchX;
    world.touchX = input.touchX;
    world.swiped = false;
  }
  if (world.anchor === null) return;
  if (input.x !== null) {
    const moved = input.x - world.anchor;
    if (Math.abs(moved) >= world.width * RACE.swipe) {
      world.lane = Math.max(0, Math.min(last, world.lane + (moved > 0 ? 1 : -1)));
      world.anchor = input.x;
      world.swiped = true;
    }
    return;
  }
  // The finger is up: without a swipe, it was a touch on one side of the companion.
  if (!world.swiped) {
    const side = world.touchX - laneX(world, world.lane);
    if (Math.abs(side) > world.width * 0.1) {
      world.lane = Math.max(0, Math.min(last, world.lane + (side > 0 ? 1 : -1)));
    }
  }
  world.anchor = null;
}

export function stepRace(
  previous: RaceWorld,
  dt: number,
  input: SceneInput,
  feed: SceneFeed,
): RaceWorld {
  'worklet';
  const world: RaceWorld = {
    ...previous,
    doors: previous.doors.map((door) => ({ ...door })),
    croquettes: previous.croquettes.map((croquette) => ({ ...croquette })),
    events: NO_EVENTS,
  };
  const events: SceneEvent[] = [];
  const { width, height } = world;
  world.time += dt;

  // A new question: its doors come from the top.
  if (feed.key !== world.key && feed.labels.length > 0) {
    world.key = feed.key;
    world.doors.push({ key: feed.key, y: -height * RACE.doorHeight, picked: -1, outcome: 0, t: 0 });
    // Croquettes about to come would hide behind the doors.
    world.croquettes = world.croquettes.filter(
      (croquette) => croquette.taken || croquette.y > height * 0.08,
    );
  }

  const verdict = feed.verdict;
  if (verdict && verdict.serial !== world.verdict) {
    world.verdict = verdict.serial;
    world.mood = { kind: verdict.correct ? 'joy' : 'sad', since: world.time };
    for (const door of world.doors) {
      if (door.key === verdict.key && door.picked === verdict.index) {
        door.outcome = verdict.correct ? 1 : -1;
        door.t = 0;
      }
    }
  }

  steer(world, input);
  world.x = approach(
    world.x,
    laneX(world, world.lane),
    RACE.slide * width * world.speed * (dt / 1000),
  );

  const run = runSpeed(world) * (dt / 1000);
  world.ground = (world.ground + run) % (height * RACE.stripe * 2);
  const runnerY = height * RACE.runner;
  // The lane the companion is in: the one it is closest to.
  let lane = 0;
  for (let i = 1; i < RACE.lanes.length; i++) {
    if (Math.abs(world.x - laneX(world, i)) < Math.abs(world.x - laneX(world, lane))) lane = i;
  }

  for (const door of world.doors) {
    door.y += run;
    door.t += dt;
    if (door.picked === -1 && door.y >= runnerY) {
      if (door.key === feed.key && lane < feed.labels.length) {
        door.picked = lane;
        world.answered = door.key;
        events.push({ type: 'choice', key: door.key, index: lane });
      } else {
        door.picked = -2;
      }
    }
  }
  // Doors of the question that passed without an answer come again.
  const coming = world.doors.some((door) => door.key === feed.key && door.picked === -1);
  if (!coming && world.answered !== feed.key && world.key === feed.key && feed.labels.length > 0) {
    world.doors.push({ key: feed.key, y: -height * RACE.doorHeight, picked: -1, outcome: 0, t: 0 });
  }
  world.doors = world.doors.filter((door) => door.y < height + height * RACE.doorHeight);

  // Croquettes, in a line along one lane, away from the doors.
  world.nextCroquettes -= dt;
  const doorNearTop = world.doors.some((door) => door.y < height * RACE.clear);
  if (world.nextCroquettes <= 0 && !doorNearTop) {
    const croquetteLane = Math.floor(rand(world) * RACE.lanes.length);
    for (let i = 0; i < RACE.line; i++) {
      world.croquettes.push({
        lane: croquetteLane,
        y: -height * (0.05 + i * RACE.lineSpacing),
        taken: false,
        t: 0,
      });
    }
    const [low, high] = RACE.croquetteEvery;
    world.nextCroquettes = (low + (high - low) * rand(world)) / world.speed;
  }
  for (const croquette of world.croquettes) {
    croquette.y += run;
    croquette.t += dt;
    if (croquette.taken || croquette.lane !== lane) continue;
    if (Math.abs(croquette.y - runnerY) <= height * RACE.reach) {
      croquette.taken = true;
      croquette.t = 0;
      events.push({ type: 'points', points: 10 });
      events.push({ type: 'sound', sound: 'crunch' });
    }
  }
  world.croquettes = world.croquettes.filter(
    (croquette) =>
      croquette.y < height * 1.1 && !(croquette.taken && croquette.t >= RACE.outcomeMs),
  );

  world.events = events.length > 0 ? events : NO_EVENTS;
  return world;
}
