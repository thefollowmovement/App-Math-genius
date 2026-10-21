import { bubblesRules } from './bubbles/rules';
import { BUBBLES, bubbleX, createBubbles, stepBubbles, type BubblesWorld } from './bubbles/world';
import { FLIGHT, createFlight, pillarBoxes, stepFlight, type FlightWorld } from './flight/world';
import { flightRules } from './flight/rules';
import { FISHING, createFishing, stepFishing, type FishingWorld } from './fishing/world';
import { fishingRules } from './fishing/rules';
import { GEM_RAIN, createGemRain, stepGemRain, type GemRainWorld } from './gem-rain/world';
import { gemRainRules } from './gem-rain/rules';
import {
  EMPTY_FEED,
  NO_INPUT,
  type SceneEvent,
  type SceneFeed,
  type SceneInput,
  type WorldBase,
} from './kit/scene';
import { random } from './kit/physics';
import { memoryRules } from './memory/rules';
import {
  MEMORY,
  cardBox,
  cardTurn,
  createMemory,
  stepMemory,
  type MemoryWorld,
} from './memory/world';
import { raceRules } from './race/rules';
import { RACE, createRace, laneX, stepRace, type RaceWorld } from './race/world';
import { addPoints, rightAnswer, speedBonus, starsOf, wrongAnswer } from './round';

const SETTINGS = { width: 390, height: 760, reducedMotion: false };
const FEED: SceneFeed = { key: 1, labels: ['56', '54', '63'], prompt: '7 × 8', verdict: null };

/** Plays a world for `ms`, frame by frame, gathering its events. */
function play<W extends WorldBase>(
  start: W,
  step: (world: W, dt: number, input: SceneInput, feed: SceneFeed) => W,
  ms: number,
  input: SceneInput | ((world: W) => SceneInput) = NO_INPUT,
  feed: SceneFeed = FEED,
): { world: W; events: SceneEvent[] } {
  let world = start;
  const events: SceneEvent[] = [];
  for (let t = 0; t < ms; t += 16) {
    world = step(world, 16, typeof input === 'function' ? input(world) : input, feed);
    events.push(...world.events);
  }
  return { world, events };
}

const tap = (taps: number): SceneInput => ({ ...NO_INPUT, taps });
const choices = (events: SceneEvent[]) => events.filter((event) => event.type === 'choice');

describe('the scenes’ randomness', () => {
  it('repeats with the same seed', () => {
    expect(random(42)).toEqual(random(42));
    expect(random(42).value).not.toBe(random(43).value);
    expect(random(42).value).toBeGreaterThanOrEqual(0);
    expect(random(42).value).toBeLessThan(1);
  });
});

describe('Pêche éclair', () => {
  const start = createFishing(SETTINGS, 7);

  /** Plays until a fish bites the float. */
  const untilBite = (world: FishingWorld) => {
    let current = world;
    for (let t = 0; t < 10_000; t += 16) {
      current = stepFishing(current, 16, tap(current.taps), FEED);
      if (current.fish.some((fish) => fish.phase === 'bite')) return current;
    }
    throw new Error('no bite');
  };

  it('puts each answer on a fish, and never changes the world it is given', () => {
    const before = JSON.stringify(start);
    const { world } = play(start, stepFishing, 16);
    expect(JSON.stringify(start)).toBe(before);
    expect(world.fish.map((fish) => fish.index)).toEqual([0, 1, 2]);
  });

  it('catches the fish that bites when « Pêcher ! » is pressed', () => {
    const biting = untilBite(start);
    const fish = biting.fish.find((each) => each.phase === 'bite');
    const caught = stepFishing(biting, 16, tap(biting.taps + 1), FEED);
    expect(choices([...caught.events])).toEqual([{ type: 'choice', key: 1, index: fish?.index }]);
  });

  it('lets the fish go when the child is too early or too late', () => {
    const { world } = play(start, stepFishing, 900);
    const coming = world.fish.find((fish) => fish.phase === 'come');
    expect(coming).toBeDefined();
    const early = stepFishing(world, 16, tap(world.taps + 1), FEED);
    expect(choices([...early.events])).toEqual([]);
    expect(early.fish[coming?.index ?? 0]?.phase).toBe('flee');

    const biting = untilBite(start);
    const { world: late, events } = play(
      biting,
      stepFishing,
      FISHING.biteMs + 50,
      tap(biting.taps),
    );
    expect(choices(events)).toEqual([]);
    expect(late.fish.some((fish) => fish.phase === 'flee')).toBe(true);
  });

  it('keeps a wrong fish away, and brings new fish with the next question', () => {
    const biting = untilBite(start);
    const index = biting.fish.find((fish) => fish.phase === 'bite')?.index ?? 0;
    const caught = stepFishing(biting, 16, tap(biting.taps + 1), FEED);
    const wrong = stepFishing(caught, 16, tap(caught.taps), {
      ...FEED,
      verdict: { key: 1, index, correct: false, serial: 1 },
    });
    expect(wrong.fish[index]?.away).toBe(true);
    expect(wrong.mood.kind).toBe('sad');
    const next = stepFishing(wrong, 16, tap(wrong.taps), { ...FEED, key: 2, verdict: null });
    expect(next.fish.every((fish) => !fish.away && fish.phase === 'idle')).toBe(true);
  });

  it('is slower with fewer animations: the bite waits longer', () => {
    expect(createFishing({ ...SETTINGS, reducedMotion: true }, 7).speed).toBeLessThan(1);
  });
});

describe('Pluie de gemmes', () => {
  const start = createGemRain(SETTINGS, 3);

  it('follows the finger, as fast as it can slide', () => {
    const { world } = play(start, stepGemRain, 48, { ...NO_INPUT, x: 300 });
    expect(world.x).toBeGreaterThan(start.x);
    expect(world.x).toBeLessThan(300);
    const { world: there } = play(start, stepGemRain, 2000, { ...NO_INPUT, x: 300 });
    expect(there.x).toBeCloseTo(300, 0);
  });

  it('rains the answers on gems, one in each column', () => {
    const { world } = play(start, stepGemRain, GEM_RAIN.waveRestMs + 3 * GEM_RAIN.gemEveryMs);
    const gems = world.drops.filter((drop) => drop.kind === 'gem');
    expect(gems.map((gem) => gem.index).sort()).toEqual([0, 1, 2]);
  });

  it('catches what falls on the companion: a gem is an answer, a croquette points', () => {
    // The companion runs under whatever falls first.
    const under = (world: GemRainWorld): SceneInput => ({
      ...NO_INPUT,
      x: world.drops.find((drop) => drop.phase === 'fall')?.x ?? world.x,
    });
    const { events } = play(start, stepGemRain, 8000, under);
    expect(events.some((event) => event.type === 'choice')).toBe(true);
    expect(events.some((event) => event.type === 'points' && event.points === 10)).toBe(true);
  });

  it('drops the same answers again when the right gem was missed', () => {
    // Between two columns: no gem falls there.
    const { world, events } = play(start, stepGemRain, 9000, {
      ...NO_INPUT,
      x: SETTINGS.width * 0.34,
    });
    expect(choices(events)).toEqual([]);
    expect(
      world.drops.filter((drop) => drop.kind === 'gem').length + world.queue.length,
    ).toBeGreaterThan(0);
  });

  it('turns a wrong gem into a bomb', () => {
    const caught: GemRainWorld = {
      ...start,
      drops: [{ kind: 'gem', index: 1, key: 1, x: 100, y: 500, phase: 'caught', t: 0 }],
      key: 1,
    };
    const after = stepGemRain(caught, 16, NO_INPUT, {
      ...FEED,
      verdict: { key: 1, index: 1, correct: false, serial: 1 },
    });
    expect(after.drops[0]?.phase).toBe('boom');
    expect(after.mood.kind).toBe('sad');
  });
});

describe('Vol du Chaton', () => {
  const start = createFlight(SETTINGS);

  it('waits for the first tap, then flies: a tap lifts, gravity brings down', () => {
    const { world: waiting } = play(start, stepFlight, 1000);
    expect(waiting.flying).toBe(false);
    expect(waiting.pillars).toEqual([]);
    const lifted = stepFlight(start, 16, tap(1), FEED);
    expect(lifted.vy).toBeLessThan(0);
    const { world: falling } = play(lifted, stepFlight, 600, tap(1));
    expect(falling.vy).toBeGreaterThan(0);
  });

  it('makes every third pillar a gate with the two answers', () => {
    let world: FlightWorld = stepFlight(start, 16, tap(1), FEED);
    // Keep flying in the middle, whatever happens.
    const { world: later } = play(world, stepFlight, 8000, (current) =>
      current.y > SETTINGS.height * 0.5 && current.vy > 0
        ? tap(current.taps + 1)
        : tap(current.taps),
    );
    world = later;
    expect(world.made).toBeGreaterThanOrEqual(FLIGHT.every);
    const gates = world.pillars.filter((pillar) => pillar.gate);
    expect(gates.length).toBeGreaterThan(0);
    expect(gates.every((gate) => gate.gaps.length === 2)).toBe(true);
  });

  it('takes the passage flown through as the answer', () => {
    const gate = {
      x: SETTINGS.width * FLIGHT.x - SETTINGS.width * FLIGHT.pillarWidth * 0.5 + 1,
      gate: true,
      key: 1,
      gaps: [SETTINGS.height * 0.3, SETTINGS.height * 0.66],
      passed: false,
      hit: false,
      picked: -1,
      outcome: 0,
    };
    const flying: FlightWorld = {
      ...start,
      flying: true,
      made: 3,
      y: SETTINGS.height * 0.66,
      pillars: [gate],
    };
    const next = stepFlight(flying, 16, NO_INPUT, FEED);
    expect(choices([...next.events])).toEqual([{ type: 'choice', key: 1, index: 1 }]);
    const verdict = stepFlight(next, 16, NO_INPUT, {
      ...FEED,
      verdict: { key: 1, index: 1, correct: true, serial: 1 },
    });
    expect(verdict.pillars[0]?.outcome).toBe(1);
    expect(verdict.mood.kind).toBe('joy');
  });

  it('costs a heart on a pillar, then lets the companion get away', () => {
    const pillar = {
      x: SETTINGS.width * FLIGHT.x - 10,
      gate: false,
      key: 0,
      gaps: [SETTINGS.height * 0.8],
      passed: false,
      hit: false,
      picked: -1,
      outcome: 0,
    };
    const flying: FlightWorld = {
      ...start,
      flying: true,
      made: 1,
      y: SETTINGS.height * 0.2,
      pillars: [pillar],
    };
    expect(pillarBoxes(flying, pillar)).toHaveLength(2);
    const { events, world } = play(flying, stepFlight, 200);
    expect(events.filter((event) => event.type === 'hurt')).toHaveLength(1);
    expect(world.safeUntil).toBeGreaterThan(world.time);
  });
});

/** A touch at (x, y): the finger stays down until `up`. */
const touch = (input: SceneInput, x: number, y: number): SceneInput => ({
  ...input,
  touches: input.touches + 1,
  touchX: x,
  touchY: y,
  x,
  y,
});
const lift = (input: SceneInput): SceneInput => ({ ...input, x: null, y: null });
const picks = (events: readonly SceneEvent[]) => events.filter((event) => event.type === 'pick');

describe('Bulles magiques', () => {
  const SUM: SceneFeed = {
    key: 1,
    labels: ['6', '8', '5', '9', '7', '16'],
    prompt: '14 = ? + ?',
    verdict: null,
  };
  const start = stepBubbles(createBubbles(SETTINGS, 5), 16, NO_INPUT, SUM);
  const bubble = (world: BubblesWorld, index: number) => {
    const found = world.bubbles.find((each) => each.index === index && each.phase === 'rise');
    if (!found) throw new Error(`no bubble ${index}`);
    return found;
  };
  /** Touches the bubble carrying `index`, where it is now. */
  const touchBubble = (world: BubblesWorld, input: SceneInput, index: number) =>
    touch(input, bubbleX(world, bubble(world, index)), bubble(world, index).y);

  it('puts each number on a bubble, and never changes the world it is given', () => {
    expect(start.bubbles.map((each) => each.index)).toEqual([0, 1, 2, 3, 4, 5]);
    const before = JSON.stringify(start);
    stepBubbles(start, 16, NO_INPUT, SUM);
    expect(JSON.stringify(start)).toBe(before);
  });

  it('lets the bubbles rise, and brings them back from below', () => {
    const { world } = play(start, stepBubbles, 20_000, NO_INPUT, SUM);
    expect(world.bubbles.filter((each) => each.phase === 'rise')).toHaveLength(6);
    expect(world.bubbles.every((each) => each.y > -SETTINGS.height * 0.2)).toBe(true);
    expect(world.bubbles.every((each) => each.y < SETTINGS.height * (BUBBLES.loop + 0.2))).toBe(
      true,
    );
  });

  it('picks two bubbles, lets go of one touched twice, and asks the round', () => {
    let input = touchBubble(start, NO_INPUT, 0);
    let world = stepBubbles(start, 16, input, SUM);
    expect(world.selected).toEqual([0]);
    input = touchBubble(world, lift(input), 0);
    world = stepBubbles(world, 16, input, SUM);
    expect(world.selected).toEqual([]);
    input = touchBubble(world, lift(input), 0);
    world = stepBubbles(world, 16, input, SUM);
    input = touchBubble(world, lift(input), 1);
    world = stepBubbles(world, 16, input, SUM);
    expect(picks(world.events)).toEqual([{ type: 'pick', key: 1, indexes: [0, 1] }]);
    expect(world.waiting).toBe(true);
    // Nothing more is picked until the round answers.
    input = touchBubble(world, lift(input), 2);
    expect(stepBubbles(world, 16, input, SUM).selected).toEqual([0, 1]);
  });

  it('bursts the right pair; a wrong one shakes and can be picked again', () => {
    const waiting: BubblesWorld = { ...start, selected: [0, 1], waiting: true };
    const wrong = stepBubbles(waiting, 16, NO_INPUT, {
      ...SUM,
      verdict: { key: 1, index: 0, indexes: [0, 1], correct: false, serial: 1 },
    });
    expect(bubble(wrong, 0).shake).toBeGreaterThanOrEqual(0);
    expect(wrong).toMatchObject({ selected: [], waiting: false });
    expect(wrong.mood.kind).toBe('sad');
    const right = stepBubbles(waiting, 16, NO_INPUT, {
      ...SUM,
      verdict: { key: 1, index: 0, indexes: [0, 1], correct: true, serial: 1 },
    });
    expect(right.bubbles.filter((each) => each.phase === 'burst')).toHaveLength(2);
    expect(right.bubbles.filter((each) => each.phase === 'leave')).toHaveLength(4);
    expect(right.mood.kind).toBe('joy');
  });

  it('rises straight with fewer animations, and slower', () => {
    const still = createBubbles({ ...SETTINGS, reducedMotion: true }, 5);
    const rising = stepBubbles(still, 16, NO_INPUT, SUM);
    const first = rising.bubbles[0];
    expect(first && bubbleX(rising, first)).toBe(first?.x);
    expect(still.speed).toBeLessThan(1);
  });
});

describe('Memory du compagnon', () => {
  const BOARD: SceneFeed = {
    key: 1,
    labels: ['3 × 4', '12', '5 × 6', '30', '2 m', '200 cm'],
    prompt: 'Trouve les paires',
    verdict: null,
  };
  const start = stepMemory(createMemory(SETTINGS, 9), 16, NO_INPUT, BOARD);
  const position = (world: MemoryWorld, index: number) =>
    world.cards.findIndex((card) => card.index === index);
  /** Touches the card showing label `index`. */
  const touchCard = (world: MemoryWorld, input: SceneInput, index: number) => {
    const box = cardBox(world, position(world, index), world.cards.length);
    return touch(input, box.x + box.width / 2, box.y + box.height / 2);
  };

  it('deals every card face down, each label once, on a board that fits the scene', () => {
    expect(start.cards.map((card) => card.index).sort()).toEqual([0, 1, 2, 3, 4, 5]);
    expect(start.cards.every((card) => card.face === 'down')).toBe(true);
    const last = cardBox(start, 5, 6);
    expect(last.x + last.width).toBeLessThanOrEqual(SETTINGS.width);
    expect(last.y + last.height).toBeLessThanOrEqual(SETTINGS.height * MEMORY.board);
  });

  it('turns two cards and asks the round; a guess is not « known »', () => {
    let input = touchCard(start, NO_INPUT, 0);
    let world = stepMemory(start, 16, input, BOARD);
    expect(world.cards[position(world, 0)]?.face).toBe('up');
    input = touchCard(world, lift(input), 3);
    world = stepMemory(world, 16, input, BOARD);
    expect(picks(world.events)).toEqual([{ type: 'pick', key: 1, indexes: [0, 3], known: false }]);
  });

  it('turns a wrong pair back after a look; picked again, the cards are known', () => {
    let input = touchCard(start, NO_INPUT, 0);
    let world = stepMemory(start, 16, input, BOARD);
    input = touchCard(world, lift(input), 3);
    world = stepMemory(world, 16, input, BOARD);
    const verdict = { key: 1, index: 0, indexes: [0, 3], correct: false, serial: 1 };
    world = stepMemory(world, 16, lift(input), { ...BOARD, verdict });
    expect(world.cards[position(world, 0)]?.backAt).toBeGreaterThan(0);
    const { world: back } = play(world, stepMemory, MEMORY.lookMs + 50, lift(input), {
      ...BOARD,
      verdict,
    });
    expect(back.cards.every((card) => card.face === 'down')).toBe(true);

    input = touchCard(back, lift(input), 0);
    world = stepMemory(back, 16, input, { ...BOARD, verdict });
    input = touchCard(world, lift(input), 3);
    world = stepMemory(world, 16, input, { ...BOARD, verdict });
    expect(picks(world.events)).toEqual([{ type: 'pick', key: 1, indexes: [0, 3], known: true }]);
  });

  it('keeps a pair found face up, and deals a new board with the next one', () => {
    const open: MemoryWorld = {
      ...start,
      cards: start.cards.map((card) =>
        card.index < 2 ? { ...card, face: 'up', t: 0, seen: true } : card,
      ),
      waiting: true,
    };
    const found = stepMemory(open, 16, NO_INPUT, {
      ...BOARD,
      verdict: { key: 1, index: 0, indexes: [0, 1], correct: true, serial: 1 },
    });
    expect(found.cards.filter((card) => card.face === 'matched')).toHaveLength(2);
    expect(found.mood.kind).toBe('joy');
    const next = stepMemory(found, 16, NO_INPUT, { ...BOARD, key: 2 });
    expect(next.cards.every((card) => card.face === 'down' && !card.seen)).toBe(true);
  });

  it('turns a card in two halves, or at once with fewer animations', () => {
    const card = { index: 0, face: 'up' as const, t: 60, seen: true, known: false, backAt: -1 };
    expect(cardTurn(start, card)).toEqual({ face: 'back', scale: expect.closeTo(0.54, 1) });
    expect(cardTurn(start, { ...card, t: 200 }).face).toBe('front');
    expect(cardTurn({ ...start, still: true }, card)).toEqual({ face: 'front', scale: 1 });
  });
});

describe('Course des croquettes', () => {
  const start = createRace(SETTINGS, 4);
  const runnerY = SETTINGS.height * RACE.runner;

  it('changes lane with a swipe, or a touch on one side', () => {
    let input = touch(NO_INPUT, 200, 400);
    let world = stepRace(start, 16, input, FEED);
    input = { ...input, x: 200 + SETTINGS.width * RACE.swipe + 1 };
    world = stepRace(world, 16, input, FEED);
    expect(world.lane).toBe(2);
    world = stepRace(world, 16, lift(input), FEED);
    expect(world.lane).toBe(2);
    // A touch on the left of the companion: one lane to the left.
    input = touch(lift(input), 20, 400);
    world = stepRace(world, 16, input, FEED);
    world = stepRace(world, 16, lift(input), FEED);
    expect(world.lane).toBe(1);
    const { world: there } = play(world, stepRace, 1000, lift(input));
    expect(there.x).toBeCloseTo(laneX(there, 1), 0);
  });

  it('brings the doors of the question, and takes the lane run in as the answer', () => {
    const { world, events } = play(start, stepRace, 5000);
    expect(choices(events)).toEqual([{ type: 'choice', key: 1, index: 1 }]);
    expect(world.doors[0]?.picked).toBe(1);
    const verdict = stepRace(world, 16, NO_INPUT, {
      ...FEED,
      verdict: { key: 1, index: 1, correct: false, serial: 1 },
    });
    expect(verdict.doors[0]?.outcome).toBe(-1);
    expect(verdict.mood.kind).toBe('sad');
    // An answered question never comes again; one run past without an answer does.
    expect(play(world, stepRace, 3000).world.doors).toEqual([]);
    // In the right lane, with two answers only: no door there.
    const right: RaceWorld = { ...start, key: 1, lane: 2, x: laneX(start, 2) };
    const missed = play(
      { ...right, doors: [{ key: 1, y: runnerY - 1, picked: -1, outcome: 0, t: 0 }] },
      stepRace,
      32,
      NO_INPUT,
      { ...FEED, labels: ['56', '54'] },
    );
    expect(choices(missed.events)).toEqual([]);
    expect(missed.world.doors.map((door) => door.picked)).toEqual([-2, -1]);
  });

  it('gives points for the croquettes in the companion’s lane', () => {
    const lined: RaceWorld = {
      ...start,
      key: 1,
      croquettes: [
        { lane: 1, y: runnerY - 30, taken: false, t: 0 },
        { lane: 0, y: runnerY - 30, taken: false, t: 0 },
      ],
      nextCroquettes: 10_000,
    };
    const { world, events } = play(lined, stepRace, 300);
    expect(events.filter((event) => event.type === 'points')).toEqual([
      { type: 'points', points: 10 },
    ]);
    expect(world.croquettes.filter((croquette) => croquette.taken)).toHaveLength(1);
  });
});

describe('the rules of a round', () => {
  it('reward a quick answer more', () => {
    expect(speedBonus(2000, 50, 4000, 12000)).toBe(50);
    expect(speedBonus(8000, 50, 4000, 12000)).toBe(25);
    expect(speedBonus(20_000, 50, 4000, 12000)).toBe(0);
  });

  it('add a combo bonus from 3 right answers in a row, and lose it on a mistake', () => {
    const three = [1, 2, 3].reduce((state) => rightAnswer(state, 100), fishingRules.start());
    expect(three).toMatchObject({ score: 310, combo: 3, right: 3, answered: 3 });
    expect(wrongAnswer(three)).toMatchObject({ score: 310, combo: 0, answered: 4 });
  });

  it('give 1 to 3 stars from the score', () => {
    expect(starsOf(0, fishingRules.stars)).toBe(0);
    expect(starsOf(300, fishingRules.stars)).toBe(1);
    expect(starsOf(5000, fishingRules.stars)).toBe(3);
    expect(fishingRules.onEnd(addPoints(fishingRules.start(), 800))).toEqual({
      score: 800,
      stars: 2,
    });
  });

  it('cost a heart for a wrong gem, never for a wrong passage', () => {
    expect(
      gemRainRules.onAnswer(gemRainRules.start(), { correct: false, timeMs: 3000 }).hearts,
    ).toBe(2);
    expect(flightRules.onAnswer(flightRules.start(), { correct: false, timeMs: 3000 }).hearts).toBe(
      3,
    );
  });

  it('ask the engine for as many answers as the scene shows', () => {
    expect(fishingRules.question).toEqual({ kind: 'choices', count: 3 });
    expect(gemRainRules.question).toEqual({ kind: 'choices', count: 3 });
    expect(flightRules.question).toEqual({ kind: 'choices', count: 2 });
    expect(bubblesRules.question).toEqual({ kind: 'sum', count: 6 });
    expect(memoryRules).toMatchObject({ question: { kind: 'pair' }, board: 6 });
    expect(raceRules.question).toEqual({ kind: 'choices', count: RACE.lanes.length });
    expect(EMPTY_FEED.labels).toEqual([]);
  });

  it('last 1 to 3 minutes', () => {
    for (const rules of [
      fishingRules,
      gemRainRules,
      flightRules,
      bubblesRules,
      memoryRules,
      raceRules,
    ]) {
      expect(rules.seconds).toBeGreaterThanOrEqual(60);
      expect(rules.seconds).toBeLessThanOrEqual(180);
    }
  });
});
