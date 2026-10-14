import { defineGradeSkills } from '../types';

// Cycle 2 programme in force since the 2025 school year. Draft: to be reviewed by a teacher.
export const ce2Skills = defineGradeSkills('CE2', '2025', [
  // Nombres et calcul
  {
    code: 'ce2.nombres-jusqua-10000',
    domain: 'numbers',
    title: 'Lire, écrire et décomposer les nombres jusqu’à 10 000',
    prerequisites: [],
  },
  {
    code: 'ce2.comparer-ranger-nombres',
    domain: 'numbers',
    title: 'Comparer, encadrer et ranger des nombres jusqu’à 10 000',
    prerequisites: ['ce2.nombres-jusqua-10000'],
  },
  {
    code: 'ce2.droite-graduee-entiers',
    domain: 'numbers',
    title: 'Repérer des nombres entiers sur une droite graduée',
    prerequisites: ['ce2.nombres-jusqua-10000'],
  },
  {
    code: 'ce2.complements',
    domain: 'numbers',
    title: 'Trouver les compléments à la dizaine, à la centaine et à 1 000',
    prerequisites: [],
  },
  {
    code: 'ce2.calcul-mental-additif',
    domain: 'numbers',
    title: 'Additionner et soustraire mentalement',
    prerequisites: ['ce2.complements'],
  },
  {
    code: 'ce2.addition-posee',
    domain: 'numbers',
    title: 'Poser et calculer une addition',
    prerequisites: ['ce2.nombres-jusqua-10000'],
  },
  {
    code: 'ce2.soustraction-posee',
    domain: 'numbers',
    title: 'Poser et calculer une soustraction',
    prerequisites: ['ce2.addition-posee'],
  },
  {
    code: 'ce2.doubles-moities',
    domain: 'numbers',
    title: 'Connaître les doubles et les moitiés des nombres usuels',
    prerequisites: ['ce2.calcul-mental-additif'],
  },
  {
    code: 'ce2.tables-multiplication',
    domain: 'numbers',
    title: 'Connaître les tables de multiplication de 2 à 10',
    prerequisites: ['ce2.doubles-moities'],
  },
  {
    code: 'ce2.multiplier-par-10-100',
    domain: 'numbers',
    title: 'Multiplier un nombre entier par 10 ou par 100',
    prerequisites: ['ce2.nombres-jusqua-10000'],
  },
  {
    code: 'ce2.multiplication-posee',
    domain: 'numbers',
    title: 'Poser une multiplication par un nombre à un chiffre',
    prerequisites: ['ce2.tables-multiplication', 'ce2.addition-posee'],
  },
  {
    code: 'ce2.division-partage',
    domain: 'numbers',
    title: 'Comprendre la division comme un partage ou un groupement',
    prerequisites: ['ce2.tables-multiplication'],
  },
  {
    code: 'ce2.fractions-unitaires',
    domain: 'numbers',
    title: 'Comprendre les fractions unitaires (un demi, un tiers, un quart…)',
    prerequisites: ['ce2.division-partage'],
  },
  {
    code: 'ce2.problemes-deux-etapes',
    domain: 'numbers',
    title: 'Résoudre des problèmes en deux étapes',
    prerequisites: ['ce2.addition-posee', 'ce2.soustraction-posee'],
  },
  // Grandeurs et mesures
  {
    code: 'ce2.longueurs-conversions',
    domain: 'measures',
    title: 'Mesurer et convertir des longueurs (km, m, cm, mm)',
    prerequisites: ['ce2.multiplier-par-10-100'],
  },
  {
    code: 'ce2.masses',
    domain: 'measures',
    title: 'Comparer et convertir des masses (g, kg)',
    prerequisites: ['ce2.multiplier-par-10-100'],
  },
  {
    code: 'ce2.contenances',
    domain: 'measures',
    title: 'Comparer et convertir des contenances (L, cL)',
    prerequisites: ['ce2.multiplier-par-10-100'],
  },
  {
    code: 'ce2.heures-durees',
    domain: 'measures',
    title: 'Lire l’heure et calculer des durées simples',
    prerequisites: [],
  },
  {
    code: 'ce2.monnaie',
    domain: 'measures',
    title: 'Calculer avec la monnaie (euros et centimes)',
    prerequisites: ['ce2.addition-posee'],
  },
  // Espace et géométrie
  {
    code: 'ce2.polygones',
    domain: 'geometry',
    title: 'Reconnaître et nommer des polygones (triangle, carré, rectangle, losange)',
    prerequisites: [],
  },
  {
    code: 'ce2.angle-droit',
    domain: 'geometry',
    title: 'Repérer et tracer des angles droits avec l’équerre',
    prerequisites: [],
  },
  {
    code: 'ce2.cube-pave',
    domain: 'geometry',
    title: 'Décrire le cube et le pavé droit (faces, arêtes, sommets)',
    prerequisites: ['ce2.polygones'],
  },
  {
    code: 'ce2.quadrillage',
    domain: 'geometry',
    title: 'Reproduire une figure sur quadrillage',
    prerequisites: [],
  },
  {
    code: 'ce2.symetrie-axiale',
    domain: 'geometry',
    title: 'Compléter une figure par symétrie axiale',
    prerequisites: ['ce2.quadrillage'],
  },
  // Données
  {
    code: 'ce2.tableaux-graphiques',
    domain: 'data',
    title: 'Lire et compléter des tableaux et des graphiques simples',
    prerequisites: ['ce2.nombres-jusqua-10000'],
  },
]);
