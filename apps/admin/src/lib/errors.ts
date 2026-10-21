import { strings } from '@/i18n/fr';

type Known = keyof typeof strings.errors;

/** What a failed request tells the team member, from the codes the database raises. */
export function errorText(error: unknown): string {
  const record = (typeof error === 'object' && error !== null ? error : {}) as Record<
    string,
    unknown
  >;
  const message = typeof record.message === 'string' ? record.message : '';
  const code = typeof record.code === 'string' ? record.code : '';
  if (message in strings.errors) return strings.errors[message as Known];
  if (code === '23505') return strings.errors.duplicate;
  if (code === '23514' || code === '22P02') return strings.errors.check;
  if (code === '42501') return strings.errors.admin_only;
  if (/fetch|network/i.test(message)) return strings.errors.network;
  return message ? strings.error(message) : strings.errors.unknown;
}
