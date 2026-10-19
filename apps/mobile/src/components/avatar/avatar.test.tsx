import { AVATAR_PART_NAMES, AVATAR_PARTS, DEFAULT_LOOKS, SHOP_ITEMS } from '@math-genius/shared';
import { screen } from '@testing-library/react-native';

import { withPart } from '@/data/look-model';
import { renderWithTheme } from '@/test-utils/render';

import { AvatarPicture } from '.';

const base = DEFAULT_LOOKS.boy.avatar;

describe('AvatarPicture', () => {
  it.each(AVATAR_PART_NAMES)('draws every option of %s', async (part) => {
    for (const option of AVATAR_PARTS[part]) {
      const avatar = withPart(base, part, option);
      expect(avatar).not.toBeNull();
      if (avatar) await renderWithTheme(<AvatarPicture avatar={avatar} label={option} />);
      expect(screen.getByRole('image', { name: option })).toBeOnTheScreen();
    }
  });

  it('wears every accessory of the shop', async () => {
    for (const { code, kind } of SHOP_ITEMS) {
      if (kind !== 'accessory') continue;
      await renderWithTheme(<AvatarPicture avatar={base} accessory={code} label={code} />);
      expect(screen.getByRole('image', { name: code })).toBeOnTheScreen();
    }
  });

  it('is hidden from screen readers without a label', async () => {
    const { toJSON } = await renderWithTheme(<AvatarPicture avatar={base} />);
    expect(screen.queryByRole('image')).toBeNull();
    expect(toJSON()).toBeTruthy();
  });
});
