import { circlesTouch, random } from '../kit/physics';
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
 * Bulles magiques: bubbles carrying numbers rise from the grass, in a stream that comes round
 * again. Touch two bubbles that make the target together: the round tells whether they do. Right,
 * they burst; wrong, they shake (or blush, with fewer animations) and can be picked again.
 */

/** rise; burst (the right pair); leave (the question changed). */
export type BubblePhase = 'rise' | 'burst' | 'leave';

export type Bubble = {
  /** The label it carries. */
  index: number;
  key: number;
  x: number;
  y: number;
  phase: BubblePhase;
  /** Since the phase began, or since a wrong pick (`shake`). */
  t: number;
  shake: number;
  /** Where it sways, so that neighbours do not sway together. */
  sway: number;
};

export type BubblesWorld = WorldBase & {
  width: number;
  height: number;
  speed: number;
  /** Fewer animations: the bubbles rise straight, without swaying. */
  still: boolean;
  time: number;
  seed: number;
  key: number;
  bubbles: Bubble[];
  /** The labels touched, waiting for a second (or for the verdict). */
  selected: number[];
  waiting: boolean;
  touches: number;
  verdict: number;
  mood: Mood;
};

export const BUBBLES = {
  /** A bubble's picture, as a share of the width (the bubble itself is 72 % of it). */
  size: 0.27,
  /** Heights per second, a little quicker over the round. */
  rise: 0.085,
  riseGrowth: 0.4,
  columns: [0.2, 0.5, 0.8],
  /** The stream a bubble travels before it comes back from below, in heights. */
  loop: 1.3,
  /** Where the first bubble of a question starts. */
  first: 0.55,
  sway: 0.03,
  ground: 0.9,
  companionSize: 0.2,
  outcomeMs: 600,
  shakeMs: 500,
} as const;

/** The touchable radius of a bubble: a little more than it shows. */
export const bubbleRadius = (world: BubblesWorld) => {
  'worklet';
  return world.width * BUBBLES.size * 0.42;
};

export function createBubbles(settings: SceneSettings, seed: number): BubblesWorld {
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
    bubbles: [],
    selected: [],
    waiting: false,
    touches: 0,
    verdict: 0,
    mood: IDLE,
  };
}

function rand(world: BubblesWorld): number {
  'worklet';
  const next = random(world.seed);
  world.seed = next.seed;
  return next.value;
}

export const riseSpeed = (world: BubblesWorld) => {
  'worklet';
  const growth = 1 + BUBBLES.riseGrowth * Math.min(1, world.time / 90_000);
  return BUBBLES.rise * world.height * world.speed * growth;
};

/** Where a bubble is drawn: its column, swaying (not with fewer animations). */
export function bubbleX(world: BubblesWorld, bubble: Bubble): number {
  'worklet';
  if (world.still) return bubble.x;
  return bubble.x + Math.sin(world.time / 700 + bubble.sway) * world.width * BUBBLES.sway;
}

/** The labels of a new question rise one after the other, in the columns in turn. */
function newStream(world: BubblesWorld, count: number) {
  'worklet';
  const spacing = (world.height * BUBBLES.loop) / count;
  const offset = Math.floor(rand(world) * BUBBLES.columns.length);
  for (let i = 0; i < count; i++) {
    const column = BUBBLES.columns[(i + offset) % BUBBLES.columns.length] ?? 0.5;
    world.bubbles.push({
      index: i,
      key: world.key,
      x: world.width * column,
      y: world.height * BUBBLES.first + i * spacing,
      phase: 'rise',
      t: 0,
      shake: -1,
      sway: rand(world) * Math.PI * 2,
    });
  }
}

export function stepBubbles(
  previous: BubblesWorld,
  dt: number,
  input: SceneInput,
  feed: SceneFeed,
): BubblesWorld {
  'worklet';
  const world: BubblesWorld = {
    ...previous,
    bubbles: previous.bubbles.map((bubble) => ({ ...bubble })),
    selected: [...previous.selected],
    events: NO_EVENTS,
  };
  const events: SceneEvent[] = [];
  const { height } = world;
  world.time += dt;

  // A new question: the last bubbles float away, the new ones come.
  if (feed.key !== world.key && feed.labels.length > 0) {
    world.key = feed.key;
    for (const bubble of world.bubbles) {
      if (bubble.phase === 'rise') {
        bubble.phase = 'leave';
        bubble.t = 0;
      }
    }
    world.selected = [];
    world.waiting = false;
    newStream(world, feed.labels.length);
  }

  const verdict = feed.verdict;
  if (verdict && verdict.serial !== world.verdict) {
    world.verdict = verdict.serial;
    world.mood = { kind: verdict.correct ? 'joy' : 'sad', since: world.time };
    const picked = verdict.indexes ?? [verdict.index];
    for (const bubble of world.bubbles) {
      if (bubble.key !== verdict.key || bubble.phase !== 'rise') continue;
      if (picked.includes(bubble.index)) {
        if (verdict.correct) {
          bubble.phase = 'burst';
          bubble.t = 0;
        } else {
          bubble.shake = 0;
        }
      } else if (verdict.correct) {
        // Found: the others float away until the next question.
        bubble.phase = 'leave';
        bubble.t = 0;
      }
    }
    if (verdict.correct) events.push({ type: 'sound', sound: 'pop' });
    world.selected = [];
    world.waiting = false;
  }

  // A touch on a bubble picks it (or lets it go); the second one asks the round.
  if (input.touches > world.touches) {
    world.touches = input.touches;
    const finger = { x: input.touchX, y: input.touchY, r: 0 };
    const reach = bubbleRadius(world);
    const touched = world.waiting
      ? undefined
      : world.bubbles.find(
          (bubble) =>
            bubble.phase === 'rise' &&
            bubble.key === world.key &&
            circlesTouch(finger, { x: bubbleX(world, bubble), y: bubble.y, r: reach }),
        );
    if (touched) {
      if (world.selected.includes(touched.index)) {
        world.selected = world.selected.filter((index) => index !== touched.index);
      } else {
        world.selected.push(touched.index);
        events.push({ type: 'sound', sound: 'flip' });
        if (world.selected.length === 2) {
          world.waiting = true;
          events.push({ type: 'pick', key: world.key, indexes: [...world.selected] });
        }
      }
    }
  }

  const rise = riseSpeed(world) * (dt / 1000);
  const loop = height * BUBBLES.loop;
  for (const bubble of world.bubbles) {
    bubble.t += dt;
    if (bubble.shake >= 0) {
      bubble.shake += dt;
      if (bubble.shake >= BUBBLES.shakeMs) bubble.shake = -1;
    }
    bubble.y -= bubble.phase === 'leave' ? rise * 3 : bubble.phase === 'burst' ? 0 : rise;
    // Past the top, a bubble of the question comes back from below.
    if (bubble.phase === 'rise' && bubble.y < -bubbleRadius(world)) bubble.y += loop;
  }
  world.bubbles = world.bubbles.filter(
    (bubble) =>
      bubble.phase === 'rise' ||
      (bubble.t < BUBBLES.outcomeMs && bubble.y > -bubbleRadius(world) * 2),
  );
  world.events = events.length > 0 ? events : NO_EVENTS;
  return world;
}
