import { screen } from '@testing-library/react-native';

import { badgeGroups } from '@/data/badges-model';
import { strings } from '@/i18n';
import { renderWithTheme } from '@/test-utils/render';

import { Badges } from '.';

const t = strings.badges;

describe('Badges', () => {
  it('shows earned badges and the progress towards the others', async () => {
    await renderWithTheme(
      <Badges
        groups={badgeGroups({
          earned: [
            { badge_code: 'streak-3', earned_at: '2026-10-07T16:00:00Z' },
            { badge_code: 'sessions-1', earned_at: '2026-10-05T16:00:00Z' },
          ],
          metrics: { streak_best: 4, validated_daily: 4 },
        })}
      />,
    );
    expect(screen.getByText(t.count(2, 37))).toBeOnTheScreen();
    expect(screen.getByText(t.categories.regularity)).toBeOnTheScreen();
    const streak3 = t.items['streak-3'];
    expect(
      screen.getByLabelText(t.earnedLabel(streak3.title, streak3.description)),
    ).toBeOnTheScreen();
    const streak7 = t.items['streak-7'];
    expect(
      screen.getByLabelText(t.lockedLabel(streak7.title, streak7.description, 4, 7)),
    ).toBeOnTheScreen();
    expect(screen.getAllByText(t.earned)).toHaveLength(2);
  });

  it('waits for the badges', async () => {
    await renderWithTheme(<Badges groups={null} />);
    expect(screen.getByText(t.loading)).toBeOnTheScreen();
  });
});
