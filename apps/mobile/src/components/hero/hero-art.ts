import type { HeroId, HeroLook, HeroPose, OutfitId } from '@math-genius/shared';

import novaBust from '../../../assets/heroes/nova/bust.webp';
import novaVictory from '../../../assets/heroes/nova/victory.webp';
import novaEncourage from '../../../assets/heroes/nova/encourage.webp';
import novaThink from '../../../assets/heroes/nova/think.webp';
import novaCard from '../../../assets/heroes/nova/card.webp';
import junoBust from '../../../assets/heroes/juno/bust.webp';
import junoVictory from '../../../assets/heroes/juno/victory.webp';
import junoEncourage from '../../../assets/heroes/juno/encourage.webp';
import junoThink from '../../../assets/heroes/juno/think.webp';
import junoCard from '../../../assets/heroes/juno/card.webp';
import mikaBust from '../../../assets/heroes/mika/bust.webp';
import mikaVictory from '../../../assets/heroes/mika/victory.webp';
import mikaEncourage from '../../../assets/heroes/mika/encourage.webp';
import mikaThink from '../../../assets/heroes/mika/think.webp';
import mikaCard from '../../../assets/heroes/mika/card.webp';
import kaiBust from '../../../assets/heroes/kai/bust.webp';
import kaiVictory from '../../../assets/heroes/kai/victory.webp';
import kaiEncourage from '../../../assets/heroes/kai/encourage.webp';
import kaiThink from '../../../assets/heroes/kai/think.webp';
import kaiCard from '../../../assets/heroes/kai/card.webp';
import taroBust from '../../../assets/heroes/taro/bust.webp';
import taroVictory from '../../../assets/heroes/taro/victory.webp';
import taroEncourage from '../../../assets/heroes/taro/encourage.webp';
import taroThink from '../../../assets/heroes/taro/think.webp';
import taroCard from '../../../assets/heroes/taro/card.webp';
import leoBust from '../../../assets/heroes/leo/bust.webp';
import leoVictory from '../../../assets/heroes/leo/victory.webp';
import leoEncourage from '../../../assets/heroes/leo/encourage.webp';
import leoThink from '../../../assets/heroes/leo/think.webp';
import leoCard from '../../../assets/heroes/leo/card.webp';

import { HERO_OUTFITS } from './hero-outfits';

/**
 * How each hero is drawn. Today: one still picture per pose in its stage outfit, the same poses
 * in each outfit (hero-outfits.ts), and the hero on stage for the hero picker's card (WebP in
 * three densities, made by `pnpm heroes:images` from docs/design/personnages and
 * docs/design/tenues). Tomorrow a hero may be an animation:
 *
 *   { kind: 'rive'; file: number; artboard: string; stateMachine: string }
 *
 * where each pose is a state, and the cosmetics drawn as layers (Cosmetic.visual.kind 'layer')
 * are layers switched on by name. Only HeroView reads this: screens, the shop and the badges do
 * not change.
 */
/** An image is a bundled asset id (see src/types/images.d.ts). */
export type HeroArt = {
  kind: 'images';
  poses: Record<HeroPose, number>;
  outfits: Record<OutfitId, Record<HeroPose, number>>;
  card: number;
};

export const HERO_ART: Record<HeroId, HeroArt> = {
  nova: {
    kind: 'images',
    poses: { bust: novaBust, victory: novaVictory, encourage: novaEncourage, think: novaThink },
    outfits: HERO_OUTFITS.nova,
    card: novaCard,
  },
  juno: {
    kind: 'images',
    poses: { bust: junoBust, victory: junoVictory, encourage: junoEncourage, think: junoThink },
    outfits: HERO_OUTFITS.juno,
    card: junoCard,
  },
  mika: {
    kind: 'images',
    poses: { bust: mikaBust, victory: mikaVictory, encourage: mikaEncourage, think: mikaThink },
    outfits: HERO_OUTFITS.mika,
    card: mikaCard,
  },
  kai: {
    kind: 'images',
    poses: { bust: kaiBust, victory: kaiVictory, encourage: kaiEncourage, think: kaiThink },
    outfits: HERO_OUTFITS.kai,
    card: kaiCard,
  },
  taro: {
    kind: 'images',
    poses: { bust: taroBust, victory: taroVictory, encourage: taroEncourage, think: taroThink },
    outfits: HERO_OUTFITS.taro,
    card: taroCard,
  },
  leo: {
    kind: 'images',
    poses: { bust: leoBust, victory: leoVictory, encourage: leoEncourage, think: leoThink },
    outfits: HERO_OUTFITS.leo,
    card: leoCard,
  },
};

/** The picture of a pose of the hero, in the outfit it wears. */
export function heroPicture({ hero, outfit }: HeroLook, pose: HeroPose): number {
  const art = HERO_ART[hero];
  return outfit ? art.outfits[outfit][pose] : art.poses[pose];
}
