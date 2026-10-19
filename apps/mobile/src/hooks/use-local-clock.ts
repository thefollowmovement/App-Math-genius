import { useSyncExternalStore } from 'react';

import { localDate, localMinute } from '@/utils/local-date';

const snapshot = () => {
  const now = new Date();
  return `${localDate(now)}|${localMinute(now)}`;
};

function subscribeToClock(onTick: () => void) {
  const timer = setInterval(onTick, 15_000);
  return () => clearInterval(timer);
}

/** Today's date and the minute of the day, so that a deadline passing shows without a reload. */
export function useLocalClock(): { date: string; minute: number } {
  const [date = '', minute = '0'] = useSyncExternalStore(
    subscribeToClock,
    snapshot,
    snapshot,
  ).split('|');
  return { date, minute: Number(minute) };
}
