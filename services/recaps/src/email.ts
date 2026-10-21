import type {
  BlockingPoint,
  CalendarDay,
  CalendarStatus,
  MonthlyRecap,
  RecapAdvice,
  Verdict,
  VerdictLevel,
  WeeklyRecap,
} from '@math-genius/shared';

import { shownMistake } from './examples';
import { dayOf, isoWeekday } from './format';
import type { RecapTexts } from './texts';

/**
 * The recaps' emails (docs/specs.md, Statistiques et récaps): a clear sentence and a colored
 * verdict first, then the figures, the points of difficulty and, for the month, the tips. Sober
 * for the parent, with the app's Neon Stage colors in the header. Inline styles and tables only,
 * for every mail client; a text version goes with each. Every email has its unsubscribe links.
 */

export const COLORS = {
  night: '#120B2E',
  pink: '#FF3EA5',
  cyan: '#2EE6FF',
  lavender: '#C3B8F0',
  ink: '#1B1530',
  muted: '#5E5874',
  line: '#E6E2F0',
  card: '#F7F5FC',
  page: '#EFEDF5',
  white: '#FFFFFF',
} as const;

/** The verdict's color: green, orange, red, or grey without a verdict. */
export const VERDICT_COLORS: Record<VerdictLevel, string> = {
  good: '#1E9E63',
  watch: '#D9760B',
  alert: '#D63B3B',
  none: '#8A84A0',
};

/** The calendar's colors: green done, orange started, red missed, grey day off or holidays. */
export const DAY_COLORS: Record<CalendarStatus, string> = {
  done: '#1E9E63',
  started: '#F08A24',
  missed: '#D63B3B',
  off: '#C9C4D8',
  vacation: '#C9C4D8',
  pending: '#FFFFFF',
  none: '#EFEDF5',
};

export type EmailLinks = {
  /** The child's « Progrès » page in the web app; none without APP_URL. */
  app: string | null;
  unsubscribe: string;
  unsubscribeAll: string;
};

export type RenderedEmail = { subject: string; html: string; text: string };

const escape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const FONT = 'font-family:Helvetica,Arial,sans-serif;';

function shell(
  title: string,
  heading: string,
  subheading: string,
  preheader: string,
  body: string,
  footer: string,
) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};${FONT}color:${COLORS.ink};">
<div style="display:none;max-height:0;overflow:hidden;">${escape(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS.white};border-radius:16px;overflow:hidden;">
<tr><td style="background:${COLORS.night};padding:20px 24px;">
<div style="${FONT}color:${COLORS.pink};font-size:12px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;">Math Genius</div>
<div style="${FONT}color:${COLORS.white};font-size:22px;font-weight:bold;margin-top:6px;">${escape(heading)}</div>
<div style="${FONT}color:${COLORS.lavender};font-size:14px;margin-top:2px;">${escape(subheading)}</div>
</td></tr>
<tr><td style="padding:24px;${FONT}font-size:15px;line-height:1.5;">
${body}
</td></tr>
<tr><td style="padding:16px 24px;background:${COLORS.card};${FONT}font-size:12px;line-height:1.5;color:${COLORS.muted};">
${footer}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

const h1 = (text: string) =>
  `<h1 style="${FONT}font-size:20px;line-height:1.3;margin:0 0 16px;color:${COLORS.ink};">${escape(text)}</h1>`;
const h2 = (text: string) =>
  `<h2 style="${FONT}font-size:16px;line-height:1.3;margin:24px 0 8px;color:${COLORS.ink};">${escape(text)}</h2>`;
const p = (text: string, muted = false) =>
  `<p style="${FONT}margin:0 0 8px;color:${muted ? COLORS.muted : COLORS.ink};">${escape(text)}</p>`;

function verdictBox(texts: RecapTexts, verdict: Verdict, sentence: string) {
  const color = VERDICT_COLORS[verdict.level];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="border-left:6px solid ${color};background:${COLORS.card};padding:12px 16px;border-radius:8px;">
<div style="${FONT}font-weight:bold;color:${color};font-size:14px;">&#9679; ${escape(texts.verdict.title[verdict.level])}</div>
<div style="${FONT}margin-top:4px;color:${COLORS.ink};">${escape(sentence)}</div>
</td></tr></table>`;
}

type Tile = { label: string; value: string; detail?: string };

function tiles(items: readonly Tile[]) {
  const cells = items.map(
    (item) => `<td valign="top" style="padding:4px;width:${Math.floor(100 / items.length)}%;">
<div style="background:${COLORS.card};border-radius:10px;padding:10px 8px;text-align:center;">
<div style="${FONT}font-size:11px;color:${COLORS.muted};text-transform:uppercase;letter-spacing:1px;">${escape(item.label)}</div>
<div style="${FONT}font-size:20px;font-weight:bold;color:${COLORS.ink};margin-top:2px;">${escape(item.value)}</div>
${item.detail ? `<div style="${FONT}font-size:12px;color:${COLORS.muted};">${escape(item.detail)}</div>` : ''}
</div></td>`,
  );
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;"><tr>${cells.join('')}</tr></table>`;
}

function dot(status: CalendarStatus, label: string, size = 28) {
  const border =
    status === 'pending' || status === 'none' ? `border:1px solid ${COLORS.line};` : '';
  return `<div style="width:${size}px;height:${size}px;line-height:${size}px;border-radius:${size / 2}px;background:${DAY_COLORS[status]};${border}margin:0 auto;text-align:center;${FONT}font-size:11px;color:${status === 'done' || status === 'missed' || status === 'started' ? COLORS.white : COLORS.muted};">${escape(label)}</div>`;
}

function legend(texts: RecapTexts) {
  const items: [CalendarStatus, string][] = [
    ['done', texts.legend.done],
    ['started', texts.legend.started],
    ['missed', texts.legend.missed],
    ['off', texts.legend.off],
  ];
  return `<div style="${FONT}font-size:12px;color:${COLORS.muted};margin-top:8px;">${items
    .map(
      ([status, label]) =>
        `<span style="display:inline-block;margin-right:12px;"><span style="display:inline-block;width:10px;height:10px;border-radius:5px;background:${DAY_COLORS[status]};vertical-align:middle;"></span> ${escape(label)}</span>`,
    )
    .join('')}</div>`;
}

function weekRow(texts: RecapTexts, days: readonly CalendarDay[]) {
  const cells = days.map(
    (day, index) => `<td align="center" style="padding:2px;">
<div style="${FONT}font-size:11px;color:${COLORS.muted};margin-bottom:4px;">${escape(texts.weekly.week[index] ?? '')}</div>
${dot(day.status, String(dayOf(day.date).day))}</td>`,
  );
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;"><tr>${cells.join('')}</tr></table>`;
}

function monthGrid(texts: RecapTexts, days: readonly CalendarDay[]) {
  const first = days[0];
  if (!first) return '';
  const blanks = isoWeekday(first.date) - 1;
  const cells = [
    ...Array.from({ length: blanks }, () => '<td></td>'),
    ...days.map(
      (day) =>
        `<td align="center" style="padding:2px;">${dot(day.status, String(dayOf(day.date).day), 26)}</td>`,
    ),
  ];
  const rows: string[] = [];
  for (let start = 0; start < cells.length; start += 7) {
    const row = cells.slice(start, start + 7);
    while (row.length < 7) row.push('<td></td>');
    rows.push(`<tr>${row.join('')}</tr>`);
  }
  const header = texts.weekly.week
    .map(
      (letter) =>
        `<td align="center" style="${FONT}font-size:11px;color:${COLORS.muted};padding-bottom:2px;">${letter}</td>`,
    )
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0;"><tr>${header}</tr>${rows.join('')}</table>`;
}

function bar(label: string, start: number, end: number) {
  const value = Math.max(0, Math.min(100, end));
  const before = Math.max(0, Math.min(value, start));
  return `<div style="${FONT}font-size:13px;margin:10px 0 4px;color:${COLORS.ink};">${escape(label)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:6px;overflow:hidden;background:${COLORS.line};"><tr>
${before > 0 ? `<td style="width:${before}%;height:10px;background:${COLORS.lavender};"></td>` : ''}
${value - before > 0 ? `<td style="width:${value - before}%;height:10px;background:${COLORS.pink};"></td>` : ''}
<td style="height:10px;"></td>
</tr></table>`;
}

function mistakeBlock(texts: RecapTexts, point: BlockingPoint, detail: string) {
  const shown = shownMistake(point);
  const rows = shown
    ? [
        [texts.example.prompt, shown.prompt],
        [texts.example.given, shown.given],
        [texts.example.expected, shown.expected],
      ]
    : [];
  return `<div style="background:${COLORS.card};border-radius:10px;padding:12px 16px;margin:8px 0;">
<div style="${FONT}font-weight:bold;color:${COLORS.ink};">${escape(point.title)}</div>
<div style="${FONT}font-size:13px;color:${COLORS.muted};">${escape(detail)}</div>
${point.errorLabel ? `<div style="${FONT}font-size:14px;margin-top:6px;">${escape(texts.example.mistake)} : ${escape(point.errorLabel)}</div>` : ''}
${rows
  .map(
    ([label, value]) =>
      `<div style="${FONT}font-size:14px;margin-top:4px;"><span style="color:${COLORS.muted};">${escape(label ?? '')} :</span> ${escape(value ?? '').replace(/\n/g, '<br>')}</div>`,
  )
  .join('')}
</div>`;
}

const list = (items: readonly string[]) =>
  `<ul style="${FONT}margin:0 0 8px;padding-left:20px;">${items.map((item) => `<li style="margin:2px 0;">${escape(item)}</li>`).join('')}</ul>`;

function cta(texts: RecapTexts, links: EmailLinks) {
  return links.app
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr><td style="background:${COLORS.pink};border-radius:24px;">
<a href="${escape(links.app)}" style="display:inline-block;padding:12px 24px;${FONT}font-weight:bold;color:${COLORS.night};text-decoration:none;">${escape(texts.cta)}</a>
</td></tr></table>`
    : `<p style="${FONT}margin:24px 0 0;color:${COLORS.muted};">${escape(texts.openApp)}</p>`;
}

function footer(texts: RecapTexts, kind: 'weekly' | 'monthly', links: EmailLinks) {
  const link = (href: string, label: string) =>
    `<a href="${escape(href)}" style="color:${COLORS.muted};text-decoration:underline;">${escape(label)}</a>`;
  return `${escape(texts.footer.why(kind))}<br>
${link(links.unsubscribe, texts.footer.unsubscribe(kind))} · ${link(links.unsubscribeAll, texts.footer.unsubscribeAll)}<br>
${escape(texts.footer.settings)}`;
}

const footerText = (texts: RecapTexts, kind: 'weekly' | 'monthly', links: EmailLinks) =>
  [
    texts.footer.why(kind),
    `${texts.footer.unsubscribe(kind)} : ${links.unsubscribe}`,
    `${texts.footer.unsubscribeAll} : ${links.unsubscribeAll}`,
    texts.footer.settings,
  ].join('\n');

function statTiles(texts: RecapTexts, recap: WeeklyRecap | MonthlyRecap): Tile[] {
  const s = texts.stats;
  const daysTile =
    recap.planned > 0
      ? {
          label: recap.kind === 'weekly' ? s.sessions : s.days,
          value: `${recap.done}`,
          detail: recap.kind === 'weekly' ? s.planned(recap.planned) : s.plannedDays(recap.planned),
        }
      : {
          label: recap.kind === 'weekly' ? s.sessions : s.days,
          value: `${recap.active}`,
          detail: s.played,
        };
  return [
    daysTile,
    { label: s.streak, value: s.streakValue(recap.streak) },
    { label: s.time, value: texts.duration(recap.minutes) },
    {
      label: s.success,
      value: recap.verdict.success === null ? s.none : texts.percent(recap.verdict.success),
    },
  ];
}

/** The weekly recap's email to one parent. */
export function weeklyEmail(
  recap: WeeklyRecap,
  texts: RecapTexts,
  links: EmailLinks,
): RenderedEmail {
  const t = texts.weekly;
  const name = recap.child.name;
  const sentence = texts.verdict.sentence(name, recap.verdict, 'week');
  const [learnt, ...others] = recap.learned;
  const toWork = recap.toWork;
  const toWorkDetail =
    toWork && 'errors' in toWork
      ? texts.monthly.errors(toWork.errors, toWork.answered)
      : toWork
        ? t.mastery(toWork.mastery)
        : '';
  const tilesData = statTiles(texts, recap);
  const body = [
    h1(t.title(name)),
    verdictBox(texts, recap.verdict, sentence),
    weekRow(texts, recap.days),
    legend(texts),
    tiles(tilesData),
    h2(t.learned),
    learnt
      ? p(others.length > 0 ? `${learnt.title} (${t.learnedMore(others.length)})` : learnt.title)
      : p(t.learnedNone, true),
    h2(t.toWork),
    toWork
      ? 'errors' in toWork
        ? mistakeBlock(texts, toWork, toWorkDetail)
        : `<div style="background:${COLORS.card};border-radius:10px;padding:12px 16px;"><div style="${FONT}font-weight:bold;">${escape(toWork.title)}</div><div style="${FONT}font-size:13px;color:${COLORS.muted};">${escape(toWorkDetail)}</div></div>`
      : p(t.toWorkNone, true),
    cta(texts, links),
  ].join('\n');
  const subject = t.subject(name, recap.from, recap.to);
  const text = [
    `${t.title(name)} — ${t.period(recap.from, recap.to)}`,
    '',
    `${texts.verdict.title[recap.verdict.level]}. ${sentence}`,
    '',
    ...tilesData.map(
      (tile) => `${tile.label} : ${tile.value}${tile.detail ? ` ${tile.detail}` : ''}`,
    ),
    '',
    `${t.learned} : ${learnt ? learnt.title : t.learnedNone}`,
    `${t.toWork} : ${toWork ? `${toWork.title} (${toWorkDetail})` : t.toWorkNone}`,
    '',
    links.app ? `${texts.cta} : ${links.app}` : texts.openApp,
    '',
    footerText(texts, 'weekly', links),
  ].join('\n');
  return {
    subject,
    html: shell(
      subject,
      t.heading,
      t.period(recap.from, recap.to),
      sentence,
      body,
      footer(texts, 'weekly', links),
    ),
    text,
  };
}

/** The monthly recap's email to one parent; its PDF goes as an attachment. */
export function monthlyEmail(
  recap: MonthlyRecap,
  advice: RecapAdvice,
  texts: RecapTexts,
  links: EmailLinks,
): RenderedEmail {
  const t = texts.monthly;
  const name = recap.child.name;
  const sentence = texts.verdict.sentence(name, recap.verdict, 'month');
  const tilesData: Tile[] = [
    ...statTiles(texts, recap),
    { label: texts.stats.xp, value: `+${texts.integer(recap.xp)}` },
  ];
  const off = t.offDays(recap.offDays, recap.vacationDays);
  const programme = recap.programme ? texts.programme(name, recap.programme) : null;
  const body = [
    h1(t.title(name)),
    verdictBox(texts, recap.verdict, sentence),
    tiles(tilesData.slice(0, 3)),
    tiles(tilesData.slice(3)),
    h2(t.regularity),
    monthGrid(texts, recap.days),
    legend(texts),
    recap.doneDates.length > 0 ? p(t.doneDates(recap.doneDates)) : '',
    p(recap.skippedDates.length > 0 ? t.skippedDates(recap.skippedDates) : t.noSkipped),
    off ? p(off, true) : '',
    ...(recap.domains.length > 0
      ? [
          h2(t.mastery),
          ...recap.domains.map((d) => bar(t.masteryLine(d.domain, d.start, d.end), d.start, d.end)),
          p(t.masteryNote, true),
        ]
      : []),
    h2(t.learned),
    recap.learned.length > 0
      ? list(recap.learned.map((skill) => skill.title))
      : p(t.learnedNone, true),
    h2(t.badges),
    recap.badges.length > 0 ? list(recap.badges.map(texts.badge)) : p(t.badgesNone, true),
    h2(t.rewards),
    recap.rewards.length > 0 ? list(recap.rewards) : p(t.rewardsNone, true),
    h2(t.blocking),
    recap.blocking.length > 0
      ? recap.blocking
          .map((point) => mistakeBlock(texts, point, t.errors(point.errors, point.answered)))
          .join('\n')
      : p(t.blockingNone, true),
    ...(programme ? [h2(t.programme), p(programme), p(texts.programmeNote, true)] : []),
    h2(t.advice(recap.from)),
    `<ol style="${FONT}margin:0 0 8px;padding-left:20px;">${advice.tips.map((tip) => `<li style="margin:4px 0;">${escape(tip)}</li>`).join('')}</ol>`,
    p(t.adviceSource[advice.source], true),
    p(t.pdf(recap.from), true),
    cta(texts, links),
  ].join('\n');
  const subject = t.subject(name, recap.from);
  const text = [
    `${t.title(name)} — ${t.month(recap.from)}`,
    '',
    `${texts.verdict.title[recap.verdict.level]}. ${sentence}`,
    '',
    ...tilesData.map(
      (tile) => `${tile.label} : ${tile.value}${tile.detail ? ` ${tile.detail}` : ''}`,
    ),
    '',
    t.regularity,
    recap.doneDates.length > 0 ? t.doneDates(recap.doneDates) : '',
    recap.skippedDates.length > 0 ? t.skippedDates(recap.skippedDates) : t.noSkipped,
    off ?? '',
    '',
    ...(recap.domains.length > 0
      ? [t.mastery, ...recap.domains.map((d) => `- ${t.masteryLine(d.domain, d.start, d.end)}`), '']
      : []),
    `${t.learned} : ${recap.learned.length > 0 ? recap.learned.map((skill) => skill.title).join(' ; ') : t.learnedNone}`,
    `${t.badges} : ${recap.badges.length > 0 ? recap.badges.map(texts.badge).join(', ') : t.badgesNone}`,
    `${t.rewards} : ${recap.rewards.length > 0 ? recap.rewards.join(', ') : t.rewardsNone}`,
    '',
    t.blocking,
    ...(recap.blocking.length > 0
      ? recap.blocking.map(
          (point) =>
            `- ${point.title} : ${t.errors(point.errors, point.answered)}${point.errorLabel ? ` (${point.errorLabel})` : ''}`,
        )
      : [t.blockingNone]),
    '',
    ...(programme ? [t.programme, programme, ''] : []),
    t.advice(recap.from),
    ...advice.tips.map((tip, index) => `${index + 1}. ${tip}`),
    '',
    links.app ? `${texts.cta} : ${links.app}` : texts.openApp,
    '',
    footerText(texts, 'monthly', links),
  ]
    .filter((line, index, lines) => line !== '' || lines[index - 1] !== '')
    .join('\n');
  return {
    subject,
    html: shell(
      subject,
      t.heading(recap.from),
      t.month(recap.from),
      sentence,
      body,
      footer(texts, 'monthly', links),
    ),
    text,
  };
}
