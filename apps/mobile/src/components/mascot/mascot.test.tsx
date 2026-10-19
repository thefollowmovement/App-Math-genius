import { themes } from '@math-genius/ui';
import { screen } from '@testing-library/react-native';

import { renderWithTheme } from '@/test-utils/render';

import { Mascot, type MascotMood } from '.';
import { MascotSays } from './mascot-says';

const MOODS: MascotMood[] = ['hello', 'cheer', 'comfort'];

describe.each(Object.values(themes))('Mascot in theme $id', (theme) => {
  it.each(MOODS)('draws itself in the theme’s colors, %s', async (mood) => {
    const { toJSON } = await renderWithTheme(<Mascot mood={mood} />, theme);
    const drawing = JSON.stringify(toJSON());
    // react-native-svg turns colors into opaque ARGB numbers.
    const argb = (hex: string) => String(0xff000000 + parseInt(hex.slice(1), 16));
    expect(drawing.includes(argb(theme.art.mascot.body))).toBe(true);
    expect(drawing.includes(argb(theme.art.mascot.ink))).toBe(true);
    expect(screen.root).toHaveProp('importantForAccessibility', 'no-hide-descendants');
  });
});

it('speaks in a bubble that screen readers read', async () => {
  await renderWithTheme(<MascotSays mood="comfort">Courage&nbsp;!</MascotSays>);
  expect(screen.getByText('Courage !')).toBeOnTheScreen();
});
