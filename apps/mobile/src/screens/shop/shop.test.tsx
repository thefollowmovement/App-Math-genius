import { screen, userEvent } from '@testing-library/react-native';

import { shopGroups } from '@/data/rewards-model';
import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { Shop } from '.';

const t = strings.shop;
const items = [
  { item_code: 'lapin', equipped: false },
  { item_code: 'bow', equipped: false },
];

async function renderShop(gems: number, freezes = 1) {
  const handlers = { onBuyFreeze: jest.fn(), onBuy: jest.fn(), onWear: jest.fn() };
  await renderWithTheme(
    <Shop
      gems={gems}
      freezes={freezes}
      groups={shopGroups(items, { companion: 'lapin' })}
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
    // With 70 gems: the sunglasses (40) are for sale, the crown (120) is 50 gems away.
    await user.press(screen.getByRole('button', { name: t.buyLabel(t.items.sunglasses.name, 40) }));
    expect(onBuy).toHaveBeenCalledWith('sunglasses');
    expect(screen.queryByRole('button', { name: t.buyLabel(t.items.crown.name, 120) })).toBeNull();
    expect(screen.getAllByText(t.missing(50)).length).toBeGreaterThan(0);
    await user.press(screen.getByRole('button', { name: t.wearLabel(t.items.bow.name) }));
    expect(onWear).toHaveBeenCalledWith('bow', true);
  });

  it('shows the companions on cards, and the sheet of the one picked', async () => {
    const user = userEvent.setup();
    const { onBuy, onWear } = await renderShop(130);
    const c = strings.companions;
    // Lapin Street, worn, is picked first: its sheet tells its full name and offers to take it off.
    expect(screen.getByRole('radio', { name: c.cardLabel('Lapin Street', 'Rare') })).toBeChecked();
    expect(screen.getByText(c.items.lapin.fullName)).toBeOnTheScreen();
    expect(screen.getByText(c.items.lapin.description)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.takeOffLabel('Lapin Street') }));
    expect(onWear).toHaveBeenCalledWith('lapin', false);

    // Draco costs 120 gems: 130 are enough.
    await user.press(screen.getByRole('radio', { name: c.cardLabel('Draco', 'Rare') }));
    expect(screen.getByText(c.items.dragon.fullName)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.buyLabel('Draco', 120) }));
    expect(onBuy).toHaveBeenCalledWith('dragon');

    // Kitsune costs 250: 120 are missing.
    await user.press(screen.getByRole('radio', { name: c.cardLabel('Kitsune', 'Épique') }));
    expect(screen.getByText(`${t.price(250)} · ${t.missing(120)}`)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: t.buyLabel('Kitsune', 250) })).toBeNull();
  });

  it('sells outfits, shown on the child’s hero', async () => {
    const user = userEvent.setup();
    const { onBuy } = await renderShop(150);
    const o = strings.outfits.items;
    expect(screen.getByText(t.kinds.outfit)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: t.buyLabel(o.sport.name, 100) }));
    expect(onBuy).toHaveBeenCalledWith('sport');
    // Magie costs 200 gems: 50 are missing.
    expect(screen.queryByRole('button', { name: t.buyLabel(o.magie.name, 200) })).toBeNull();
  });

  it('stops selling freezes once the stock is full', async () => {
    await renderShop(500, 3);
    expect(screen.getByText(t.freezes.full)).toBeOnTheScreen();
  });
});
