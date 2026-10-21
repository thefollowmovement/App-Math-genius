import type { MiniGameId } from '@math-genius/shared';

import { flightRules } from './flight/rules';
import { fishingRules } from './fishing/rules';
import { gemRainRules } from './gem-rain/rules';
import type { GameRules } from './round';

/**
 * Each game's rules, without its scene (which needs Skia, loaded on demand: stage.tsx). A game
 * without rules here is shown as coming soon.
 */
export const GAME_RULES: Partial<Record<MiniGameId, GameRules>> = {
  'peche-eclair': fishingRules,
  'pluie-de-gemmes': gemRainRules,
  'vol-du-chaton': flightRules,
};

export const rulesOf = (id: MiniGameId): GameRules | null => GAME_RULES[id] ?? null;
