import type { Theme } from '../types';
import { kawaii } from './kawaii';

/** Every available theme. New themes only need to be registered here. */
export const themes = { kawaii } as const satisfies Record<string, Theme>;

export type ThemeId = keyof typeof themes;
