/**
 * Weekly challenges (docs/specs.md, Gamification): one a week, the same for every child, from
 * Monday to Sunday in the family's time zone. The server measures it on the week's regraded
 * sessions and pays its gems once (supabase/migrations/*_challenges.sql, same catalog and same
 * rotation: challenges.test.ts and challenges.test.sql share their cases).
 */

/** What a challenge counts over the week (private.week_metrics). */
export const CHALLENGE_METRICS = [
  'validated_daily',
  'correct_answers',
  'best_combo',
  'explored_skills',
  'perfect_sessions',
  'minutes',
] as const;
export type ChallengeMetric = (typeof CHALLENGE_METRICS)[number];

type ChallengeDefinition = {
  code: string;
  metric: ChallengeMetric;
  threshold: number;
  gems: number;
};

/** In rotation order: week 0 starts on Monday 5 January 2026. */
export const CHALLENGES = [
  { code: 'daily-5', metric: 'validated_daily', threshold: 5, gems: 20 },
  { code: 'correct-150', metric: 'correct_answers', threshold: 150, gems: 20 },
  { code: 'combo-10', metric: 'best_combo', threshold: 10, gems: 15 },
  { code: 'skills-6', metric: 'explored_skills', threshold: 6, gems: 20 },
  { code: 'perfect-1', metric: 'perfect_sessions', threshold: 1, gems: 25 },
  { code: 'minutes-60', metric: 'minutes', threshold: 60, gems: 20 },
] as const satisfies readonly ChallengeDefinition[];

export type Challenge = (typeof CHALLENGES)[number];
export type ChallengeCode = Challenge['code'];

const CHALLENGE_CODES: ReadonlySet<string> = new Set(CHALLENGES.map((challenge) => challenge.code));
export const isChallengeCode = (code: string): code is ChallengeCode => CHALLENGE_CODES.has(code);

const ROTATION_START = Date.UTC(2026, 0, 5);
const WEEK_MS = 7 * 86_400_000;

/** The Monday of an ISO date's week (yyyy-mm-dd). */
export function weekStart(date: string): string {
  const [year = 0, month = 1, day = 1] = date.split('-').map(Number);
  const time = Date.UTC(year, month - 1, day);
  const weekday = (new Date(time).getUTCDay() + 6) % 7;
  return new Date(time - weekday * 86_400_000).toISOString().slice(0, 10);
}

/** The challenge of the week that contains `date`. */
export function challengeOfWeek(date: string): Challenge {
  const monday = weekStart(date);
  const [year = 0, month = 1, day = 1] = monday.split('-').map(Number);
  const week = Math.round((Date.UTC(year, month - 1, day) - ROTATION_START) / WEEK_MS);
  const index = ((week % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length;
  const challenge = CHALLENGES[index];
  if (!challenge) throw new Error('No challenge');
  return challenge;
}
