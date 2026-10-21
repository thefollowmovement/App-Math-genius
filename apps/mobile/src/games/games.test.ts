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
    expect(EMPTY_FEED.labels).toEqual([]);
  });
});
