import type { SharedValue } from 'react-native-reanimated';

import type { GameArt } from './art';
import type { Palette } from './draw';
import type { SceneEvent, SceneFeed, SceneInput, SceneSettings } from './scene';

/** What the stage gives every scene. */
export type SceneProps = {
  settings: SceneSettings;
  palette: Palette;
  art: GameArt;
  feed: SharedValue<SceneFeed>;
  input: SharedValue<SceneInput>;
  /** Time played, in milliseconds (the screen's timer reads it too). */
  clock: SharedValue<number>;
  limitMs: number;
  running: boolean;
  /** The scene's own randomness (where the fish swim), not the questions'. */
  seed: number;
  onEvent: (event: SceneEvent) => void;
};
