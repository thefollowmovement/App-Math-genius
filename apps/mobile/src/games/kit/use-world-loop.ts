import { useCallback, useEffect, useRef } from 'react';
import { useFrameCallback, type FrameInfo, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import type { SceneEvent, SceneFeed, SceneInput, WorldBase } from './scene';

/** After a hiccup, a frame moves the world by this much at most: the game slows, never jumps. */
const MAX_STEP_MS = 50;
const FRAME_MS = 1000 / 60;

/** A scene's rule: the next world, from the last one (a worklet, pure: no shared value inside). */
export type Step<W extends WorldBase> = (
  world: W,
  dt: number,
  input: SceneInput,
  feed: SceneFeed,
) => W;

/**
 * Runs a scene on the UI thread: every frame, the world takes a step and its events go to the
 * round (JS thread). Nothing renders with React meanwhile: the scene draws the world itself.
 * `clock` counts the time played (not while paused); past `limitMs`, the round hears « time ».
 */
export function useWorldLoop<W extends WorldBase>({
  world,
  step,
  input,
  feed,
  clock,
  limitMs,
  running,
  onEvent,
}: {
  world: SharedValue<W>;
  step: Step<W>;
  input: SharedValue<SceneInput>;
  feed: SharedValue<SceneFeed>;
  clock: SharedValue<number>;
  limitMs: number;
  running: boolean;
  onEvent: (event: SceneEvent) => void;
}) {
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  });
  const emit = useCallback((event: SceneEvent) => handler.current(event), []);

  const frame = useCallback(
    (info: FrameInfo) => {
      'worklet';
      const dt = Math.min(MAX_STEP_MS, info.timeSincePreviousFrame ?? FRAME_MS);
      const before = clock.get();
      clock.set(before + dt);
      if (before < limitMs && before + dt >= limitMs) scheduleOnRN(emit, { type: 'time' });
      const next = step(world.get(), dt, input.get(), feed.get());
      for (const event of next.events) scheduleOnRN(emit, event);
      world.set(next);
    },
    [clock, emit, feed, input, limitMs, step, world],
  );
  const loop = useFrameCallback(frame, false);
  useEffect(() => {
    loop.setActive(running);
  }, [loop, running]);
}
