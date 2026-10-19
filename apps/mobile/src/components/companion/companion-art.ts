import type { CompanionId, CompanionStage } from '@math-genius/shared';

import hibou from '../../../assets/companions/hibou/stage-1.webp';
import lapin from '../../../assets/companions/lapin/stage-1.webp';
import dragon from '../../../assets/companions/dragon/stage-1.webp';
import licorne from '../../../assets/companions/licorne/stage-1.webp';
import tigre from '../../../assets/companions/tigre/stage-1.webp';
import renard from '../../../assets/companions/renard/stage-1.webp';
import chat from '../../../assets/companions/chat/stage-1.webp';
import phenix from '../../../assets/companions/phenix/stage-1.webp';

/**
 * How each companion is drawn: one square picture per stage of its evolution (WebP in three
 * densities, made by `pnpm heroes:images` from docs/design/compagnons). A new stage is a new
 * entry of COMPANION_STAGES and a picture for each companion. Only CompanionPicture reads this.
 * An image is a bundled asset id (see src/types/images.d.ts).
 */
export const COMPANION_ART: Record<CompanionId, Record<CompanionStage, number>> = {
  hibou: { 1: hibou },
  lapin: { 1: lapin },
  dragon: { 1: dragon },
  licorne: { 1: licorne },
  tigre: { 1: tigre },
  renard: { 1: renard },
  chat: { 1: chat },
  phenix: { 1: phenix },
};
