import type { Enums, Json } from './database.types';
import { GRADES, type Grade } from './grade';

/**
 * What the database computes for the parent's « Progrès » page (child_progress), the weekly and
 * monthly recaps (recaps.content) and the child's card (child_highlights), as the app and the
 * recaps Edge Function read it. The rules are in supabase/migrations/*_statistics.sql and
 * *_recaps.sql; these readers only check the shape: an item this version does not know is left
 * out, a damaged answer reads as null.
 */

export type SkillDomain = Enums<'skill_domain'>;

/** What the routine plans on a day: nothing before it was set, or without one. */
export type CalendarPlan = 'planned' | 'off' | 'vacation' | 'none';
/** Done, started and left, missed (planned, past the deadline), day off, holidays, still to come. */
export type CalendarStatus =
  'done' | 'started' | 'missed' | 'off' | 'vacation' | 'pending' | 'none';
export type CalendarDay = { date: string; plan: CalendarPlan; status: CalendarStatus };

export type VerdictLevel = 'good' | 'watch' | 'alert' | 'none';
export type Verdict = {
  level: VerdictLevel;
  /** Share of the planned days done (null: nothing planned). */
  regularity: number | null;
  /** Share of right answers (null: fewer than 10 answers). */
  success: number | null;
  planned: number;
  done: number;
  /** Days played, done or started. */
  active: number;
  answered: number;
  correct: number;
  irregular: boolean;
  struggling: boolean;
};

export type SeriesPoint = {
  /** The day, or the Monday of the week. */
  date: string;
  minutes: number;
  answered: number;
  correct: number;
  xp: number;
};

export type DomainMastery = { domain: SkillDomain; value: number; mastered: number; total: number };
export type DomainChange = {
  domain: SkillDomain;
  start: number;
  end: number;
  mastered: number;
  total: number;
};

export type SkillList = 'mastered' | 'in_progress' | 'to_consolidate';
export type SkillState = {
  code: string;
  title: string;
  grade: Grade;
  domain: SkillDomain;
  mastery: number;
  list: SkillList;
};

/** A real wrong answer: the engine rebuilds its exercise from generator, difficulty and seed. */
export type MistakeExample = {
  generatorId: string;
  difficulty: number;
  seed: number;
  answer: Json;
  errorType: string | null;
  errorLabel: string | null;
};

export type BlockingPoint = {
  skill: string;
  title: string;
  errors: number;
  answered: number;
  /** The most frequent typical mistake, and how the parent reads it. */
  errorType: string | null;
  errorLabel: string | null;
  example: MistakeExample | null;
};

export type ProgrammeRank = 'ahead' | 'on_track' | 'behind';
export type ProgrammePosition = {
  grade: Grade;
  /** Share of the school year gone by. */
  yearProgress: number;
  /** The year's skills that have exercises, those the class has met by now, and the child's. */
  total: number;
  expected: number;
  mastered: number;
  working: number;
  /** Earlier grades' skills found weak. */
  gaps: number;
  gapTitles: string[];
  position: ProgrammeRank | null;
};

export type ProgressRange = 'week' | 'month' | 'quarter';
export const PROGRESS_RANGES: readonly ProgressRange[] = ['week', 'month', 'quarter'];

export type ChildProgress = {
  today: string;
  verdict: Verdict;
  calendar: { month: string; days: (CalendarDay & { minutes: number })[] };
  series: {
    range: ProgressRange;
    from: string;
    to: string;
    days: SeriesPoint[];
    weeks: SeriesPoint[];
  };
  domains: DomainMastery[];
  skills: SkillState[];
  blocking: BlockingPoint[];
  programme: ProgrammePosition | null;
};

export type RecapChild = { id: string; name: string; grade: Grade };
export type LearntSkill = { skill: string; title: string };
/** The point to work on of a week: its mistakes, or the weakest skill to consolidate. */
export type WeakSkill = { skill: string; title: string; mastery: number };

export type WeeklyRecap = {
  kind: 'weekly';
  child: RecapChild;
  from: string;
  to: string;
  days: CalendarDay[];
  planned: number;
  done: number;
  /** Days done that were not planned. */
  extra: number;
  active: number;
  minutes: number;
  answered: number;
  correct: number;
  xp: number;
  streak: number;
  bestStreak: number;
  learned: LearntSkill[];
  toWork: BlockingPoint | WeakSkill | null;
  verdict: Verdict;
};

export type MonthlyRecap = {
  kind: 'monthly';
  child: RecapChild;
  from: string;
  to: string;
  days: CalendarDay[];
  planned: number;
  done: number;
  active: number;
  offDays: number;
  vacationDays: number;
  doneDates: string[];
  skippedDates: { date: string; started: boolean }[];
  minutes: number;
  answered: number;
  correct: number;
  xp: number;
  streak: number;
  bestStreak: number;
  domains: DomainChange[];
  learned: LearntSkill[];
  /** Badge codes, in the order they were won. */
  badges: string[];
  /** The parent's rewards unlocked. */
  rewards: string[];
  blocking: BlockingPoint[];
  programme: ProgrammePosition | null;
  verdict: Verdict;
};

export type Recap = WeeklyRecap | MonthlyRecap;

/** The month's tips (the coach, or the standard text). */
export type RecapAdvice = { source: 'ai' | 'standard'; tips: string[] };

export type ChildHighlights = {
  kind: 'week' | 'month';
  from: string;
  to: string;
  days: number;
  correct: number;
  xp: number;
  learned: number;
  badges: number;
};

// Readers ---------------------------------------------------------------------------------------

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const num = (value: unknown, fallback = 0): number => {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : fallback;
};
const optionalNum = (value: unknown): number | null => {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : null;
};
const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const optionalText = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const oneOf = <T extends string>(values: readonly T[], value: unknown): T | null =>
  values.find((item) => item === value) ?? null;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const date = (value: unknown): string | null =>
  typeof value === 'string' && DATE.test(value) ? value : null;
const compact = <T>(items: (T | null)[]): T[] => items.filter((item): item is T => item !== null);

const DOMAINS: readonly SkillDomain[] = ['numbers', 'measures', 'geometry', 'data'];
const PLANS: readonly CalendarPlan[] = ['planned', 'off', 'vacation', 'none'];
const STATUSES: readonly CalendarStatus[] = [
  'done',
  'started',
  'missed',
  'off',
  'vacation',
  'pending',
  'none',
];
const LEVELS: readonly VerdictLevel[] = ['good', 'watch', 'alert', 'none'];
const LISTS: readonly SkillList[] = ['mastered', 'in_progress', 'to_consolidate'];
const RANKS: readonly ProgrammeRank[] = ['ahead', 'on_track', 'behind'];

export function readVerdict(value: unknown): Verdict {
  const row = isRow(value) ? value : {};
  return {
    level: oneOf(LEVELS, row.level) ?? 'none',
    regularity: optionalNum(row.regularity),
    success: optionalNum(row.success),
    planned: num(row.planned),
    done: num(row.done),
    active: num(row.active),
    answered: num(row.answered),
    correct: num(row.correct),
    irregular: row.irregular === true,
    struggling: row.struggling === true,
  };
}

function readDay(value: unknown): CalendarDay | null {
  if (!isRow(value)) return null;
  const day = date(value.date);
  const plan = oneOf(PLANS, value.plan);
  const status = oneOf(STATUSES, value.status);
  return day && plan && status ? { date: day, plan, status } : null;
}

function readPoint(value: unknown): SeriesPoint | null {
  if (!isRow(value)) return null;
  const day = date(value.date ?? value.start);
  if (!day) return null;
  return {
    date: day,
    minutes: num(value.minutes),
    answered: num(value.answered),
    correct: num(value.correct),
    xp: num(value.xp),
  };
}

function readDomain(value: unknown): DomainMastery | null {
  if (!isRow(value)) return null;
  const domain = oneOf(DOMAINS, value.domain);
  return domain
    ? { domain, value: num(value.value), mastered: num(value.mastered), total: num(value.total) }
    : null;
}

function readDomainChange(value: unknown): DomainChange | null {
  if (!isRow(value)) return null;
  const domain = oneOf(DOMAINS, value.domain);
  return domain
    ? {
        domain,
        start: num(value.start),
        end: num(value.end),
        mastered: num(value.mastered),
        total: num(value.total),
      }
    : null;
}

function readSkill(value: unknown): SkillState | null {
  if (!isRow(value)) return null;
  const grade = oneOf(GRADES, value.grade);
  const domain = oneOf(DOMAINS, value.domain);
  const skillList = oneOf(LISTS, value.list);
  const code = text(value.code);
  return grade && domain && skillList && code
    ? {
        code,
        title: text(value.title),
        grade,
        domain,
        mastery: num(value.mastery),
        list: skillList,
      }
    : null;
}

function readExample(value: unknown): MistakeExample | null {
  if (!isRow(value)) return null;
  const generatorId = text(value.generator_id);
  if (!generatorId) return null;
  return {
    generatorId,
    difficulty: num(value.difficulty),
    seed: num(value.seed),
    answer: (value.answer ?? null) as Json,
    errorType: optionalText(value.error_type),
    errorLabel: optionalText(value.error_label),
  };
}

function readBlocking(value: unknown): BlockingPoint | null {
  if (!isRow(value)) return null;
  const skill = text(value.skill);
  if (!skill) return null;
  return {
    skill,
    title: text(value.title),
    errors: num(value.errors),
    answered: num(value.answered),
    errorType: optionalText(value.error_type),
    errorLabel: optionalText(value.error_label),
    example: readExample(value.example),
  };
}

function readProgramme(value: unknown): ProgrammePosition | null {
  if (!isRow(value)) return null;
  const grade = oneOf(GRADES, value.grade);
  if (!grade) return null;
  return {
    grade,
    yearProgress: num(value.year_progress),
    total: num(value.total),
    expected: num(value.expected),
    mastered: num(value.mastered),
    working: num(value.working),
    gaps: num(value.gaps),
    gapTitles: list(value.gap_titles).filter((title): title is string => typeof title === 'string'),
    position: oneOf(RANKS, value.position),
  };
}

function readChild(value: unknown): RecapChild | null {
  if (!isRow(value)) return null;
  const grade = oneOf(GRADES, value.grade);
  const id = text(value.id);
  return grade && id ? { id, name: text(value.name), grade } : null;
}

const readLearnt = (value: unknown): LearntSkill[] =>
  compact(
    list(value).map((item) =>
      isRow(item) && text(item.skill) ? { skill: text(item.skill), title: text(item.title) } : null,
    ),
  );

const strings = (value: unknown): string[] =>
  list(value).filter((item): item is string => typeof item === 'string');

/** child_progress's answer; null if damaged. */
export function readProgress(value: unknown): ChildProgress | null {
  if (!isRow(value) || !isRow(value.calendar) || !isRow(value.series)) return null;
  const today = date(value.today);
  const month = date(value.calendar.month);
  const range = oneOf(PROGRESS_RANGES, value.series.range);
  const from = date(value.series.from);
  const to = date(value.series.to);
  if (!today || !month || !range || !from || !to) return null;
  return {
    today,
    verdict: readVerdict(value.verdict),
    calendar: {
      month,
      days: compact(
        list(value.calendar.days).map((item) => {
          const day = readDay(item);
          return day && isRow(item) ? { ...day, minutes: num(item.minutes) } : null;
        }),
      ),
    },
    series: {
      range,
      from,
      to,
      days: compact(list(value.series.days).map(readPoint)),
      weeks: compact(list(value.series.weeks).map(readPoint)),
    },
    domains: compact(list(value.domains).map(readDomain)),
    skills: compact(list(value.skills).map(readSkill)),
    blocking: compact(list(value.blocking).map(readBlocking)),
    programme: readProgramme(value.programme),
  };
}

function readToWork(value: unknown): BlockingPoint | WeakSkill | null {
  if (!isRow(value)) return null;
  if ('errors' in value) return readBlocking(value);
  const skill = text(value.skill);
  return skill ? { skill, title: text(value.title), mastery: num(value.mastery) } : null;
}

/** A recap's content (recaps.content); null if damaged. */
export function readRecap(value: unknown): Recap | null {
  if (!isRow(value)) return null;
  const child = readChild(value.child);
  const from = date(value.from);
  const to = date(value.to);
  if (!child || !from || !to) return null;
  const common = {
    child,
    from,
    to,
    days: compact(list(value.days).map(readDay)),
    planned: num(value.planned),
    done: num(value.done),
    active: num(value.active),
    minutes: num(value.minutes),
    answered: num(value.answered),
    correct: num(value.correct),
    xp: num(value.xp),
    streak: num(value.streak),
    bestStreak: num(value.best_streak),
    learned: readLearnt(value.learned),
    verdict: readVerdict(value.verdict),
  };
  if (value.kind === 'weekly') {
    return {
      kind: 'weekly',
      ...common,
      extra: num(value.extra),
      toWork: readToWork(value.to_work),
    };
  }
  if (value.kind !== 'monthly') return null;
  return {
    kind: 'monthly',
    ...common,
    offDays: num(value.off_days),
    vacationDays: num(value.vacation_days),
    doneDates: compact(list(value.done_dates).map(date)),
    skippedDates: compact(
      list(value.skipped_dates).map((item) => {
        const day = isRow(item) ? date(item.date) : null;
        return day && isRow(item) ? { date: day, started: item.started === true } : null;
      }),
    ),
    domains: compact(list(value.domains).map(readDomainChange)),
    badges: strings(value.badges),
    rewards: strings(value.rewards),
    blocking: compact(list(value.blocking).map(readBlocking)),
    programme: readProgramme(value.programme),
  };
}

/** A recap's tips (recaps.advice); null before they are written. */
export function readAdvice(value: unknown): RecapAdvice | null {
  if (!isRow(value)) return null;
  const source = oneOf(['ai', 'standard'] as const, value.source);
  const tips = strings(value.tips).filter((tip) => tip.trim() !== '');
  return source && tips.length > 0 ? { source, tips } : null;
}

/** child_highlights's answer: null when there is nothing to celebrate. */
export function readHighlights(value: unknown): ChildHighlights | null {
  if (!isRow(value)) return null;
  const kind = oneOf(['week', 'month'] as const, value.kind);
  const from = date(value.from);
  const to = date(value.to);
  if (!kind || !from || !to) return null;
  return {
    kind,
    from,
    to,
    days: num(value.days),
    correct: num(value.correct),
    xp: num(value.xp),
    learned: num(value.learned),
    badges: num(value.badges),
  };
}

/** Why the verdict is what it is, for the sentence that says it. */
export type VerdictReason = 'none' | 'inactive' | 'good' | 'irregular' | 'struggling' | 'both';

export function verdictReason(verdict: Verdict): VerdictReason {
  if (verdict.level === 'none') return 'none';
  if (verdict.planned > 0 && verdict.active === 0) return 'inactive';
  if (verdict.irregular && verdict.struggling) return 'both';
  if (verdict.irregular) return 'irregular';
  if (verdict.struggling) return 'struggling';
  return 'good';
}

/** Share of right answers, when there are enough answers to tell. */
export const successRate = (answered: number, correct: number): number | null =>
  answered >= 10 ? correct / answered : null;
