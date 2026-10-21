/**
 * What a game's scene and its round say to each other. The scene lives on the UI thread (its
 * world advances every frame in a worklet); the round lives on the JS thread (the engine asks and
 * grades the questions). They meet through two shared values written by one side each: the feed
 * (round → scene) and the events (scene → round, sent with scheduleOnRN).
 */

export type GameSound = 'right' | 'wrong' | 'pop' | 'crunch' | 'splash' | 'flap' | 'thud' | 'flip';

export type SceneEvent =
  /** The child picked an answer: the `index`-th label of the question `key`. */
  | { type: 'choice'; key: number; index: number }
  /** A pair of labels (memory, bubbles): the indexes picked together. */
  | { type: 'pick'; key: number; indexes: number[] }
  /** Points with no question behind them: croquettes, a pillar passed. */
  | { type: 'points'; points: number }
  /** A bomb, a pillar: one heart less. */
  | { type: 'hurt' }
  | { type: 'sound'; sound: GameSound }
  /** The round's time is up (sent by the loop, not by a scene). */
  | { type: 'time' };

/** The answers a question shows, and what became of the last one picked. */
export type SceneFeed = {
  /** Changes with each new question; 0 before the first. */
  key: number;
  labels: readonly string[];
  /** The question itself, for the banner: also drawn by some scenes. */
  prompt: string;
  /** The engine's verdict on the last pick, for the scene to react (a wrong gem turns to a bomb). */
  verdict: { key: number; index: number; correct: boolean; serial: number } | null;
};

export const EMPTY_FEED: SceneFeed = { key: 0, labels: [], prompt: '', verdict: null };

/** Touches, counted so that none is lost between two frames. */
export type SceneInput = {
  /** Taps so far (a flap, « Pêcher ! »). */
  taps: number;
  /** Where the finger is, in the scene's points; null when it is up. */
  x: number | null;
  y: number | null;
  /** Touches that began, with where they began. */
  touches: number;
  touchX: number;
  touchY: number;
};

export const NO_INPUT: SceneInput = { taps: 0, x: null, y: null, touches: 0, touchX: 0, touchY: 0 };

/** Every world carries the events of its last step (usually none). */
export type WorldBase = { events: readonly SceneEvent[] };

/** A shared empty list, so that a quiet frame allocates nothing. */
export const NO_EVENTS: readonly SceneEvent[] = [];

/** How the round wants the scene to move. */
export type SceneSettings = {
  width: number;
  height: number;
  /** « Réduire les animations »: slower, and no shaking. */
  reducedMotion: boolean;
};

/** Slower speeds when the child asked for fewer animations (docs/design/mini-jeux.md). */
export const REDUCED_SPEED = 0.7;

export const speedOf = (settings: SceneSettings) => {
  'worklet';
  return settings.reducedMotion ? REDUCED_SPEED : 1;
};

/** How the companion feels, since when (in the scene's time): it jumps for joy, droops a little. */
export type Mood = { kind: 'idle' | 'joy' | 'sad'; since: number };

export const IDLE: Mood = { kind: 'idle', since: 0 };
