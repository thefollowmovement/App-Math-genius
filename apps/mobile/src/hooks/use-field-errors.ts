import { useState } from 'react';

import { invalidFields } from '@/utils/invalid-fields';

/** Invalid form fields: set from a failed parse, each one cleared as soon as it is edited. */
export function useFieldErrors() {
  const [invalid, setInvalid] = useState<ReadonlySet<string>>(new Set());

  function clear(field: string) {
    setInvalid((previous) => {
      if (!previous.has(field)) return previous;
      const next = new Set(previous);
      next.delete(field);
      return next;
    });
  }

  return {
    has: (field: string) => invalid.has(field),
    report: (issues: readonly { path: readonly PropertyKey[] }[]) =>
      setInvalid(invalidFields(issues)),
    reset: () => setInvalid(new Set()),
    /** Wraps a field's setter so that editing the field hides its error. */
    onEdit:
      <T>(field: string, setValue: (value: T) => void) =>
      (value: T) => {
        setValue(value);
        clear(field);
      },
  };
}
