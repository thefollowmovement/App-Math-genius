import type { Json } from '@math-genius/shared';

export type Change = { field: string; before: string | null; after: string | null };

const IGNORED = new Set(['created_at', 'updated_at']);

const isRow = (value: Json | null): value is { [key: string]: Json | undefined } =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const shown = (value: Json | undefined): string | null =>
  value === undefined || value === null
    ? null
    : typeof value === 'string'
      ? value
      : JSON.stringify(value);

/** What a change did, field by field: the fields that differ (all of them for an add or delete). */
export function changesOf(before: Json | null, after: Json | null): Change[] {
  const old = isRow(before) ? before : {};
  const next = isRow(after) ? after : {};
  const fields = [...new Set([...Object.keys(old), ...Object.keys(next)])].filter(
    (field) => !IGNORED.has(field),
  );
  return fields
    .map((field) => ({ field, before: shown(old[field]), after: shown(next[field]) }))
    .filter((change) => change.before !== change.after);
}
