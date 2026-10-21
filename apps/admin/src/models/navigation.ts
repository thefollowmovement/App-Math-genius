import type { Database } from '@math-genius/shared';

export type AdminRole = Database['public']['Enums']['admin_role'];

export const PAGE_IDS = [
  'tendances',
  'radar',
  'questionnaire',
  'jeux',
  'relecture',
  'prompts',
  'ia',
  'journal',
  'equipe',
] as const;
export type PageId = (typeof PAGE_IDS)[number];

/**
 * Who sees each page (docs/specs.md, Rôles): the pedagogical editors the contents, prompts and
 * trends, the moderators the AI review and the « Autre » answers; the super-admin everything.
 * The database checks the same roles (private.is_admin): the menu only hides what would fail.
 */
const ROLES: Record<PageId, readonly AdminRole[]> = {
  tendances: ['editor'],
  radar: ['editor', 'moderator'],
  questionnaire: ['editor'],
  jeux: ['editor'],
  relecture: ['editor', 'moderator'],
  prompts: ['editor'],
  ia: ['editor'],
  journal: [],
  equipe: [],
};

export const canSee = (role: AdminRole | null, page: PageId) =>
  role === 'super_admin' || (role !== null && ROLES[page].includes(role));

export const pagesFor = (role: AdminRole | null) => PAGE_IDS.filter((page) => canSee(role, page));

/** Where a team member lands after signing in. */
export const homeFor = (role: AdminRole | null): PageId | null => pagesFor(role)[0] ?? null;

export const pageOf = (pathname: string): PageId | null =>
  PAGE_IDS.find((page) => pathname === `/${page}` || pathname.startsWith(`/${page}/`)) ?? null;
