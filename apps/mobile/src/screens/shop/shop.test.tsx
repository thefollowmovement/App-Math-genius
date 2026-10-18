import { screen, userEvent } from '@testing-library/react-native';

import { shopGroups } from '@/data/rewards-model';
import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { Shop } from '.';

const t = strings.shop;
const items = [
  { item_code: 'kitten', equipped: true },
  { item_code: 'bow', equipped: false },
];

async function renderShop(gems: number, freezes = 1) {
  const handlers = { onBuyFreeze: jest.fn(), onBuy: jest.fn(), onWear: jest.fn() };
  await renderWithTheme(
    <Shop
      gems={gems}
      freezes={freezes}
      groups={shopGroups(items)}
      pending={null}
      error={null}
      {...handlers}
    />,
  );
  return handlers;
}

describe('Shop', () => {
  it('sells what the gems can pay for, and wears or takes off what was bought', async () => {
    const user = userEvent.setup();
    const { onBuyFreeze, onBuy, onWear } = await renderShop(70);
    expect(screen.getByText(`${strings.rewards.gem} ${t.balance(70)}`)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: t.freezes.buy(30) }));
    expect(onBuyFreeze).toHaveBeenCalled();
    // The fox costs 80 gems: 10 are missing.
    expect(screen.queryByRole('button', { name: t.buyLabel(t.items.fox.name, 80) })).toBeNull();
    expect(screen.getAllByText(t.missing(10)).length).toBeGreaterThan(0);
    await user.press(screen.getByRole('button', { name: t.buyLabel(t.items.puppy.name, 60) }));
    expect(onBuy).toHaveBeenCalledWith('puppy');

    await user.press(screen.getByRole('button', { name: t.takeOffLabel(t.items.kitten.name) }));
    expect(onWear).toHaveBeenCalledWith('kitten', false);
    await user.press(screen.getByRole('button', { name: t.wearLabel(t.items.bow.name) }));
    expect(onWear).toHaveBeenCalledWith('bow', true);
  });

  it('stops selling freezes once the stock is full', async () => {
    await renderShop(500, 3);
    expect(screen.getByText(t.freezes.full)).toBeOnTheScreen();
  });
});
