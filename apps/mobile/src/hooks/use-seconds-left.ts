import { useSyncExternalStore } from 'react';

const nowInSeconds = () => Math.floor(Date.now() / 1000);

function subscribeToClock(onTick: () => void) {
  const timer = setInterval(onTick, 1000);
  return () => clearInterval(timer);
}

export function secondsUntil(deadline: Date, nowSeconds: number): number {
  return Math.max(0, Math.ceil(deadline.getTime() / 1000 - nowSeconds));
}

/** Seconds left before `deadline`, refreshed every second; 0 once it has passed. */
export function useSecondsLeft(deadline: Date | undefined): number {
  const now = useSyncExternalStore(subscribeToClock, nowInSeconds, nowInSeconds);
  return deadline ? secondsUntil(deadline, now) : 0;
}
