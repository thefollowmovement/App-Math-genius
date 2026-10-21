import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import type { CompanionId } from '@math-genius/shared';
import { useFont, useImage, type SkFont, type SkImage } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { COMPANION_ART } from '@/components/companion/companion-art';

import { assetSource } from './asset-source';

import bombe from '../../../assets/games/bombe.webp';
import bouchon from '../../../assets/games/bouchon.webp';
import bulle from '../../../assets/games/bulle.webp';
import coeur from '../../../assets/games/coeur.webp';
import croquettes from '../../../assets/games/croquettes.webp';
import fondPeche from '../../../assets/games/fond-peche.webp';
import fondPluie from '../../../assets/games/fond-pluie.webp';
import fondVol from '../../../assets/games/fond-vol.webp';
import gemme from '../../../assets/games/gemme.webp';
import pilier from '../../../assets/games/pilier-nuage.webp';
import poisson from '../../../assets/games/poisson.webp';

/**
 * The games' pictures (docs/design/jeux, made WebP by `pnpm heroes:images`) and the companion, as
 * Skia images for the scenes. Each is null until it is loaded: the scenes draw what they have.
 */

export const BACKGROUNDS = { peche: fondPeche, pluie: fondPluie, vol: fondVol } as const;
export type Background = keyof typeof BACKGROUNDS;

const SPRITES = { bombe, bouchon, bulle, coeur, croquettes, gemme, pilier, poisson } as const;
export type Sprite = keyof typeof SPRITES;

export type GameArt = {
  background: SkImage | null;
  sprites: Record<Sprite, SkImage | null>;
  companion: SkImage | null;
  /** The labels' font (Fredoka, the kawaii theme's), at the sizes the scenes use. */
  font: SkFont | null;
  bigFont: SkFont | null;
};

export const LABEL_SIZE = 22;
export const BIG_LABEL_SIZE = 30;

export function useGameArt(background: Background, companion: CompanionId): GameArt {
  const bombe = useImage(assetSource(SPRITES.bombe));
  const bouchon = useImage(assetSource(SPRITES.bouchon));
  const bulle = useImage(assetSource(SPRITES.bulle));
  const coeur = useImage(assetSource(SPRITES.coeur));
  const croquettes = useImage(assetSource(SPRITES.croquettes));
  const gemme = useImage(assetSource(SPRITES.gemme));
  const pilier = useImage(assetSource(SPRITES.pilier));
  const poisson = useImage(assetSource(SPRITES.poisson));
  const scene = useImage(assetSource(BACKGROUNDS[background]));
  const friend = useImage(assetSource(COMPANION_ART[companion][1]));
  const font = useFont(assetSource(Fredoka_600SemiBold), LABEL_SIZE);
  const bigFont = useFont(assetSource(Fredoka_600SemiBold), BIG_LABEL_SIZE);
  // One object while nothing loads: the scene's picture is made again only when something did.
  return useMemo(
    () => ({
      background: scene,
      sprites: { bombe, bouchon, bulle, coeur, croquettes, gemme, pilier, poisson },
      companion: friend,
      font,
      bigFont,
    }),
    [
      scene,
      bombe,
      bouchon,
      bulle,
      coeur,
      croquettes,
      gemme,
      pilier,
      poisson,
      friend,
      font,
      bigFont,
    ],
  );
}
