import { GRADES, type Database, type Grade } from '@math-genius/shared';

import { addMonths, daysBetween, isIsoDate } from './dates';

type Public = Database['public'];
export type UniverseRow = Public['Tables']['universes']['Row'];
export type UniverseInsert = Public['Tables']['universes']['Insert'];
export type UniverseCategory = Public['Enums']['universe_category'];
export type UniverseStatus = Public['Enums']['universe_status'];

export const CATEGORIES: readonly UniverseCategory[] = [
  'game',
  'creator',
  'sport',
  'show',
  'music',
  'job',
];
export const STATUSES: readonly UniverseStatus[] = ['active', 'testing', 'retired'];
export const PEGI = ['3', '7', '12', '16', '18'] as const;
const COLLEGE_FROM_5E: readonly Grade[] = ['5e', '4e', '3e'];

/** Trends move fast: a reference is reviewed every 3 months. */
export const REVIEW_MONTHS = 3;
/** A review due within these days is shown before it is late. */
const SOON_DAYS = 14;

/** The form of a reference, as typed. */
export type UniverseDraft = {
  id: string;
  name: string;
  category: UniverseCategory;
  grades: Grade[];
  /** '' when it is not a game. */
  pegi: string;
  status: UniverseStatus;
  /** Comma separated. */
  words: string;
  /** One per line. */
  images: string;
  reviewAt: string;
};

export type UniverseProblem = 'id' | 'name' | 'grades' | 'pegiBanned' | 'pegi12' | 'review';

/** The id of a new reference, from its name: stable, never renamed. */
export const slugOf = (name: string) =>
  name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

export function vocabularyOf(row: Pick<UniverseRow, 'vocabulary'>) {
  const vocabulary =
    typeof row.vocabulary === 'object' && row.vocabulary !== null && !Array.isArray(row.vocabulary)
      ? row.vocabulary
      : {};
  return { words: strings(vocabulary.words), images: strings(vocabulary.images) };
}

export function draftOf(
  row: UniverseRow | null,
  today: string,
  prefill: { name?: string; category?: string } = {},
): UniverseDraft {
  if (row) {
    const { words, images } = vocabularyOf(row);
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      grades: GRADES.filter((grade) => row.grades.includes(grade)),
      pegi: row.pegi === null ? '' : String(row.pegi),
      status: row.status,
      words: words.join(', '),
      images: images.join('\n'),
      reviewAt: row.review_at,
    };
  }
  const name = prefill.name?.trim().slice(0, 40) ?? '';
  const category = CATEGORIES.find((item) => item === prefill.category) ?? 'game';
  return {
    id: slugOf(name),
    name,
    category,
    grades: [...GRADES],
    pegi: '',
    // A new trend is tried before it is offered to every child.
    status: 'testing',
    words: '',
    images: '',
    reviewAt: addMonths(today, REVIEW_MONTHS),
  };
}

/** What the database would refuse, said before saving (the same rules as its constraints). */
export function universeProblems(draft: UniverseDraft): UniverseProblem[] {
  const problems: UniverseProblem[] = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.id)) problems.push('id');
  const name = draft.name.trim();
  if (name.length < 1 || name.length > 40) problems.push('name');
  if (draft.grades.length === 0) problems.push('grades');
  if (draft.pegi === '16' || draft.pegi === '18') problems.push('pegiBanned');
  if (draft.pegi === '12' && draft.grades.some((grade) => !COLLEGE_FROM_5E.includes(grade))) {
    problems.push('pegi12');
  }
  if (!isIsoDate(draft.reviewAt)) problems.push('review');
  return problems;
}

const list = (text: string, separator: RegExp) =>
  [...new Set(text.split(separator).map((item) => item.trim()))].filter(Boolean);

export function universeRecord(draft: UniverseDraft): UniverseInsert {
  const words = list(draft.words, /,/);
  const images = list(draft.images, /\n/);
  return {
    id: draft.id,
    name: draft.name.trim(),
    category: draft.category,
    grades: GRADES.filter((grade) => draft.grades.includes(grade)),
    pegi: draft.pegi === '' ? null : Number(draft.pegi),
    status: draft.status,
    vocabulary: { ...(words.length ? { words } : {}), ...(images.length ? { images } : {}) },
    review_at: draft.reviewAt,
  };
}

export type ReviewState = { kind: 'overdue' | 'soon' | 'ok'; days: number };

export function reviewState(reviewAt: string, today: string): ReviewState {
  const days = daysBetween(today, reviewAt);
  if (days < 0) return { kind: 'overdue', days: -days };
  return { kind: days <= SOON_DAYS ? 'soon' : 'ok', days };
}

/** Grades as a short label: a range when they follow each other (« CM1 → 3e »). */
export function gradesLabel(grades: readonly Grade[]): string {
  const ranks = GRADES.map((grade, index) => (grades.includes(grade) ? index : -1)).filter(
    (index) => index >= 0,
  );
  const first = ranks[0];
  const last = ranks.at(-1);
  if (first === undefined || last === undefined) return '';
  if (first === last) return GRADES[first] ?? '';
  if (last - first + 1 === ranks.length) return `${GRADES[first]} → ${GRADES[last]}`;
  return ranks.map((index) => GRADES[index]).join(', ');
}
