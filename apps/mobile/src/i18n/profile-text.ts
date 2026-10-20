import { getErrorType, getSkill, type Strand } from '@math-genius/curriculum';
import type {
  LearnerProfile,
  LearningStyle,
  Strength,
  Weakness,
} from '@math-genius/exercise-engine';

import { strings } from './index';

/** The learning profile in the parent's words (child detail page): strengths come first. */

const t = strings.childDetail.profile;

const strand = (area: Strand) => strings.placement.strands[area].toLocaleLowerCase('fr');
const lowerFirst = (text: string) => text.charAt(0).toLocaleLowerCase('fr') + text.slice(1);
const upperFirst = (text: string) => text.charAt(0).toLocaleUpperCase('fr') + text.slice(1);
const seconds = (ms: number) => (Math.round(ms / 100) / 10).toLocaleString('fr-FR');

export function strengthText(item: Strength): string {
  switch (item.kind) {
    case 'ahead':
      return t.strength.ahead(strand(item.strand));
    case 'solid':
      return t.strength.solid(strand(item.strand), item.mastered);
    case 'best':
      return t.strength.best(strand(item.strand));
    case 'mental_speed':
      return t.strength.mentalSpeed(seconds(item.medianMs), Math.round(item.rate * 100));
    case 'flawless':
      return t.strength.flawless(item.run);
  }
}

export function weaknessText(item: Weakness): string {
  switch (item.kind) {
    case 'error':
      return t.weakness.error(upperFirst(getErrorType(item.error).label), item.count);
    case 'behind':
      return t.weakness.behind(strand(item.strand));
    case 'fading':
      return t.weakness.fading(lowerFirst(getSkill(item.skill).title));
    case 'stuck':
      return t.weakness.stuck(lowerFirst(getSkill(item.skill).title));
  }
}

export function styleTexts(style: LearningStyle): string[] {
  const lines: string[] = [];
  if (style.attention?.kind === 'steady') lines.push(t.styleLine.steady(style.attention.minutes));
  if (style.attention?.kind === 'drops') lines.push(t.styleLine.drops(style.attention.after));
  if (style.bestTime) lines.push(t.styleLine.bestTime[style.bestTime]);
  if (style.afterError) lines.push(t.styleLine.afterError[style.afterError]);
  if (style.twinSuccess !== null)
    lines.push(t.styleLine.twins(Math.round(style.twinSuccess * 100)));
  return lines;
}

/** The three parts of the profile, as lists of sentences. */
export function profileTexts(profile: LearnerProfile) {
  return {
    strengths: profile.strengths.map(strengthText),
    weaknesses: profile.weaknesses.map(weaknessText),
    style: styleTexts(profile.style),
  };
}
