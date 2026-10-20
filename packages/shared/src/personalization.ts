/**
 * Personalization (docs/specs.md, Profil d'apprentissage évolutif): universes and learning profile,
 * which the parent agrees to separately for each child.
 */

/** Version of the text the parent reads before agreeing: a new text asks for a new consent. */
export const PERSONALIZATION_CONSENT_VERSION = '2026-10';

/** « Tes goûts ont changé ? »: the questionnaire comes back after 3 months. */
export const UNIVERSE_RECHECK_DAYS = 91;

const DAY_MS = 86_400_000;

/**
 * Whether « Ton univers » should be asked: never answered or skipped, 3 months ago, or before this
 * school year's start (1 September).
 */
export function universeDue(askedAt: string | null, now: Date): boolean {
  if (!askedAt) return true;
  const asked = Date.parse(askedAt);
  if (Number.isNaN(asked) || now.getTime() - asked >= UNIVERSE_RECHECK_DAYS * DAY_MS) return true;
  const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return asked < new Date(year, 8, 1).getTime();
}
