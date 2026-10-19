import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { COSMETICS, HERO_IDS, HERO_POSES, type Avatar } from '@math-genius/shared';
import { ThemedText } from '@math-genius/ui';
import { screen } from '@testing-library/react-native';

import { renderWithTheme } from '@/test-utils/render';

import { COSMETIC_ART } from './cosmetic-art';
import { HeroBust } from './hero-bust';
import { HeroProvider, useChildHero } from './hero-context';

const assets = join(__dirname, '../../../assets/heroes');

describe('heroes', () => {
  it.each(HERO_IDS)('has every pose of %s, in three densities (pnpm heroes:images)', (hero) => {
    for (const pose of HERO_POSES) {
      for (const suffix of ['', '@2x', '@3x']) {
        expect(existsSync(join(assets, hero, `${pose}${suffix}.webp`))).toBe(true);
      }
    }
  });

  it('draws every cosmetic drawn around the hero, as its slot needs', () => {
    const kinds = { aura: 'aura', frame: 'frame', companion: 'emoji', accessory: 'emoji' } as const;
    for (const { id, slot, visual } of COSMETICS) {
      if (visual.kind !== 'overlay') continue;
      expect([id, COSMETIC_ART[visual.art]?.kind]).toEqual([id, kinds[slot as keyof typeof kinds]]);
    }
  });

  it('shows the portrait with what the hero wears around it', async () => {
    const avatar: Avatar = {
      hero: 'juno',
      wear: { aura: 'aura-gold', frame: 'frame-stars', companion: 'fox', accessory: 'crown' },
    };
    await renderWithTheme(<HeroBust avatar={avatar} label="Juno" />);
    expect(screen.getByRole('image', { name: 'Juno' })).toBeOnTheScreen();
    expect(screen.getByText('🦊')).toBeOnTheScreen();
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
