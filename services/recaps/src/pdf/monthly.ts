import type { MonthlyRecap, RecapAdvice } from '@math-genius/shared';

import { COLORS, DAY_COLORS, VERDICT_COLORS } from '../email';
import { shownMistake } from '../examples';
import { dayOf, isoWeekday } from '../format';
import type { RecapTexts } from '../texts';
import { type FontName, PdfDocument, type PdfPage, textWidth, wrapText } from './writer';

/**
 * The monthly recap as a PDF (docs/specs.md, Récap mensuel : PDF téléchargeable), in the order of
 * the email: verdict, figures, regularity with its calendar and dates, mastery by domain, what
 * was learnt, badges and rewards, points of difficulty with a real mistake, the programme, then
 * the tips. Stored in Storage by the recaps Edge Function, attached to the email.
 */

const MARGIN = 40;
const HEADER = 96;
const FOOTER = 36;
const BODY = 10.5;
const LINE = 14.5;

class Layout {
  readonly doc: PdfDocument;
  page!: PdfPage;
  top = 0;
  readonly width: number;

  constructor(
    title: string,
    created: Date,
    private readonly header: (page: PdfPage, first: boolean) => void,
  ) {
    this.doc = new PdfDocument({ title, created });
    this.newPage(true);
    this.width = this.page.width - 2 * MARGIN;
  }

  private newPage(first: boolean) {
    this.page = this.doc.addPage();
    this.header(this.page, first);
    this.top = first ? HEADER + 32 : MARGIN + 8;
  }

  /** Room for `height` points on this page, or a new one. */
  ensure(height: number) {
    if (this.top + height > this.page.height - FOOTER - 12) this.newPage(false);
  }

  space(height: number) {
    this.top += height;
  }

  lines(
    text: string,
    options: { font?: FontName; size?: number; color?: string; x?: number; width?: number } = {},
  ) {
    const {
      font = 'regular',
      size = BODY,
      color = COLORS.ink,
      x = MARGIN,
      width = this.width,
    } = options;
    const height = size * (LINE / BODY);
    for (const line of wrapText(text, font, size, width)) {
      this.ensure(height);
      this.top += height;
      this.page.text(x, this.top - (height - size) / 2 - 2, line, { font, size, color });
    }
  }

  heading(text: string) {
    this.ensure(48);
    this.space(14);
    this.lines(text, { font: 'bold', size: 13 });
    this.page.line(MARGIN, this.top + 4, MARGIN + 28, this.top + 4, COLORS.pink, 2);
    this.space(10);
  }

  bullets(items: readonly string[], numbered = false) {
    items.forEach((item, index) => {
      const mark = numbered ? `${index + 1}.` : '•';
      this.ensure(LINE);
      const start = this.top;
      this.lines(item, { x: MARGIN + 16, width: this.width - 16 });
      this.page.text(MARGIN + 2, start + LINE - 4, mark, {
        font: 'bold',
        size: BODY,
        color: COLORS.pink,
      });
      this.space(2);
    });
  }
}

function tiles(
  layout: Layout,
  items: readonly { label: string; value: string; detail?: string }[],
) {
  const gap = 8;
  const width = (layout.width - gap * (items.length - 1)) / items.length;
  const height = 58;
  layout.ensure(height + 8);
  items.forEach((item, index) => {
    const x = MARGIN + index * (width + gap);
    layout.page.rect(x, layout.top, width, height, { fill: COLORS.card, radius: 8 });
    layout.page.text(x + 8, layout.top + 15, item.label.toUpperCase(), {
      size: 7,
      color: COLORS.muted,
      font: 'bold',
    });
    layout.page.text(x + 8, layout.top + 35, item.value, {
      font: 'bold',
      size: 15,
      color: COLORS.ink,
    });
    if (item.detail)
      layout.page.text(x + 8, layout.top + 50, item.detail, { size: 8, color: COLORS.muted });
  });
  layout.space(height + 8);
}

function calendar(layout: Layout, texts: RecapTexts, recap: MonthlyRecap) {
  const first = recap.days[0];
  if (!first) return;
  const cell = 24;
  const blanks = isoWeekday(first.date) - 1;
  const rows = Math.ceil((blanks + recap.days.length) / 7);
  layout.ensure(cell * (rows + 1) + 24);
  const top = layout.top;
  texts.weekly.week.forEach((letter, index) => {
    const x = MARGIN + index * cell + cell / 2 - textWidth(letter, 'bold', 8) / 2;
    layout.page.text(x, top + 10, letter, { font: 'bold', size: 8, color: COLORS.muted });
  });
  recap.days.forEach((day, index) => {
    const position = blanks + index;
    const cx = MARGIN + (position % 7) * cell + cell / 2;
    const cy = top + 16 + Math.floor(position / 7) * cell + cell / 2;
    const light = day.status === 'pending' || day.status === 'none';
    layout.page.circle(cx, cy, 9.5, {
      fill: DAY_COLORS[day.status],
      ...(light ? { stroke: COLORS.line, lineWidth: 0.8 } : {}),
    });
    const label = String(dayOf(day.date).day);
    const dark = day.status === 'off' || day.status === 'vacation' || light;
    layout.page.text(cx - textWidth(label, 'bold', 7.5) / 2, cy + 2.7, label, {
      font: 'bold',
      size: 7.5,
      color: dark ? COLORS.muted : COLORS.white,
    });
  });
  // The legend, to the right of the calendar.
  const legend: [keyof typeof DAY_COLORS, string][] = [
    ['done', texts.legend.done],
    ['started', texts.legend.started],
    ['missed', texts.legend.missed],
    ['off', texts.legend.off],
  ];
  legend.forEach(([status, label], index) => {
    const y = top + 26 + index * 16;
    layout.page.circle(MARGIN + 7 * cell + 30, y - 3, 5, { fill: DAY_COLORS[status] });
    layout.page.text(MARGIN + 7 * cell + 42, y, label, { size: 9, color: COLORS.ink });
  });
  layout.top = top + 16 + rows * cell + 8;
}

function bars(layout: Layout, texts: RecapTexts, recap: MonthlyRecap) {
  for (const domain of recap.domains) {
    layout.ensure(30);
    layout.lines(texts.monthly.masteryLine(domain.domain, domain.start, domain.end), { size: 9.5 });
    const top = layout.top + 3;
    const end = Math.max(0, Math.min(100, domain.end));
    const start = Math.max(0, Math.min(end, domain.start));
    layout.page.rect(MARGIN, top, layout.width, 8, { fill: COLORS.line, radius: 4 });
    if (end > 0)
      layout.page.rect(MARGIN, top, (layout.width * end) / 100, 8, {
        fill: COLORS.pink,
        radius: 4,
      });
    if (start > 0)
      layout.page.rect(MARGIN, top, (layout.width * start) / 100, 8, {
        fill: COLORS.lavender,
        radius: 4,
      });
    layout.space(16);
  }
}

function blocking(layout: Layout, texts: RecapTexts, recap: MonthlyRecap) {
  for (const point of recap.blocking) {
    const shown = shownMistake(point);
    const details = [
      texts.monthly.errors(point.errors, point.answered),
      ...(point.errorLabel ? [`${texts.example.mistake} : ${point.errorLabel}`] : []),
      ...(shown
        ? [
            `${texts.example.prompt} : ${shown.prompt}`,
            `${texts.example.given} : ${shown.given}`,
            `${texts.example.expected} : ${shown.expected}`,
          ]
        : []),
    ];
    layout.ensure(LINE * (details.length + 2));
    const page = layout.page;
    const top = layout.top;
    layout.lines(point.title, { font: 'bold', x: MARGIN + 12, width: layout.width - 12 });
    for (const detail of details) {
      layout.lines(detail.replace(/\n/g, ' ; '), {
        x: MARGIN + 12,
        width: layout.width - 12,
        size: 9.5,
        color: COLORS.muted,
      });
    }
    // The bar along the point, on its page (a long point may go on to the next one).
    if (layout.page === page)
      page.rect(MARGIN, top + 3, 3, layout.top - top, { fill: COLORS.pink });
    layout.space(10);
  }
}

/** The month's PDF, written at `created` (its metadata), on the family's day `today` (its footer). */
export function monthlyPdf(
  recap: MonthlyRecap,
  advice: RecapAdvice,
  texts: RecapTexts,
  { created, today }: { created: Date; today: string },
): Uint8Array {
  const t = texts.monthly;
  const name = recap.child.name;
  const title = `${t.heading(recap.from)} – ${name}`;
  const layout = new Layout(title, created, (page, first) => {
    if (first) {
      page.rect(0, 0, page.width, HEADER, { fill: COLORS.night });
      page.text(MARGIN, 32, texts.brand.toUpperCase(), {
        font: 'bold',
        size: 9,
        color: COLORS.pink,
      });
      page.text(MARGIN, 60, `${t.heading(recap.from)} ${dayOf(recap.from).year}`, {
        font: 'bold',
        size: 22,
        color: COLORS.white,
      });
      page.text(MARGIN, 80, `${name} · ${recap.child.grade}`, { size: 11, color: COLORS.lavender });
    } else {
      page.rect(0, 0, page.width, 6, { fill: COLORS.night });
    }
  });

  layout.lines(t.title(name), { font: 'bold', size: 17 });
  layout.space(10);

  // The verdict, in its color.
  const color = VERDICT_COLORS[recap.verdict.level];
  const sentence = texts.verdict.sentence(name, recap.verdict, 'month');
  const sentenceLines = wrapText(sentence, 'regular', BODY, layout.width - 32);
  const boxHeight = 30 + sentenceLines.length * LINE;
  layout.page.rect(MARGIN, layout.top, layout.width, boxHeight, { fill: COLORS.card, radius: 8 });
  layout.page.rect(MARGIN, layout.top, 5, boxHeight, { fill: color });
  layout.page.circle(MARGIN + 20, layout.top + 15, 4, { fill: color });
  layout.page.text(MARGIN + 30, layout.top + 18.5, texts.verdict.title[recap.verdict.level], {
    font: 'bold',
    size: 11,
    color,
  });
  sentenceLines.forEach((line, index) => {
    layout.page.text(MARGIN + 16, layout.top + 36 + index * LINE, line, {
      size: BODY,
      color: COLORS.ink,
    });
  });
  layout.space(boxHeight + 12);

  const s = texts.stats;
  tiles(layout, [
    recap.planned > 0
      ? { label: s.days, value: `${recap.done}`, detail: s.plannedDays(recap.planned) }
      : { label: s.days, value: `${recap.active}`, detail: s.played },
    { label: s.time, value: texts.duration(recap.minutes) },
    {
      label: s.success,
      value: recap.verdict.success === null ? s.none : texts.percent(recap.verdict.success),
    },
    { label: s.xp, value: `+${texts.integer(recap.xp)}` },
    { label: s.streak, value: s.streakValue(recap.streak) },
  ]);

  layout.heading(t.regularity);
  calendar(layout, texts, recap);
  if (recap.doneDates.length > 0) layout.lines(t.doneDates(recap.doneDates));
  layout.lines(recap.skippedDates.length > 0 ? t.skippedDates(recap.skippedDates) : t.noSkipped);
  const off = t.offDays(recap.offDays, recap.vacationDays);
  if (off) layout.lines(off, { color: COLORS.muted });

  if (recap.domains.length > 0) {
    layout.heading(t.mastery);
    bars(layout, texts, recap);
    layout.lines(t.masteryNote, { size: 9, color: COLORS.muted });
  }

  layout.heading(t.learned);
  if (recap.learned.length > 0) layout.bullets(recap.learned.map((skill) => skill.title));
  else layout.lines(t.learnedNone, { color: COLORS.muted });

  layout.heading(t.badges);
  if (recap.badges.length > 0) layout.bullets(recap.badges.map(texts.badge));
  else layout.lines(t.badgesNone, { color: COLORS.muted });

  layout.heading(t.rewards);
  if (recap.rewards.length > 0) layout.bullets(recap.rewards);
  else layout.lines(t.rewardsNone, { color: COLORS.muted });

  layout.heading(t.blocking);
  if (recap.blocking.length > 0) blocking(layout, texts, recap);
  else layout.lines(t.blockingNone, { color: COLORS.muted });

  const programme = recap.programme ? texts.programme(name, recap.programme) : null;
  if (programme) {
    layout.heading(t.programme);
    layout.lines(programme);
    layout.lines(texts.programmeNote, { size: 9, color: COLORS.muted });
  }

  layout.heading(t.advice(recap.from));
  layout.bullets(advice.tips, true);
  layout.lines(t.adviceSource[advice.source], { size: 9, color: COLORS.muted });

  // Footers, once the number of pages is known.
  const pages = layout.doc.pages;
  const generated = t.generated(today);
  pages.forEach((page, index) => {
    const bottom = page.height - FOOTER / 2;
    page.line(MARGIN, bottom - 14, page.width - MARGIN, bottom - 14, COLORS.line, 0.5);
    page.text(MARGIN, bottom, `${texts.brand} · ${generated}`, { size: 8, color: COLORS.muted });
    const number = t.page(index + 1, pages.length);
    page.text(page.width - MARGIN - textWidth(number, 'regular', 8), bottom, number, {
      size: 8,
      color: COLORS.muted,
    });
  });

  return layout.doc.toBytes();
}
