import { strings } from '@/i18n';

/** The title earned at a level: the last one whose first level is reached. */
export function levelTitle(level: number): string {
  const titles = strings.rewards.titles;
  return titles.reduce<string>(
    (title, [from, name]) => (level >= from ? name : title),
    titles[0][1],
  );
}

/** Share of the level done, for the XP bar (0 to 100). */
export const levelPercent = (inLevel: number, toNext: number) =>
  toNext > 0 ? Math.min(100, Math.max(0, Math.round((inLevel / toNext) * 100))) : 100;
