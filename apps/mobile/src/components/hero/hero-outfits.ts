import type { HeroId, HeroPose, OutfitId } from '@math-genius/shared';

import novaSportBust from '../../../assets/heroes/nova/sport/bust.webp';
import novaSportVictory from '../../../assets/heroes/nova/sport/victory.webp';
import novaSportEncourage from '../../../assets/heroes/nova/sport/encourage.webp';
import novaSportThink from '../../../assets/heroes/nova/sport/think.webp';
import novaAstronauteBust from '../../../assets/heroes/nova/astronaute/bust.webp';
import novaAstronauteVictory from '../../../assets/heroes/nova/astronaute/victory.webp';
import novaAstronauteEncourage from '../../../assets/heroes/nova/astronaute/encourage.webp';
import novaAstronauteThink from '../../../assets/heroes/nova/astronaute/think.webp';
import novaMagieBust from '../../../assets/heroes/nova/magie/bust.webp';
import novaMagieVictory from '../../../assets/heroes/nova/magie/victory.webp';
import novaMagieEncourage from '../../../assets/heroes/nova/magie/encourage.webp';
import novaMagieThink from '../../../assets/heroes/nova/magie/think.webp';
import junoSportBust from '../../../assets/heroes/juno/sport/bust.webp';
import junoSportVictory from '../../../assets/heroes/juno/sport/victory.webp';
import junoSportEncourage from '../../../assets/heroes/juno/sport/encourage.webp';
import junoSportThink from '../../../assets/heroes/juno/sport/think.webp';
import junoAstronauteBust from '../../../assets/heroes/juno/astronaute/bust.webp';
import junoAstronauteVictory from '../../../assets/heroes/juno/astronaute/victory.webp';
import junoAstronauteEncourage from '../../../assets/heroes/juno/astronaute/encourage.webp';
import junoAstronauteThink from '../../../assets/heroes/juno/astronaute/think.webp';
import junoMagieBust from '../../../assets/heroes/juno/magie/bust.webp';
import junoMagieVictory from '../../../assets/heroes/juno/magie/victory.webp';
import junoMagieEncourage from '../../../assets/heroes/juno/magie/encourage.webp';
import junoMagieThink from '../../../assets/heroes/juno/magie/think.webp';
import mikaSportBust from '../../../assets/heroes/mika/sport/bust.webp';
import mikaSportVictory from '../../../assets/heroes/mika/sport/victory.webp';
import mikaSportEncourage from '../../../assets/heroes/mika/sport/encourage.webp';
import mikaSportThink from '../../../assets/heroes/mika/sport/think.webp';
import mikaAstronauteBust from '../../../assets/heroes/mika/astronaute/bust.webp';
import mikaAstronauteVictory from '../../../assets/heroes/mika/astronaute/victory.webp';
import mikaAstronauteEncourage from '../../../assets/heroes/mika/astronaute/encourage.webp';
import mikaAstronauteThink from '../../../assets/heroes/mika/astronaute/think.webp';
import mikaMagieBust from '../../../assets/heroes/mika/magie/bust.webp';
import mikaMagieVictory from '../../../assets/heroes/mika/magie/victory.webp';
import mikaMagieEncourage from '../../../assets/heroes/mika/magie/encourage.webp';
import mikaMagieThink from '../../../assets/heroes/mika/magie/think.webp';
import kaiSportBust from '../../../assets/heroes/kai/sport/bust.webp';
import kaiSportVictory from '../../../assets/heroes/kai/sport/victory.webp';
import kaiSportEncourage from '../../../assets/heroes/kai/sport/encourage.webp';
import kaiSportThink from '../../../assets/heroes/kai/sport/think.webp';
import kaiAstronauteBust from '../../../assets/heroes/kai/astronaute/bust.webp';
import kaiAstronauteVictory from '../../../assets/heroes/kai/astronaute/victory.webp';
import kaiAstronauteEncourage from '../../../assets/heroes/kai/astronaute/encourage.webp';
import kaiAstronauteThink from '../../../assets/heroes/kai/astronaute/think.webp';
import kaiMagieBust from '../../../assets/heroes/kai/magie/bust.webp';
import kaiMagieVictory from '../../../assets/heroes/kai/magie/victory.webp';
import kaiMagieEncourage from '../../../assets/heroes/kai/magie/encourage.webp';
import kaiMagieThink from '../../../assets/heroes/kai/magie/think.webp';
import taroSportBust from '../../../assets/heroes/taro/sport/bust.webp';
import taroSportVictory from '../../../assets/heroes/taro/sport/victory.webp';
import taroSportEncourage from '../../../assets/heroes/taro/sport/encourage.webp';
import taroSportThink from '../../../assets/heroes/taro/sport/think.webp';
import taroAstronauteBust from '../../../assets/heroes/taro/astronaute/bust.webp';
import taroAstronauteVictory from '../../../assets/heroes/taro/astronaute/victory.webp';
import taroAstronauteEncourage from '../../../assets/heroes/taro/astronaute/encourage.webp';
import taroAstronauteThink from '../../../assets/heroes/taro/astronaute/think.webp';
import taroMagieBust from '../../../assets/heroes/taro/magie/bust.webp';
import taroMagieVictory from '../../../assets/heroes/taro/magie/victory.webp';
import taroMagieEncourage from '../../../assets/heroes/taro/magie/encourage.webp';
import taroMagieThink from '../../../assets/heroes/taro/magie/think.webp';
import leoSportBust from '../../../assets/heroes/leo/sport/bust.webp';
import leoSportVictory from '../../../assets/heroes/leo/sport/victory.webp';
import leoSportEncourage from '../../../assets/heroes/leo/sport/encourage.webp';
import leoSportThink from '../../../assets/heroes/leo/sport/think.webp';
import leoAstronauteBust from '../../../assets/heroes/leo/astronaute/bust.webp';
import leoAstronauteVictory from '../../../assets/heroes/leo/astronaute/victory.webp';
import leoAstronauteEncourage from '../../../assets/heroes/leo/astronaute/encourage.webp';
import leoAstronauteThink from '../../../assets/heroes/leo/astronaute/think.webp';
import leoMagieBust from '../../../assets/heroes/leo/magie/bust.webp';
import leoMagieVictory from '../../../assets/heroes/leo/magie/victory.webp';
import leoMagieEncourage from '../../../assets/heroes/leo/magie/encourage.webp';
import leoMagieThink from '../../../assets/heroes/leo/magie/think.webp';

/**
 * The heroes in each outfit: every pose drawn again (WebP in three densities, made by
 * `pnpm heroes:images` from docs/design/tenues). Only hero-art.ts reads this.
 */
export const HERO_OUTFITS: Record<HeroId, Record<OutfitId, Record<HeroPose, number>>> = {
  nova: {
    sport: {
      bust: novaSportBust,
      victory: novaSportVictory,
      encourage: novaSportEncourage,
      think: novaSportThink,
    },
    astronaute: {
      bust: novaAstronauteBust,
      victory: novaAstronauteVictory,
      encourage: novaAstronauteEncourage,
      think: novaAstronauteThink,
    },
    magie: {
      bust: novaMagieBust,
      victory: novaMagieVictory,
      encourage: novaMagieEncourage,
      think: novaMagieThink,
    },
  },
  juno: {
    sport: {
      bust: junoSportBust,
      victory: junoSportVictory,
      encourage: junoSportEncourage,
      think: junoSportThink,
    },
    astronaute: {
      bust: junoAstronauteBust,
      victory: junoAstronauteVictory,
      encourage: junoAstronauteEncourage,
      think: junoAstronauteThink,
    },
    magie: {
      bust: junoMagieBust,
      victory: junoMagieVictory,
      encourage: junoMagieEncourage,
      think: junoMagieThink,
    },
  },
  mika: {
    sport: {
      bust: mikaSportBust,
      victory: mikaSportVictory,
      encourage: mikaSportEncourage,
      think: mikaSportThink,
    },
    astronaute: {
      bust: mikaAstronauteBust,
      victory: mikaAstronauteVictory,
      encourage: mikaAstronauteEncourage,
      think: mikaAstronauteThink,
    },
    magie: {
      bust: mikaMagieBust,
      victory: mikaMagieVictory,
      encourage: mikaMagieEncourage,
      think: mikaMagieThink,
    },
  },
  kai: {
    sport: {
      bust: kaiSportBust,
      victory: kaiSportVictory,
      encourage: kaiSportEncourage,
      think: kaiSportThink,
    },
    astronaute: {
      bust: kaiAstronauteBust,
      victory: kaiAstronauteVictory,
      encourage: kaiAstronauteEncourage,
      think: kaiAstronauteThink,
    },
    magie: {
      bust: kaiMagieBust,
      victory: kaiMagieVictory,
      encourage: kaiMagieEncourage,
      think: kaiMagieThink,
    },
  },
  taro: {
    sport: {
      bust: taroSportBust,
      victory: taroSportVictory,
      encourage: taroSportEncourage,
      think: taroSportThink,
    },
    astronaute: {
      bust: taroAstronauteBust,
      victory: taroAstronauteVictory,
      encourage: taroAstronauteEncourage,
      think: taroAstronauteThink,
    },
    magie: {
      bust: taroMagieBust,
      victory: taroMagieVictory,
      encourage: taroMagieEncourage,
      think: taroMagieThink,
    },
  },
  leo: {
    sport: {
      bust: leoSportBust,
      victory: leoSportVictory,
      encourage: leoSportEncourage,
      think: leoSportThink,
    },
    astronaute: {
      bust: leoAstronauteBust,
      victory: leoAstronauteVictory,
      encourage: leoAstronauteEncourage,
      think: leoAstronauteThink,
    },
    magie: {
      bust: leoMagieBust,
      victory: leoMagieVictory,
      encourage: leoMagieEncourage,
      think: leoMagieThink,
    },
  },
};
