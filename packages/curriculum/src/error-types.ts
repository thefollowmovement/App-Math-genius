import type { SkillCode } from '.';

/**
 * Typical mistakes (docs/specs.md, Coach IA : diagnostic par le code). Each generator of the
 * exercise engine recognises some wrong answers as one of these, for the skills listed here.
 * Codes are stored with every diagnosed answer: never rename one. Labels describe the child in
 * the third person, for the parent and for the coach's summary (« oublie la retenue »); a
 * draft, to be reviewed by a teacher like the rest of the referential.
 */
type ErrorTypeDefinition = { code: string; label: string; skills: readonly SkillCode[] };

export const ERROR_TYPES = [
  {
    code: 'forgot-carry',
    label: 'oublie la retenue',
    skills: ['ce2.addition-posee', 'ce2.multiplication-posee'],
  },
  {
    code: 'reverse-order',
    label: 'range dans le mauvais sens',
    skills: ['ce2.comparer-ranger-nombres', 'cm1.comparer-decimaux'],
  },
  {
    code: 'digits-not-length',
    label: 'compare les chiffres sans regarder combien les nombres en ont',
    skills: ['ce2.comparer-ranger-nombres'],
  },
  { code: 'double-half', label: 'confond le double et la moitié', skills: ['ce2.doubles-moities'] },
  {
    code: 'one-part-only',
    label: 'colorie une seule part au lieu d’un morceau entier',
    skills: ['ce2.fractions-unitaires'],
  },
  {
    code: 'shades-denominator',
    label: 'colorie autant de parts que le dénominateur',
    skills: ['ce2.fractions-unitaires'],
  },
  {
    code: 'conversion-factor',
    label: 'se trompe de nombre de zéros dans les conversions',
    skills: ['ce2.longueurs-conversions'],
  },
  {
    code: 'conversion-direction',
    label: 'convertit dans le mauvais sens',
    skills: ['ce2.longueurs-conversions'],
  },
  {
    code: 'table-neighbour',
    label: 'confond des résultats voisins dans les tables',
    skills: ['ce2.tables-multiplication'],
  },
  {
    code: 'adds-instead-of-multiplying',
    label: 'additionne au lieu de multiplier',
    skills: ['ce2.tables-multiplication', 'cm2.aire-rectangle'],
  },
  {
    code: 'decimals-as-integers',
    label: 'compare les chiffres après la virgule comme des nombres entiers',
    skills: ['cm1.comparer-decimaux'],
  },
  {
    code: 'quotient-remainder',
    label: 'confond le quotient et le reste',
    skills: ['cm1.division-euclidienne'],
  },
  {
    code: 'off-by-one-graduation',
    label: 'se décale d’une graduation sur la droite graduée',
    skills: ['cm1.fractions-droite-graduee'],
  },
  {
    code: 'decimal-place-value',
    label: 'place mal les dixièmes et les centièmes',
    skills: ['cm1.nombres-decimaux'],
  },
  {
    code: 'area-perimeter',
    label: 'confond aire et périmètre',
    skills: ['cm1.perimetre', 'cm2.aire-rectangle'],
  },
  {
    code: 'half-perimeter',
    label: 'ne compte chaque côté qu’une fois dans le périmètre',
    skills: ['cm1.perimetre'],
  },
  {
    code: 'additive-reasoning',
    label: 'ajoute au lieu de multiplier dans les problèmes de proportionnalité',
    skills: ['cm1.proportionnalite', '6e.proportionnalite'],
  },
  {
    code: 'skips-unit-price',
    label: 'oublie de passer par le prix d’un seul objet',
    skills: ['cm1.proportionnalite'],
  },
  {
    code: 'misaligned-commas',
    label: 'n’aligne pas les virgules',
    skills: ['cm2.addition-soustraction-decimaux'],
  },
  {
    code: 'inverse-operation',
    label: 'n’utilise pas l’opération inverse pour trouver un nombre manquant',
    skills: ['cm2.expressions-inconnue'],
  },
  {
    code: 'adds-denominators',
    label: 'additionne aussi les dénominateurs',
    skills: ['cm2.fractions-addition-meme-denominateur', '5e.fractions-addition'],
  },
  {
    code: 'tenths-hundredths',
    label: 'confond dixièmes et centièmes',
    skills: ['cm2.fractions-decimaux-equivalences'],
  },
  {
    code: 'last-digit-rule',
    label: 'regarde le dernier chiffre pour savoir si un nombre est divisible par 3 ou 9',
    skills: ['cm2.multiples-diviseurs'],
  },
  {
    code: 'percent-subtract',
    label: 'enlève le nombre au lieu de prendre le pourcentage',
    skills: ['cm2.pourcentages'],
  },
  {
    code: 'percent-hundred',
    label: 'oublie de diviser par 100 dans un pourcentage',
    skills: ['cm2.pourcentages'],
  },
  {
    code: 'acute-obtuse',
    label: 'confond angle aigu et angle obtus',
    skills: ['6e.angles-degres'],
  },
  {
    code: 'divides-only',
    label: 'partage sans multiplier par le numérateur',
    skills: ['6e.fraction-d-une-quantite'],
  },
  {
    code: 'odd-is-prime',
    label: 'croit que les nombres impairs sont premiers',
    skills: ['6e.nombres-premiers'],
  },
  {
    code: 'left-to-right',
    label: 'calcule de gauche à droite sans les priorités',
    skills: ['6e.priorites-operatoires'],
  },
  {
    code: 'favourable-over-others',
    label: 'divise par les autres cas au lieu du total',
    skills: ['6e.probabilites'],
  },
  {
    code: 'same-denominator',
    label: 'additionne les numérateurs sans mettre au même dénominateur',
    skills: ['5e.fractions-addition'],
  },
  {
    code: 'zeros-count',
    label: 'se trompe dans le nombre de zéros',
    skills: ['5e.puissances-de-10'],
  },
  {
    code: 'exponent-times-ten',
    label: 'multiplie 10 par l’exposant',
    skills: ['5e.puissances-de-10'],
  },
  {
    code: 'subtract-negative',
    label: 'oublie que soustraire un nombre négatif revient à ajouter',
    skills: ['5e.relatifs-addition-soustraction'],
  },
  {
    code: 'sign-error',
    label: 'se trompe de signe',
    skills: ['5e.relatifs-addition-soustraction'],
  },
] as const satisfies readonly ErrorTypeDefinition[];

export type ErrorType = (typeof ERROR_TYPES)[number];
export type ErrorTypeCode = ErrorType['code'];

const BY_CODE: ReadonlyMap<string, ErrorType> = new Map(
  ERROR_TYPES.map((item) => [item.code, item]),
);

export const isErrorTypeCode = (code: string): code is ErrorTypeCode => BY_CODE.has(code);

export function getErrorType(code: ErrorTypeCode): ErrorType {
  const type = BY_CODE.get(code);
  if (!type) throw new Error(`Unknown error type ${code}`);
  return type;
}
