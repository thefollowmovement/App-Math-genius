import { avatarOf } from '@math-genius/shared';
import { ThemeProvider, themeOf } from '@math-genius/ui';
import type { ComponentProps } from 'react';

import type { Child } from '@/data/children';

import { HeroBust } from './hero-bust';

type ChildHeroProps = Omit<ComponentProps<typeof HeroBust>, 'avatar'> & {
  child: Pick<Child, 'avatar' | 'gender' | 'theme_id'>;
};

/** A child's hero on a page that is not theirs (parent, profiles), in their theme's colors. */
export function ChildHero({ child, ...props }: ChildHeroProps) {
  return (
    <ThemeProvider theme={themeOf(child.theme_id)}>
      <HeroBust avatar={avatarOf(child.avatar, child.gender)} {...props} />
    </ThemeProvider>
  );
}
