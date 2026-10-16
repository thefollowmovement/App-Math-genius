/** Keys of the built-in keypad (the system keyboard is never shown to the child). */
export type KeypadKey =
  '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | '/' | '−' | 'delete';

export const MAX_TYPED_LENGTH = 12;

/**
 * Text after a key press. Keeps the text a number in progress: one minus sign at the start
 * (pressing it again removes it), one comma per number, one fraction bar between two numbers.
 */
export function applyKey(text: string, key: KeypadKey): string {
  if (key === 'delete') return text.slice(0, -1);
  if (key === '−') return text.startsWith('−') ? text.slice(1) : `−${text}`;
  if (text.length >= MAX_TYPED_LENGTH) return text;

  const current = text.split('/').at(-1) ?? '';
  if (key === ',') {
    if (current.includes(',') || text.includes('/')) return text;
    return /\d$/.test(current) ? `${text},` : `${text}0,`;
  }
  if (key === '/') {
    return text.includes('/') || text.includes(',') || !/\d$/.test(text) ? text : `${text}/`;
  }
  return `${text}${key}`;
}
