import {
  isSkippedAnswer,
  parseStoredResponse,
  rebuildExercise,
} from '@math-genius/exercise-engine';
import {
  type BlockingPoint,
  type ChildHighlights,
  type ChildProgress,
  type ProgrammePosition,
  type SeriesPoint,
  type SkillList,
  type SkillState,
  type Verdict,
  verdictReason,
} from '@math-genius/shared';

import { strings } from '@/i18n';
import { responseText, rightAnswerText } from '@/utils/exercise-text';

/**
 * The « Progrès » page and the child's card, read from what the database computed
 * (child_progress, child_highlights): pure functions, tested without Supabase.
 */

const t = strings.progress;

const utc = (date: string) => {
  const [year = 1970, month = 1, day = 1] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};
const monthFormat = new Intl.DateTimeFormat('fr-FR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const monthOnly = new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'UTC' });
const dayFormat = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});
const shortDate = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'numeric',
  timeZone: 'UTC',
});

/** « septembre 2026 ». */
export const monthLabel = (date: string) => monthFormat.format(utc(date));
/** « septembre ». */
export const monthName = (date: string) => monthOnly.format(utc(date));
/** « mardi 1 septembre ». */
export const dayLabel = (date: string) => dayFormat.format(utc(date));

/** The first day of the month `by` months away ("YYYY-MM-01"). */
export function shiftMonth(month: string, by: number): string {
  const date = utc(month);
  const shifted = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + by, 1));
  return shifted.toISOString().slice(0, 10);
}

/** The month's days in weeks from Monday, with blanks before the 1st and after the last day. */
export function calendarWeeks<T extends { date: string }>(days: readonly T[]): (T | null)[][] {
  const first = days[0];
  if (!first) return [];
  const blanks = (utc(first.date).getUTCDay() + 6) % 7;
  const cells: (T | null)[] = [...Array.from({ length: blanks }, () => null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, week) => cells.slice(week * 7, week * 7 + 7));
}

/** The sentence at the top of the page, from the verdict of the last two weeks. */
export function verdictSentence(name: string, verdict: Verdict): string {
  const v = t.verdict;
  const success = verdict.success === null ? null : v.percent(verdict.success);
  const regular =
    verdict.planned > 0 ? v.sessions(verdict.done, verdict.planned) : v.played(verdict.active);
  switch (verdictReason(verdict)) {
    case 'none':
      return v.none(name);
    case 'inactive':
      return v.inactive(name, verdict.planned);
    case 'irregular':
      return v.irregular(name, regular, success, verdict.level === 'alert');
    case 'struggling':
      return v.struggling(regular, success ?? '');
    case 'both':
      return v.both(regular, success ?? '');
    case 'good':
      return v.good(name, regular, success);
  }
}

export type ChartPoint = {
  label: string;
  /** Null: nothing to show that day (no answer for the success rate). */
  value: number | null;
  /** What a screen reader says of the point. */
  description: string;
};

export type ProgressCharts = {
  /** Points of the time and success curves. */
  unit: 'day' | 'week';
  time: ChartPoint[];
  success: ChartPoint[];
  xpUnit: 'day' | 'week';
  xp: ChartPoint[];
  totals: { minutes: number; success: number | null; xp: number };
  empty: boolean;
};

const pointLabel = (point: SeriesPoint, unit: 'day' | 'week') =>
  unit === 'day' ? String(utc(point.date).getUTCDate()) : shortDate.format(utc(point.date));
const pointName = (point: SeriesPoint, unit: 'day' | 'week') =>
  unit === 'day' ? dayLabel(point.date) : t.curves.weekOf(shortDate.format(utc(point.date)));

/** Time and success by day (by week over a quarter), XP by week (by day over a week). */
export function progressCharts(series: ChildProgress['series']): ProgressCharts {
  const unit = series.range === 'quarter' ? 'week' : 'day';
  const points = unit === 'day' ? series.days : series.weeks;
  const xpUnit = series.range === 'week' ? 'day' : 'week';
  const xpPoints = xpUnit === 'day' ? series.days : series.weeks;
  const answered = series.days.reduce((sum, day) => sum + day.answered, 0);
  const correct = series.days.reduce((sum, day) => sum + day.correct, 0);
  const rate = (point: SeriesPoint) =>
    point.answered > 0 ? Math.round((100 * point.correct) / point.answered) : null;
  return {
    unit,
    time: points.map((point) => ({
      label: pointLabel(point, unit),
      value: point.minutes,
      description: t.curves.point(pointName(point, unit), t.curves.minutes(point.minutes)),
    })),
    success: points.map((point) => {
      const value = rate(point);
      return {
        label: pointLabel(point, unit),
        value,
        description: t.curves.point(
          pointName(point, unit),
          value === null ? t.curves.empty : t.curves.rate(value),
        ),
      };
    }),
    xpUnit,
    xp: xpPoints.map((point) => ({
      label: pointLabel(point, xpUnit),
      value: point.xp,
      description: t.curves.point(pointName(point, xpUnit), t.curves.xpValue(point.xp)),
    })),
    totals: {
      minutes: series.days.reduce((sum, day) => sum + day.minutes, 0),
      success: answered >= 10 ? Math.round((100 * correct) / answered) : null,
      xp: series.days.reduce((sum, day) => sum + day.xp, 0),
    },
    empty: series.days.every((day) => day.minutes === 0 && day.answered === 0),
  };
}

export const SKILL_LISTS: readonly SkillList[] = ['to_consolidate', 'in_progress', 'mastered'];

export function skillGroups(skills: readonly SkillState[]): Record<SkillList, SkillState[]> {
  const groups: Record<SkillList, SkillState[]> = {
    mastered: [],
    in_progress: [],
    to_consolidate: [],
  };
  for (const skill of skills) groups[skill.list].push(skill);
  return groups;
}

export type MistakeView = { prompt: string; given: string; expected: string };

/**
 * A point of difficulty's real mistake, rebuilt by the engine (the database never stores exercise
 * texts); null when this version of the app no longer knows the generator.
 */
export function mistakeView(point: BlockingPoint): MistakeView | null {
  const example = point.example;
  if (!example || isSkippedAnswer(example.answer)) return null;
  const exercise = rebuildExercise({
    generator_id: example.generatorId,
    difficulty: example.difficulty,
    seed: example.seed,
  });
  const response = parseStoredResponse(example.answer);
  if (!exercise || !response) return null;
  return {
    prompt: exercise.prompt,
    given: responseText(exercise, response),
    expected: rightAnswerText(exercise),
  };
}

/** Where the child stands against the programme, in two sentences. */
export function programmeText(name: string, programme: ProgrammePosition): string[] {
  const grade = strings.grades[programme.grade];
  return [
    t.programme.text(
      grade,
      programme.expected,
      programme.total,
      name,
      programme.mastered,
      programme.working,
    ),
    ...(programme.gaps > 0
      ? [
          t.programme.gaps(
            programme.gaps,
            programme.gapTitles.map((title) => `« ${title} »`).join(', '),
          ),
        ]
      : []),
  ];
}

/** The child's card: the line it leads with, never about what was missed. */
export function highlightsHeadline(highlights: ChildHighlights): string {
  const c = strings.recapCard;
  if (highlights.learned > 0) return c.learned(highlights.learned);
  if (highlights.correct > 0) return c.correct(highlights.correct);
  return c.days(highlights.days);
}

/** The other things the child did, as short tags. */
export function highlightsTags(highlights: ChildHighlights): string[] {
  const c = strings.recapCard;
  return [
    ...(highlights.days > 0 ? [c.days(highlights.days)] : []),
    ...(highlights.xp > 0 ? [c.xp(highlights.xp)] : []),
    ...(highlights.badges > 0 ? [c.badges(highlights.badges)] : []),
  ];
}

/** Which card the child already closed, by child: one per week or month. */
export const highlightsKey = (highlights: ChildHighlights) =>
  `${highlights.kind}:${highlights.from}`;
