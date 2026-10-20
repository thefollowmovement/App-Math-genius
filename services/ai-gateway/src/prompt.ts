import type { CoachFrame } from '@math-genius/exercise-engine';
import type { GradeBand } from '@math-genius/shared';

/**
 * What the coach's model reads (docs/specs.md, Coach IA): the exercise with its numbers as slots,
 * the correction, the mistake, the age group and one universe of the child. Never the child's name
 * nor anything that identifies them. Prompts are versioned in the database (ai_prompts) and edited
 * from the back-office; this is the first version, as the migration loads it.
 */

export type PromptTemplate = { version: number; system: string; user: string };

/** The coach's tone for each age group (docs/specs.md, Centres d'intérêt des CE1 → 3e). */
export const TONES: Record<GradeBand, string> = {
  'cp-ce2': 'phrases très courtes, onomatopées, très chaleureux',
  'cm1-cm2': 'fun et un peu décalé, esprit défi, « niveau débloqué »',
  '6e-5e': 'complice, vocabulaire de jeu (« combo », « boss », « speedrun »), pas enfantin',
  '4e-3e': 'sobre et direct, humour léger, liens avec la vie réelle, jamais « gamin »',
};

/** Without a universe (none chosen, or personalization off): examples from everyday life. */
export const EVERYDAY =
  'exemples de la vie courante : argent de poche et soldes, recette de cuisine, score d’un match, batterie du téléphone, trajet en bus, partage d’une pizza ou d’un gâteau';

export const DEFAULT_PROMPT: PromptTemplate = {
  version: 1,
  system: [
    'Tu es le coach bienveillant d’une app de maths pour enfants. Tu expliques une erreur en tutoyant l’enfant, sans jugement, sans moquerie, sans comparaison avec d’autres enfants.',
    'Le code a déjà calculé la bonne réponse et la correction : tu ne calcules rien, tu reformules.',
    'Tu n’écris jamais de nombre, ni en chiffres ni en lettres : chaque nombre s’écrit avec son repère entre accolades, exactement comme donné ({n1}, {e2}, {reponse}, {solution}…).',
    'Tu peux évoquer l’univers de l’enfant (jeu, sport, musique, créateur) mais tu ne fais jamais parler une personne réelle et tu ne te fais pas passer pour elle. Tu cites un jeu par son nom seulement.',
    'Réponds uniquement en JSON : {"what": "ce qui s’est passé", "image": "l’image qui fait comprendre, tirée de l’univers", "tip": "l’astuce à retenir, une phrase courte"}. Moins de 60 mots en tout.',
  ].join('\n'),
  user: [
    'Classe : {{classe}}. Ton : {{ton}}.',
    'Compétence : {{competence}}.',
    'Exercice : {{exercice}}',
    'Correction : {{correction}}',
    'Réponse de l’enfant : {reponse}. Bonne réponse : {solution}.',
    'Erreur repérée : {{erreur}}.',
    'Valeurs des repères, pour comprendre (ne les écris jamais) : {{valeurs}}.',
    'Univers à utiliser : {{univers}}.',
  ].join('\n'),
};

export type Universe = {
  id: string;
  name: string;
  vocabulary: { words?: readonly string[]; images?: readonly string[] };
};

export type PromptContext = {
  frame: CoachFrame;
  grade: string;
  band: GradeBand;
  skillTitle: string;
  /** The typical mistake's label, or null: a mistake the engine cannot name. */
  errorLabel: string | null;
  universe: Universe | null;
};

const universeText = (universe: Universe | null) => {
  if (!universe) return EVERYDAY;
  const words = universe.vocabulary.words?.join(', ');
  const images = universe.vocabulary.images?.join(' ; ');
  return [universe.name, words && `mots : ${words}`, images && `images : ${images}`]
    .filter(Boolean)
    .join(' — ');
};

/** Fills `{{name}}` fields; the coach's own `{slot}` marks stay as they are. */
export function buildPrompt(template: PromptTemplate, context: PromptContext) {
  const { frame } = context;
  const fields: Record<string, string> = {
    classe: context.grade,
    ton: TONES[context.band],
    competence: context.skillTitle,
    exercice: frame.exercise,
    correction: frame.steps.join(' ') || '(aucune)',
    erreur: context.errorLabel ?? 'réponse fausse, sans erreur typique reconnue',
    valeurs: Object.entries(frame.slots)
      .map(([slot, value]) => `{${slot}} = ${value}`)
      .join(' ; '),
    univers: universeText(context.universe),
  };
  const fill = (text: string) =>
    text.replace(/\{\{(\w+)\}\}/g, (all, name: string) => fields[name] ?? all);
  return { system: fill(template.system), user: fill(template.user) };
}
