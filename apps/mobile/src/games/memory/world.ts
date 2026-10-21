import type { Box } from '../kit/physics';
import { random } from '../kit/physics';
import {
  IDLE,
  NO_EVENTS,
  type Mood,
  type SceneEvent,
  type SceneFeed,
  type SceneInput,
  type SceneSettings,
  type WorldBase,
} from '../kit/scene';

/**
 * Memory du compagnon: a board of cards face down, the companion on their backs. Turn two: a
 * calculation and its result make a pair and stay up; otherwise they show a moment, then turn
 * back. A board found, another one is dealt. No hurry: the clock only adds a bonus.
 */

/** down; up (turned by the child); matched (part of a pair found). */
export type CardFace = 'down' | 'up' | 'matched';

export type Card = {
  /** Its label: 2 × n is pair n's calculation, 2 × n + 1 its result. */
  index: number;
  face: CardFace;
  /** Since it last turned. */
  t: number;
  /** It has been face up before. */
  seen: boolean;
  /** Whether it had been seen when it was turned this time. */
  known: boolean;
  /** A wrong pair turns back at this time; -1 otherwise. */
  backAt: number;
};

export type MemoryWorld = WorldBase & {
  width: number;
  height: number;
  still: boolean;
  time: number;
  seed: number;
  key: number;
  /** In the board's order, row by row. */
  cards: Card[];
  dealtAt: number;
  /** The cards turned, by position, waiting for their pair. */
  open: number[];
  waiting: boolean;
  touches: number;
  verdict: number;
  mood: Mood;
};

export const MEMORY = {
  columns: 3,
  /** Shares of the width. */
  margin: 0.05,
  gap: 0.035,
  /** The board takes the top of the scene; the companion watches from below. */
  board: 0.8,
  ratio: 1.2,
  flipMs: 260,
  /** A wrong pair stays face up this long. */
  lookMs: 1100,
  dealMs: 300,
  ground: 0.91,
  companionSize: 0.17,
} as const;

export function createMemory(settings: SceneSettings, seed: number): MemoryWorld {
  'worklet';
  return {
    events: NO_EVENTS,
    width: settings.width,
    height: settings.height,
    still: settings.reducedMotion,
    time: 0,
    seed,
    key: 0,
    cards: [],
    dealtAt: 0,
    open: [],
    waiting: false,
    touches: 0,
    verdict: 0,
    mood: IDLE,
  };
}

/** Where the card at `position` lies, for a board of `count` cards. */
export function cardBox(world: MemoryWorld, position: number, count: number): Box {
  'worklet';
  const { width, height } = world;
  const rows = Math.max(1, Math.ceil(count / MEMORY.columns));
  const gap = width * MEMORY.gap;
  const cardWidth = (width * (1 - 2 * MEMORY.margin) - gap * (MEMORY.columns - 1)) / MEMORY.columns;
  const room = height * MEMORY.board - gap;
  const cardHeight = Math.min(cardWidth * MEMORY.ratio, (room - gap * (rows - 1)) / rows);
  const column = position % MEMORY.columns;
  const row = Math.floor(position / MEMORY.columns);
  const boardHeight = rows * cardHeight + (rows - 1) * gap;
  return {
    x: width * MEMORY.margin + column * (cardWidth + gap),
    y: gap + Math.max(0, (room - boardHeight) / 2) + row * (cardHeight + gap),
    width: cardWidth,
    height: cardHeight,
  };
}

function deal(world: MemoryWorld, count: number) {
  'worklet';
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) {
    const next = random(world.seed);
    world.seed = next.seed;
    const j = Math.floor(next.value * (i + 1));
    const swap = order[i] ?? 0;
    order[i] = order[j] ?? 0;
    order[j] = swap;
  }
  world.cards = order.map((index) => ({
    index,
    face: 'down',
    t: MEMORY.flipMs,
    seen: false,
    known: false,
    backAt: -1,
  }));
  world.dealtAt = world.time;
  world.open = [];
  world.waiting = false;
}

function turnBack(card: Card) {
  'worklet';
  card.face = 'down';
  card.t = 0;
  card.backAt = -1;
}

export function stepMemory(
  previous: MemoryWorld,
  dt: number,
  input: SceneInput,
  feed: SceneFeed,
): MemoryWorld {
  'worklet';
  const world: MemoryWorld = {
    ...previous,
    cards: previous.cards.map((card) => ({ ...card })),
    open: [...previous.open],
    events: NO_EVENTS,
  };
  const events: SceneEvent[] = [];
  world.time += dt;
  for (const card of world.cards) card.t += dt;

  // A new board.
  if (feed.key !== world.key && feed.labels.length > 0) {
    world.key = feed.key;
    deal(world, feed.labels.length);
  }

  const verdict = feed.verdict;
  if (verdict && verdict.serial !== world.verdict) {
    world.verdict = verdict.serial;
    world.mood = { kind: verdict.correct ? 'joy' : 'sad', since: world.time };
    if (verdict.key === world.key) {
      const picked = verdict.indexes ?? [verdict.index];
      for (const card of world.cards) {
        if (!picked.includes(card.index) || card.face !== 'up') continue;
        if (verdict.correct) {
          card.face = 'matched';
          card.t = 0;
        } else {
          card.backAt = world.time + MEMORY.lookMs;
        }
      }
      world.open = [];
      world.waiting = false;
    }
  }

  for (const card of world.cards) {
    if (card.backAt >= 0 && world.time >= card.backAt) turnBack(card);
  }

  if (input.touches > world.touches) {
    world.touches = input.touches;
    const count = world.cards.length;
    const position = world.cards.findIndex((_, i) => {
      const box = cardBox(world, i, count);
      return (
        input.touchX >= box.x &&
        input.touchX <= box.x + box.width &&
        input.touchY >= box.y &&
        input.touchY <= box.y + box.height
      );
    });
    if (!world.waiting && position >= 0) {
      // A touch while a wrong pair is still showing turns it back at once.
      for (const card of world.cards) if (card.backAt >= 0) turnBack(card);
      const card = world.cards[position];
      if (card && card.face === 'down') {
        card.face = 'up';
        card.t = 0;
        card.known = card.seen;
        card.seen = true;
        world.open.push(position);
        events.push({ type: 'sound', sound: 'flip' });
        const [a, b] = world.open.map((each) => world.cards[each]);
        if (a && b) {
          world.waiting = true;
          events.push({
            type: 'pick',
            key: world.key,
            indexes: [a.index, b.index],
            known: a.known && b.known,
          });
        }
      }
    }
  }

  world.events = events.length > 0 ? events : NO_EVENTS;
  return world;
}

/** How wide a card shows (it narrows to turn) and which face: none with fewer animations. */
export function cardTurn(
  world: MemoryWorld,
  card: Card,
): { face: 'back' | 'front'; scale: number } {
  'worklet';
  const front = card.face !== 'down';
  if (world.still || card.t >= MEMORY.flipMs || card.face === 'matched') {
    return { face: front ? 'front' : 'back', scale: 1 };
  }
  const progress = card.t / MEMORY.flipMs;
  // The first half shows the face it had, the second half the new one.
  if (progress < 0.5) return { face: front ? 'back' : 'front', scale: 1 - progress * 2 };
  return { face: front ? 'front' : 'back', scale: progress * 2 - 1 };
}
