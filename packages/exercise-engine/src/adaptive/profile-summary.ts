import { type Strand, getErrorType, getSkill } from '@math-genius/curriculum';

import type { LearnerProfile, LearningStyle, Strength, TimeOfDay, Weakness } from './profile';

/**
 * The profile's compact summary (docs/specs.md, about 150 words): what the coach's AI receives,
 * never the answers themselves. In French, like the exercises, and with nothing that identifies
 * the child: no name, no date of birth, only the grade, the profile and the universes chosen.
 * Words that agree with the child's gender are avoided (« garde sa concentration »).
 */

const STRANDS: Record<Strand, string> = {
  numeration: 'numération',
  calcul: 'calcul',
  fractions: 'fractions',
  mesures: 'mesures',
  geometrie: 'géométrie',
  problemes: 'problèmes',
};

const TIMES: Record<TimeOfDay, string> = {
  morning: 'le matin',
  afternoon: 'l’après-midi',
  evening: 'en fin de journée',
};

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);
const seconds = (ms: number) => `${(Math.round(ms / 100) / 10).toString().replace('.', ',')} s`;
const percent = (rate: number) => `${Math.round(rate * 100)} %`;

function strength(item: Strength): string {
  switch (item.kind) {
    case 'ahead':
      return `en avance en ${STRANDS[item.strand]}`;
    case 'solid':
      return `à l’aise en ${STRANDS[item.strand]} (${item.mastered} compétences de l’année maîtrisées)`;
    case 'best':
      return `meilleur domaine en ce moment : ${STRANDS[item.strand]}`;
    case 'mental_speed':
      return `calcul mental rapide (${seconds(item.medianMs)} par calcul, ${percent(item.rate)} de réussite)`;
    case 'flawless':
      return `jusqu’à ${item.run} bonnes réponses d’affilée`;
  }
}

function weakness(item: Weakness): string {
  switch (item.kind) {
    case 'error':
      return `${getErrorType(item.error).label} (${item.count} fois)`;
    case 'behind':
      return `à consolider en ${STRANDS[item.strand]}`;
    case 'fading':
      return `à revoir : ${lowerFirst(getSkill(item.skill).title)}`;
    case 'stuck':
      return `bloque sur : ${lowerFirst(getSkill(item.skill).title)}`;
  }
}

function style(learning: LearningStyle): string[] {
  const parts: string[] = [];
  const { attention, bestTime, afterError, twinSuccess } = learning;
  if (attention?.kind === 'steady') {
    parts.push(`garde sa concentration toute la séance (${attention.minutes} min)`);
  }
  if (attention?.kind === 'drops') {
    parts.push(`perd sa concentration après ${attention.after} minutes environ`);
  }
  if (bestTime) parts.push(`plus efficace ${TIMES[bestTime]}`);
  if (afterError === 'perseveres') parts.push('persévère après une erreur');
  if (afterError === 'gives_up') parts.push('abandonne parfois la séance après une erreur');
  if (afterError === 'guesses') parts.push('répond vite au hasard après une erreur');
  if (twinSuccess !== null) {
    parts.push(`réussit ${percent(twinSuccess)} des exercices jumeaux après une correction`);
  }
  return parts;
}

/** `interests`: names of the universes the child chose, when the parent allows them. */
export function profileSummary(profile: LearnerProfile, interests: readonly string[] = []): string {
  const strengths = profile.strengths.map(strength);
  const weaknesses = profile.weaknesses.slice(0, 5).map(weakness);
  const learning = style(profile.style);
  return [
    `Élève de ${profile.grade}, ${profile.mastered} compétences maîtrisées, ${profile.inProgress} en cours.`,
    `Points forts : ${strengths.length ? strengths.join(' ; ') : 'encore à découvrir'}.`,
    `À travailler : ${weaknesses.length ? weaknesses.join(' ; ') : 'rien de particulier pour l’instant'}.`,
    `Façon d’apprendre : ${learning.length ? learning.join(' ; ') : 'encore à observer'}.`,
    interests.length
      ? `Centres d’intérêt : ${interests.slice(0, 6).join(', ')}.`
      : 'Centres d’intérêt : non renseignés, prendre des exemples de la vie courante.',
  ].join('\n');
}
