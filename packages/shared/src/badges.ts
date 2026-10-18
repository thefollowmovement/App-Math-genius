/**
 * Badges, earned on the server (supabase/migrations/*_badges.sql) when one of the child's
 * measures reaches a threshold. The migration holds the same catalog (badges.test.ts compares
 * them). Codes are stored with each child's badges: never rename one.
 */

export const BADGE_CATEGORIES = ['regularity', 'mastery', 'discovery', 'progression'] as const;
export type BadgeCategory = (typeof BADGE_CATEGORIES)[number];

/** What the server measures (private.badge_metrics), from regraded answers only. */
export const BADGE_METRICS = [
  /** Best streak, in days. */
  'streak_best',
  /** Daily sessions validated. */
  'validated_daily',
  /** Sessions finished on a Saturday or a Sunday. */
  'weekend_sessions',
  /** Streaks started again after one of 3 days or more was broken. */
  'comebacks',
  'mastered_skills',
  'tables_mastered',
  /** Mental calculation skills mastered. */
  'automatisms_mastered',
  /** Domains with at least one skill mastered. */
  'mastered_domains',
  /** Most right answers in a row in a session, counted as for XP. */
  'best_combo',
  /** Sessions of 10 answers or more, all right. */
  'perfect_sessions',
  'correct_answers',
  'bonus_sessions',
  'rare_chests',
  /** Skills with at least one right answer. */
  'explored_skills',
  'gems_earned',
  'level',
] as const;
export type BadgeMetric = (typeof BADGE_METRICS)[number];

type BadgeDefinition = {
  code: string;
  category: BadgeCategory;
  metric: BadgeMetric;
  threshold: number;
};

export const BADGES = [
  { code: 'streak-3', category: 'regularity', metric: 'streak_best', threshold: 3 },
  { code: 'streak-7', category: 'regularity', metric: 'streak_best', threshold: 7 },
  { code: 'streak-14', category: 'regularity', metric: 'streak_best', threshold: 14 },
  { code: 'streak-30', category: 'regularity', metric: 'streak_best', threshold: 30 },
  { code: 'streak-50', category: 'regularity', metric: 'streak_best', threshold: 50 },
  { code: 'streak-100', category: 'regularity', metric: 'streak_best', threshold: 100 },
  { code: 'streak-365', category: 'regularity', metric: 'streak_best', threshold: 365 },
  { code: 'sessions-1', category: 'regularity', metric: 'validated_daily', threshold: 1 },
  { code: 'sessions-10', category: 'regularity', metric: 'validated_daily', threshold: 10 },
  { code: 'sessions-25', category: 'regularity', metric: 'validated_daily', threshold: 25 },
  { code: 'sessions-50', category: 'regularity', metric: 'validated_daily', threshold: 50 },
  { code: 'sessions-100', category: 'regularity', metric: 'validated_daily', threshold: 100 },
  { code: 'weekend', category: 'regularity', metric: 'weekend_sessions', threshold: 1 },
  { code: 'comeback', category: 'regularity', metric: 'comebacks', threshold: 1 },
  { code: 'mastery-1', category: 'mastery', metric: 'mastered_skills', threshold: 1 },
  { code: 'mastery-5', category: 'mastery', metric: 'mastered_skills', threshold: 5 },
  { code: 'mastery-10', category: 'mastery', metric: 'mastered_skills', threshold: 10 },
  { code: 'mastery-25', category: 'mastery', metric: 'mastered_skills', threshold: 25 },
  { code: 'tables', category: 'mastery', metric: 'tables_mastered', threshold: 1 },
  { code: 'mental-math', category: 'mastery', metric: 'automatisms_mastered', threshold: 3 },
  { code: 'all-domains', category: 'mastery', metric: 'mastered_domains', threshold: 4 },
  { code: 'combo-10', category: 'mastery', metric: 'best_combo', threshold: 10 },
  { code: 'combo-25', category: 'mastery', metric: 'best_combo', threshold: 25 },
  { code: 'perfect-5', category: 'mastery', metric: 'perfect_sessions', threshold: 5 },
  { code: 'perfect-20', category: 'mastery', metric: 'perfect_sessions', threshold: 20 },
  { code: 'answers-100', category: 'mastery', metric: 'correct_answers', threshold: 100 },
  { code: 'answers-1000', category: 'mastery', metric: 'correct_answers', threshold: 1000 },
  { code: 'answers-5000', category: 'mastery', metric: 'correct_answers', threshold: 5000 },
  { code: 'perfect-1', category: 'discovery', metric: 'perfect_sessions', threshold: 1 },
  { code: 'bonus-1', category: 'discovery', metric: 'bonus_sessions', threshold: 1 },
  { code: 'rare-chest', category: 'discovery', metric: 'rare_chests', threshold: 1 },
  { code: 'explorer-10', category: 'discovery', metric: 'explored_skills', threshold: 10 },
  { code: 'explorer-25', category: 'discovery', metric: 'explored_skills', threshold: 25 },
  { code: 'gems-100', category: 'discovery', metric: 'gems_earned', threshold: 100 },
  { code: 'level-5', category: 'progression', metric: 'level', threshold: 5 },
  { code: 'level-10', category: 'progression', metric: 'level', threshold: 10 },
  { code: 'level-20', category: 'progression', metric: 'level', threshold: 20 },
] as const satisfies readonly BadgeDefinition[];

export type Badge = (typeof BADGES)[number];
export type BadgeCode = Badge['code'];

const BADGE_CODES: ReadonlySet<string> = new Set(BADGES.map((badge) => badge.code));

export const isBadgeCode = (code: string): code is BadgeCode => BADGE_CODES.has(code);

/** Where a child stands towards a badge, for a progress bar: capped at the threshold. */
export function badgeProgress(badge: Badge, metrics: Partial<Record<BadgeMetric, number>>) {
  const value = Math.min(metrics[badge.metric] ?? 0, badge.threshold);
  return { value, threshold: badge.threshold, done: value >= badge.threshold };
}
