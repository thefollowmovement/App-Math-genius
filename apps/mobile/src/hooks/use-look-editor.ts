import type { ThemeId } from '@math-genius/ui';
import { useState } from 'react';

import type { Child } from '@/data/children';
import { errorKind } from '@/data/errors';
import { useSetChildLook } from '@/data/look';
import { lookOf, sameLook, type Look } from '@/data/look-model';

/** The look being chosen, shown before it is saved; null until the child is known. */
export function useLookEditor(child: Child | undefined) {
  const [draft, setDraft] = useState<Look | null>(null);
  const save = useSetChildLook(child?.id ?? '');
  const saved = child ? lookOf(child) : null;
  const look = draft ?? saved;

  const change = (next: Look) => {
    save.reset();
    setDraft(next);
  };

  return {
    look,
    changed: look !== null && saved !== null && !sameLook(look, saved),
    setTheme: (theme: ThemeId) => look && change({ ...look, theme }),
    save: (onSaved: () => void) => look && save.mutate(look, { onSuccess: onSaved }),
    saving: save.isPending,
    error: save.error ? errorKind(save.error) : null,
  };
}
