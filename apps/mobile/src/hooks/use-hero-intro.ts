import type { HeroId } from '@math-genius/shared';
import { useState } from 'react';

import type { Child } from '@/data/children';
import { errorKind } from '@/data/errors';
import { useSetChildLook } from '@/data/look';
import { lookOf, withHero } from '@/data/look-model';

/** The intro's steps: the hero is chosen (and saved) first, then it presents the app. */
export function useHeroIntro(child: Child) {
  const saved = lookOf(child);
  const [hero, setHero] = useState<HeroId>(saved.avatar.hero);
  const [step, setStep] = useState(0);
  const save = useSetChildLook(child.id);

  return {
    step,
    hero,
    pickHero: (next: HeroId) => {
      save.reset();
      setHero(next);
    },
    // The hero is saved before the hero speaks: offline, the child tries again.
    confirmHero: () =>
      hero === saved.avatar.hero
        ? setStep(1)
        : save.mutate(withHero(saved, hero), { onSuccess: () => setStep(1) }),
    next: () => setStep((current) => current + 1),
    saving: save.isPending,
    error: save.error ? errorKind(save.error) : null,
  };
}
