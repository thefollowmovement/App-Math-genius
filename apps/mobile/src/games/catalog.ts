import type { MiniGameId } from '@math-genius/shared';

import { bubblesRules } from './bubbles/rules';
import { flightRules } from './flight/rules';
import { fishingRules } from './fishing/rules';
import { gemRainRules } from './gem-rain/rules';
import { memoryRules } from './memory/rules';
import { raceRules } from './race/rules';
import type { GameRules } from './round';

/** Each game's rules, without its scene (which needs Skia, loaded on demand: stage.tsx). */
export const GAME_RULES: Record<MiniGameId, GameRules> = {
  'peche-eclair': fishingRules,
  'pluie-de-gemmes': gemRainRules,
  'vol-du-chaton': flightRules,
  'bulles-magiques': bubblesRules,
  'memory-du-compagnon': memoryRules,
  'course-des-croquettes': raceRules,
};

export const rulesOf = (id: MiniGameId): GameRules => GAME_RULES[id];
