import type { CosmeticId, CosmeticSlot, HeroId, Unlocked } from '@math-genius/shared';
import type { ThemeId } from '@math-genius/ui';
import { useState } from 'react';

import type { Child } from '@/data/children';
import { errorKind } from '@/data/errors';
import { useSetChildLook } from '@/data/look';
import {
  lookOf,
  pickCosmetic,
  sameLook,
  withHero,
  type LockedHint,
  type Look,
} from '@/data/look-model';

/**
 * The look being chosen, shown before it is saved; null until the child is known. Cosmetics wait
 * for their badge or their purchase (`unlocked`).
 */
export function useLookEditor(child: Child | undefined, unlocked: Unlocked) {
  const [draft, setDraft] = useState<Look | null>(null);
  const [hint, setHint] = useState<LockedHint | null>(null);
  const save = useSetChildLook(child?.id ?? '');
  const saved = child ? lookOf(child) : null;
  const look = draft ?? saved;

  const change = (next: Look) => {
    save.reset();
    setHint(null);
    setDraft(next);
  };

  const setCosmetic = (slot: CosmeticSlot, id: CosmeticId | null) => {
    const picked = look && pickCosmetic(look, slot, id, unlocked);
    if (picked && 'locked' in picked) setHint(picked.locked);
    else if (picked) change(picked.look);
  };

  return {
    look,
    changed: look !== null && saved !== null && !sameLook(look, saved),
    hint,
    setHero: (hero: HeroId) => look && change(withHero(look, hero)),
    setTheme: (theme: ThemeId) => look && change({ ...look, theme }),
    setCosmetic,
    save: (onSaved: () => void) => look && save.mutate(look, { onSuccess: onSaved }),
    saving: save.isPending,
    error: save.error ? errorKind(save.error) : null,
  };
}
