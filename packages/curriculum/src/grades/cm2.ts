import { defineGradeSkills } from '../types';

// Cycle 3 programme in force in CM2 since the 2026 school year. Draft: to be reviewed by a teacher.
export const cm2Skills = defineGradeSkills('CM2', '2026', [
  // Nombres et calcul
  {
    code: 'cm2.grands-nombres',
    domain: 'numbers',
    title: 'Lire, écrire et comparer les nombres jusqu’au milliard',
    prerequisites: ['cm1.comparer-grands-nombres'],
  },
  {
    code: 'cm2.decimaux-milliemes',
    domain: 'numbers',
    title: 'Utiliser les nombres décimaux jusqu’aux millièmes',
    prerequisites: ['cm1.comparer-decimaux'],
  },
  {
    code: 'cm2.addition-soustraction-decimaux',
    domain: 'numbers',
    title: 'Additionner et soustraire des nombres décimaux',
    prerequisites: ['cm1.nombres-decimaux', 'ce2.soustraction-posee'],
  },
  {
    code: 'cm2.multiplication-decimaux',
    domain: 'numbers',
    title: 'Multiplier un nombre décimal par un nombre entier',
    prerequisites: ['cm1.multiplication-posee', 'cm1.nombres-decimaux'],
  },
  {
    code: 'cm2.multiplier-diviser-10-100-1000',
    domain: 'numbers',
    automatism: true,
    title: 'Multiplier et diviser par 10, 100 et 1 000',
    prerequisites: ['cm1.nombres-decimaux'],
  },
  {
    code: 'cm2.division-decimale',
    domain: 'numbers',
    title: 'Diviser un nombre par un entier avec un quotient décimal',
    prerequisites: ['cm1.division-posee'],
  },
  {
    code: 'cm2.fractions-comparer',
    domain: 'numbers',
    title: 'Comparer des fractions entre elles et à l’unité',
    prerequisites: ['cm1.fractions-simples'],
  },
  {
    code: 'cm2.fractions-addition-meme-denominateur',
    domain: 'numbers',
    title: 'Ajouter et soustraire des fractions de même dénominateur',
    prerequisites: ['cm1.fractions-simples'],
  },
  {
    code: 'cm2.fractions-decimaux-equivalences',
    domain: 'numbers',
    title: 'Passer d’une fraction décimale à l’écriture décimale',
    prerequisites: ['cm1.fractions-decimales', 'cm1.nombres-decimaux'],
  },
  {
    code: 'cm2.multiples-diviseurs',
    domain: 'numbers',
    title: 'Utiliser multiples, diviseurs et critères de divisibilité',
    prerequisites: ['cm1.multiples', 'cm1.division-euclidienne'],
  },
  {
    code: 'cm2.calcul-mental',
    domain: 'numbers',
    automatism: true,
    title: 'Calculer mentalement avec des nombres décimaux',
    prerequisites: ['cm1.calcul-mental'],
  },
  {
    code: 'cm2.problemes',
    domain: 'numbers',
    title: 'Résoudre des problèmes à plusieurs étapes avec des décimaux',
    prerequisites: ['cm1.problemes'],
  },
  // Grandeurs et mesures
  {
    code: 'cm2.aire-rectangle',
    domain: 'measures',
    title: 'Calculer l’aire du carré et du rectangle',
    prerequisites: ['cm1.aire-comptage', 'ce2.tables-multiplication'],
  },
  {
    code: 'cm2.perimetre-aire',
    domain: 'measures',
    title: 'Distinguer périmètre et aire',
    prerequisites: ['cm2.aire-rectangle', 'cm1.perimetre'],
  },
  {
    code: 'cm2.conversions',
    domain: 'measures',
    title: 'Convertir des mesures exprimées avec des nombres décimaux',
    prerequisites: ['cm1.conversions', 'cm2.multiplier-diviser-10-100-1000'],
  },
  {
    code: 'cm2.volumes-comptage',
    domain: 'measures',
    title: 'Mesurer un volume en comptant des cubes unités',
    prerequisites: ['cm1.aire-comptage'],
  },
  {
    code: 'cm2.angles-comparer',
    domain: 'measures',
    title: 'Comparer des angles et reconnaître angle aigu, droit et obtus',
    prerequisites: ['cm1.perpendiculaires-paralleles'],
  },
  // Espace et géométrie
  {
    code: 'cm2.triangles-particuliers',
    domain: 'geometry',
    title: 'Reconnaître et construire des triangles particuliers',
    prerequisites: ['cm1.figures-usuelles'],
  },
  {
    code: 'cm2.quadrilateres-particuliers',
    domain: 'geometry',
    title: 'Reconnaître et construire des quadrilatères particuliers',
    prerequisites: ['cm1.figures-usuelles', 'cm1.perpendiculaires-paralleles'],
  },
  {
    code: 'cm2.programmes-construction',
    domain: 'geometry',
    title: 'Suivre et rédiger un programme de construction',
    prerequisites: ['cm1.cercle', 'cm1.perpendiculaires-paralleles'],
  },
  // Données, probabilités, algèbre
  {
    code: 'cm2.pourcentages',
    domain: 'data',
    title: 'Calculer des pourcentages simples (10 %, 25 %, 50 %…)',
    prerequisites: ['cm1.proportionnalite'],
  },
  {
    code: 'cm2.echelles',
    domain: 'data',
    title: 'Utiliser une échelle sur un plan ou une carte',
    prerequisites: ['cm1.proportionnalite'],
  },
  {
    code: 'cm2.proportionnalite',
    domain: 'data',
    title: 'Résoudre des problèmes de proportionnalité (passage à l’unité, coefficient)',
    prerequisites: ['cm1.proportionnalite'],
  },
  {
    code: 'cm2.probabilites',
    domain: 'data',
    title: 'Comparer des chances dans des expériences aléatoires simples',
    prerequisites: ['cm1.probabilites-vocabulaire', 'cm1.fractions-simples'],
  },
  {
    code: 'cm2.expressions-inconnue',
    domain: 'data',
    title: 'Trouver un nombre inconnu dans une égalité',
    prerequisites: ['cm1.suites-motifs', 'cm1.calcul-mental'],
  },
  {
    code: 'cm2.graphiques',
    domain: 'data',
    title: 'Lire et interpréter des graphiques',
    prerequisites: ['cm1.tableaux-diagrammes'],
  },
]);
