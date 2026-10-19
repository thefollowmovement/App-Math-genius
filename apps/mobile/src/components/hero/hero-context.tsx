import { DEFAULT_LOOKS, type Avatar } from '@math-genius/shared';
import { createContext, use, type PropsWithChildren } from 'react';

// The child's hero, for every screen of the child (app/child/_layout.tsx provides it), like the
// theme: screens stay pure and never ask which child plays.
const HeroContext = createContext<Avatar | null>(null);

export function HeroProvider({ avatar, children }: PropsWithChildren<{ avatar: Avatar }>) {
  return <HeroContext value={avatar}>{children}</HeroContext>;
}

/** The hero and cosmetics of the child playing; a default hero outside the child's pages. */
export function useChildHero(): Avatar {
  return use(HeroContext) ?? DEFAULT_LOOKS.girl.avatar;
}
