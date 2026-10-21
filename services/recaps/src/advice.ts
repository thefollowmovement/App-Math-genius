import type { MonthlyRecap } from '@math-genius/shared';

import { isoWeekday } from './format';
import type { RecapTexts } from './texts';

/**
 * The month's three tips (docs/specs.md, Récap mensuel): the coach writes them from the facts
 * below and the learning profile (services/ai-gateway, advice.ts); the standard ones, written from
 * the same facts, stand in when the AI is off, over budget, failing, or the parent did not agree
 * to the personalization.
 */

/** The weekday skipped most often (at least twice), or null. */
export function mostSkippedWeekday(recap: MonthlyRecap): number | null {
  const counts = new Map<number, number>();
  for (const { date } of recap.skippedDates) {
    const weekday = isoWeekday(date);
    counts.set(weekday, (counts.get(weekday) ?? 0) + 1);
  }
  let best: [number, number] | null = null;
  for (const entry of counts) if (!best || entry[1] > best[1]) best = entry;
  return best && best[1] >= 2 ? best[0] : null;
}

const regularityTip = (recap: MonthlyRecap, texts: RecapTexts) => {
  const weekday = mostSkippedWeekday(recap);
  if (recap.skippedDates.length >= 3 && weekday) return texts.advice.regularWeekday(weekday);
  if (recap.planned > 0 && recap.done >= 0.8 * recap.planned) return texts.advice.keepRhythm;
  if (recap.planned === 0 && recap.active >= 8) return texts.advice.keepRhythm;
  return texts.advice.setRhythm;
};

const mistakeTip = (recap: MonthlyRecap, texts: RecapTexts) => {
  const [point] = recap.blocking;
  if (point?.errorLabel) return texts.advice.mistake(point.title, point.errorLabel);
  if (point) return texts.advice.hardest(point.title);
  const learnt = recap.learned.at(-1);
  return learnt ? texts.advice.explain(learnt.title) : texts.advice.showMethod;
};

const strengthenTip = (recap: MonthlyRecap, texts: RecapTexts) => {
  const programme = recap.programme;
  if (programme?.position === 'behind' && programme.gapTitles[0]) {
    return texts.advice.gaps(programme.gapTitles[0]);
  }
  const weakest = [...recap.domains]
    .filter((domain) => domain.total > 0)
    .sort((a, b) => a.end - b.end)[0];
  return weakest ? texts.advice.everyday(weakest.domain) : texts.advice.celebrate;
};

export function standardAdvice(recap: MonthlyRecap, texts: RecapTexts): string[] {
  return [regularityTip(recap, texts), mistakeTip(recap, texts), strengthenTip(recap, texts)];
}

/** The month as the code sums it up, for the coach: numbers included, no name. */
export function adviceFacts(recap: MonthlyRecap, texts: RecapTexts): string[] {
  const { facts } = texts;
  return [
    facts.regularity(recap.done, recap.planned, mostSkippedWeekday(recap)),
    facts.success(recap.verdict.success, recap.minutes),
    facts.streak(recap.streak),
    facts.learned(recap.learned.map((skill) => skill.title)),
    ...recap.blocking.map((point) => facts.blocking(point.title, point.errors, point.errorLabel)),
    ...recap.domains.map((domain) => facts.domain(domain.domain, domain.start, domain.end)),
    ...(recap.programme?.position ? [facts.programme(recap.programme)] : []),
  ];
}
