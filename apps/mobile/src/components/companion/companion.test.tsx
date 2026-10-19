import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { COMPANIONS, COMPANION_STAGES } from '@math-genius/shared';
import { screen } from '@testing-library/react-native';

import { renderWithTheme } from '@/test-utils/render';

import { COMPANION_ART } from './companion-art';
import { CompanionPicture } from './companion-picture';

const assets = join(__dirname, '../../../assets/companions');

// « Réduire les animations », as the phone says.
let mockReducedMotion = false;
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual<{ default: unknown }>('react-native-reanimated');
  return {
    ...actual,
    __esModule: true,
    default: actual.default,
    useReducedMotion: () => mockReducedMotion,
  };
});

describe('companions', () => {
  it.each(COMPANIONS.map(({ id }) => id))(
    'has a picture of %s per stage, in three densities (pnpm heroes:images)',
    (id) => {
      for (const stage of COMPANION_STAGES) {
        expect(COMPANION_ART[id][stage]).toBeDefined();
        for (const suffix of ['', '@2x', '@3x']) {
          expect(existsSync(join(assets, id, `stage-${stage}${suffix}.webp`))).toBe(true);
        }
      }
    },
  );

  it('floats, unless the child reduces animations', async () => {
    const companion = { id: 'dragon', stage: 1 } as const;
    await renderWithTheme(<CompanionPicture companion={companion} float label="Draco" />);
    expect(screen.getByRole('image', { name: 'Draco' })).toBeOnTheScreen();
    expect(JSON.stringify(screen.toJSON())).toContain('animationName');

    mockReducedMotion = true;
    await renderWithTheme(<CompanionPicture companion={companion} float label="Draco" />);
    expect(screen.getByRole('image', { name: 'Draco' })).toBeOnTheScreen();
    expect(JSON.stringify(screen.toJSON())).not.toContain('animationName');
    mockReducedMotion = false;
  });
});
