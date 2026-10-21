import { type ChildProgress, readHighlights, readProgress, readVerdict } from '@math-genius/shared';
import {
  HIGHLIGHTS_SAMPLE,
  PROGRESS_SAMPLE,
} from '@math-genius/shared/src/testing/progress-samples';

import { strings } from '@/i18n';

import {
  calendarWeeks,
  highlightsHeadline,
  highlightsKey,
  highlightsTags,
  mistakeView,
  monthLabel,
  programmeText,
  progressCharts,
  shiftMonth,
  skillGroups,
  verdictSentence,
} from './progress-model';

const progress = readProgress(PROGRESS_SAMPLE) as ChildProgress;
const plain = (text: string) => text.replace(/ /g, ' ');

describe('the « Progrès » page', () => {
  it('lays the month out in weeks from Monday', () => {
    const weeks = calendarWeeks(progress.calendar.days);
    // 1 September 2026 is a Tuesday.
    expect(weeks).toHaveLength(5);
    expect(weeks[0]?.[0]).toBeNull();
    expect(weeks[0]?.[1]?.date).toBe('2026-09-01');
    expect(weeks[4]?.[2]?.date).toBe('2026-09-30');
    expect(weeks[4]?.slice(3)).toEqual([null, null, null, null]);
    expect(calendarWeeks([])).toEqual([]);
  });

  it('moves from month to month', () => {
    expect(shiftMonth('2026-09-01', -1)).toBe('2026-08-01');
    expect(shiftMonth('2026-12-01', 1)).toBe('2027-01-01');
    expect(monthLabel('2026-09-01')).toBe('septembre 2026');
  });

  it('says whether it goes well in one sentence', () => {
    expect(plain(verdictSentence('Léa', progress.verdict))).toBe(
      'Quelques séances manquées : 3 séances sur 5 prévues. Quand Léa joue, la réussite est bonne (80 %).',
    );
    const verdict = readVerdict({ level: 'good', planned: 5, done: 5, active: 5, success: 0.9 });
    expect(plain(verdictSentence('Léa', verdict))).toBe(
      'Léa a fait 5 séances sur 5 prévues, avec 90 % de bonnes réponses.',
    );
    expect(verdictSentence('Léa', { ...verdict, level: 'alert', active: 0, done: 0 })).toBe(
      strings.progress.verdict.inactive('Léa', 5),
    );
    expect(plain(verdictSentence('Léa', { ...verdict, struggling: true, success: 0.5 }))).toContain(
      'mais la réussite baisse : 50 %',
    );
    expect(verdictSentence('Léa', { ...verdict, level: 'none' })).toBe(
      strings.progress.verdict.none('Léa'),
    );
  });

  it('draws time and success by day and XP by week over a month', () => {
    const charts = progressCharts(progress.series);
    expect(charts.unit).toBe('day');
    expect(charts.time).toHaveLength(30);
    expect(charts.time[0]).toMatchObject({ label: '1', value: 15 });
    expect(charts.success[0]?.value).toBe(80);
    // No answer on a day off: no point.
    expect(charts.success[4]?.value).toBeNull();
    expect(charts.xpUnit).toBe('week');
    expect(charts.xp.map((point) => point.value)).toEqual([280, 280, 280, 70, 140]);
    expect(charts.totals).toEqual({ minutes: 240, success: 79, xp: 1050 });
    expect(charts.empty).toBe(false);
  });

  it('draws by week over a quarter, and XP by day over a week', () => {
    expect(progressCharts({ ...progress.series, range: 'quarter' })).toMatchObject({
      unit: 'week',
      xpUnit: 'week',
    });
    expect(progressCharts({ ...progress.series, range: 'week' })).toMatchObject({
      unit: 'day',
      xpUnit: 'day',
    });
    expect(progressCharts({ ...progress.series, days: [], weeks: [] }).empty).toBe(true);
  });

  it('groups the skills mastered, in progress and to consolidate', () => {
    const groups = skillGroups(progress.skills);
    expect(groups.mastered.map((skill) => skill.code).sort()).toEqual([
      'cm1.nombres-decimaux',
      'cm1.proportionnalite',
    ]);
    expect(groups.in_progress.map((skill) => skill.code)).toEqual(['cm1.comparer-decimaux']);
    expect(groups.to_consolidate).toHaveLength(4);
  });

  it('rebuilds a real mistake with the engine', () => {
    expect(mistakeView(progress.blocking[0] as ChildProgress['blocking'][number])).toEqual({
      prompt: 'Range ces nombres du plus petit au plus grand.',
      given: '4,5 < 4,8 < 4,35 < 4,42',
      expected: '4,35 < 4,42 < 4,5 < 4,8',
    });
    const point = progress.blocking[0] as ChildProgress['blocking'][number];
    expect(mistakeView({ ...point, example: null })).toBeNull();
  });

  it('compares the child with the programme', () => {
    expect(
      programmeText('Léa', progress.programme as NonNullable<ChildProgress['programme']>).map(
        plain,
      ),
    ).toEqual([
      'À cette période, la classe de CM1 a abordé environ 1 compétence sur 6. Léa en maîtrise 2 et en travaille 3.',
      '1 notion des années précédentes à consolider : « Connaître les tables de multiplication de 2 à 10 ».',
    ]);
  });
});

describe('the child’s card', () => {
  it('leads with what was learnt, never with what was missed', () => {
    const highlights = readHighlights(HIGHLIGHTS_SAMPLE);
    if (!highlights) throw new Error('sample');
    expect(plain(highlightsHeadline(highlights))).toBe('Tu as appris 2 nouvelles choses !');
    expect(highlightsTags(highlights)).toEqual([
      strings.recapCard.days(15),
      strings.recapCard.xp(1050),
      strings.recapCard.badges(2),
    ]);
    expect(plain(highlightsHeadline({ ...highlights, learned: 0 }))).toBe(
      'Tu as réussi 122 exercices !',
    );
    expect(plain(highlightsHeadline({ ...highlights, learned: 0, correct: 0 }))).toBe(
      '15 jours de mission',
    );
    expect(highlightsKey(highlights)).toBe('month:2026-09-01');
  });
});
