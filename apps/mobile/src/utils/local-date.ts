const pad = (value: number) => String(value).padStart(2, '0');

/** Calendar day on the device (YYYY-MM-DD): a session belongs to the child's day, not to UTC. */
export function localDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Minutes since midnight on the device, to compare with routine times. */
export function localMinute(date: Date = new Date()): number {
  return date.getHours() * 60 + date.getMinutes();
}
