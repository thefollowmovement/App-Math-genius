import {
  BADGES,
  BADGE_CATEGORIES,
  BADGE_METRICS,
  badgeProgress,
  isBadgeCode,
  type Badge,
  type BadgeCategory,
  type BadgeCode,
  type BadgeMetric,
} from '@math-genius/shared';

/** Badges as the server grants them and as the badges screen shows them (testable). */

export type EarnedBadgeRow = { badge_code: string; earned_at: string };
export type BadgeMetrics = Partial<Record<BadgeMetric, number>>;
export type BadgesData = { earned: EarnedBadgeRow[]; metrics: BadgeMetrics };

export type BadgeView = Badge & { earnedAt: string | null; value: number };
export type BadgeGroup = { category: BadgeCategory; badges: BadgeView[] };

const isMetric = (key: string): key is BadgeMetric =>
  (BADGE_METRICS as readonly string[]).includes(key);

/** What child_badge_metrics returns: known measures only. */
export function parseMetrics(value: unknown): BadgeMetrics {
  if (typeof value !== 'object' || value === null) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [BadgeMetric, number] => isMetric(entry[0]) && typeof entry[1] === 'number',
    ),
  );
}

/** Every badge of the catalog by category: earned ones first, each part in catalog order. */
export function badgeGroups({ earned, metrics }: BadgesData): BadgeGroup[] {
  const earnedAt = new Map(earned.map((row) => [row.badge_code, row.earned_at]));
  return BADGE_CATEGORIES.map((category) => {
    const badges = BADGES.filter((badge) => badge.category === category).map((badge) => {
      const at = earnedAt.get(badge.code) ?? null;
      const { value } = badgeProgress(badge, metrics);
      return { ...badge, earnedAt: at, value: at ? badge.threshold : value };
    });
    return {
      category,
      badges: [...badges.filter((b) => b.earnedAt), ...badges.filter((b) => !b.earnedAt)],
    };
  });
}

/** Earned badges this version of the app knows (a newer server may have more). */
export const knownBadges = (codes: readonly string[]): BadgeCode[] => codes.filter(isBadgeCode);

export const BADGE_COUNT = BADGES.length;
