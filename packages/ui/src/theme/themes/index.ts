import type { Theme } from '../types';
import { kawaii } from './kawaii';
import { manga } from './manga';
import { space } from './space';

/**
 * Every available theme. A new theme needs its token file, a line here, its fonts in
 * apps/mobile/src/lib/fonts.ts, its texts in fr.ts and its id in the children_theme check
 * (supabase/migrations/*_child_look.sql): no screen code.
 */
export const themes = { kawaii, manga, space } as const satisfies Record<string, Theme>;

export type ThemeId = keyof typeof themes;

export const THEME_IDS = Object.keys(themes) as ThemeId[];

export const isThemeId = (id: string): id is ThemeId => id in themes;

/** The theme of a stored id; an unknown one (from a newer app) falls back on kawaii. */
export const themeOf = (id: string | null | undefined) =>
  id && isThemeId(id) ? themes[id] : kawaii;
