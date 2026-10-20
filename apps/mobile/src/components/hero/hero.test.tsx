import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { COSMETICS, HERO_IDS, HERO_POSES, OUTFITS, type Avatar } from '@math-genius/shared';
import { ThemedText } from '@math-genius/ui';
import { screen } from '@testing-library/react-native';

import { renderWithTheme } from '@/test-utils/render';

import { COSMETIC_ART } from './cosmetic-art';
import { HERO_ART, heroPicture } from './hero-art';
import { HeroBust } from './hero-bust';
import { HeroProvider, useChildHero } from './hero-context';

const assets = join(__dirname, '../../../assets/heroes');

describe('heroes', () => {
  it.each(HERO_IDS)('has every pose of %s, in three densities (pnpm heroes:images)', (hero) => {
    for (const pose of [...HERO_POSES, 'card']) {
      for (const suffix of ['', '@2x', '@3x']) {
        expect(existsSync(join(assets, hero, `${pose}${suffix}.webp`))).toBe(true);
      }
    }
  });

  it.each(HERO_IDS)('has every pose of %s in each outfit, in three densities', (hero) => {
    for (const { id } of OUTFITS) {
      for (const pose of HERO_POSES) {
        for (const suffix of ['', '@2x', '@3x']) {
          expect(existsSync(join(assets, hero, id, `${pose}${suffix}.webp`))).toBe(true);
        }
      }
    }
  });

  it('draws every pose in the outfit the hero wears, its stage outfit without one', () => {
    for (const pose of HERO_POSES) {
      expect(heroPicture({ hero: 'taro', outfit: null }, pose)).toBe(HERO_ART.taro.poses[pose]);
      expect(heroPicture({ hero: 'taro', outfit: 'magie' }, pose)).toBe(
        HERO_ART.taro.outfits.magie[pose],
      );
      expect(HERO_ART.taro.outfits.magie[pose]).not.toBe(HERO_ART.taro.poses[pose]);
    }
  });

  it('draws every cosmetic drawn around the hero, as its slot needs', () => {
    const kinds = { aura: 'aura', frame: 'frame', accessory: 'emoji' } as const;
    for (const { id, slot, visual } of COSMETICS) {
      if (visual.kind !== 'overlay') continue;
      expect([id, COSMETIC_ART[visual.art]?.kind]).toEqual([id, kinds[slot as keyof typeof kinds]]);
    }
  });

  it('shows the portrait with what the hero wears around it', async () => {
    const avatar: Avatar = {
      hero: 'juno',
      wear: { aura: 'aura-gold', frame: 'frame-stars', companion: 'renard', accessory: 'crown' },
    };
    await renderWithTheme(<HeroBust avatar={avatar} label="Juno" />);
    expect(screen.getByRole('image', { name: 'Juno' })).toBeOnTheScreen();
    expect(screen.getByText('👑')).toBeOnTheScreen();
  });

  it('gives every child screen the hero of the child', async () => {
    function Probe() {
      return <ThemedText>{useChildHero().hero}</ThemedText>;
    }
    await renderWithTheme(
      <HeroProvider avatar={{ hero: 'leo', wear: {} }}>
        <Probe />
      </HeroProvider>,
    );
    expect(screen.getByText('leo')).toBeOnTheScreen();
    await renderWithTheme(<Probe />);
    expect(screen.getByText('nova')).toBeOnTheScreen();
  });
});
