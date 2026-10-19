import { avatarOf } from '@math-genius/shared';
import { ThemeProvider, themeOf } from '@math-genius/ui';
import type { ComponentProps } from 'react';

import type { Child } from '@/data/children';

import { AvatarPicture } from '.';

type ChildAvatarProps = Omit<ComponentProps<typeof AvatarPicture>, 'avatar'> & {
  child: Pick<Child, 'avatar' | 'gender' | 'theme_id'>;
};

/** A child's avatar on a page that is not theirs (parent, profiles), on their theme's color. */
export function ChildAvatar({ child, ...props }: ChildAvatarProps) {
  return (
    <ThemeProvider theme={themeOf(child.theme_id)}>
      <AvatarPicture avatar={avatarOf(child.avatar, child.gender)} {...props} />
    </ThemeProvider>
  );
}
