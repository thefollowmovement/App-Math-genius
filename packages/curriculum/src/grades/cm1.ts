import { defineGradeSkills } from '../types';

// Cycle 3 programme in force in CM1 since the 2025 school year. Draft: to be reviewed by a teacher.
export const cm1Skills = defineGradeSkills('CM1', '2025', [
  // Nombres et calcul
  {
    code: 'cm1.grands-nombres',
    domain: 'numbers',
    title: 'Lire, écrire et décomposer les nombres jusqu’au million',
    prerequisites: ['ce2.nombres-jusqua-10000'],
  },
  {
    code: 'cm1.comparer-grands-nombres',
    domain: 'numbers',
    title: 'Comparer, encadrer et ranger les grands nombres',
    prerequisites: ['cm1.grands-nombres', 'ce2.comparer-ranger-nombres'],
  },
  {
    code: 'cm1.fractions-simples',
    domain: 'numbers',
    title: 'Lire, écrire et représenter des fractions simples',
    prerequisites: ['ce2.fractions-unitaires'],
  },
  {
    code: 'cm1.fractions-droite-graduee',
    domain: 'numbers',
    title: 'Placer des fractions sur une droite graduée',
    prerequisites: ['cm1.fractions-simples', 'ce2.droite-graduee-entiers'],
  },
  {
    code: 'cm1.fractions-decimales',
    domain: 'numbers',
    title: 'Utiliser les fractions décimales (dixièmes, centièmes)',
    prerequisites: ['cm1.fractions-simples'],
  },
  {
    code: 'cm1.nombres-decimaux',
    domain: 'numbers',
    title: 'Lire, écrire et décomposer des nombres décimaux',
    prerequisites: ['cm1.fractions-decimales'],
  },
  {
    code: 'cm1.comparer-decimaux',
    domain: 'numbers',
    title: 'Comparer et ranger des nombres décimaux',
    prerequisites: ['cm1.nombres-decimaux'],
  },
  {
    code: 'cm1.calcul-mental',
    domain: 'numbers',
    title: 'Calculer mentalement avec des stratégies et des faits numériques',
    prerequisites: ['ce2.calcul-mental-additif', 'ce2.tables-multiplication'],
  },
  {
    code: 'cm1.multiplication-posee',
    domain: 'numbers',
    title: 'Poser une multiplication de deux nombres entiers',
    prerequisites: ['ce2.multiplication-posee'],
  },
  {
    code: 'cm1.division-euclidienne',
    domain: 'numbers',
    title: 'Trouver le quotient et le reste d’une division euclidienne',
    prerequisites: ['ce2.division-partage', 'ce2.tables-multiplication'],
  },
  {
    code: 'cm1.division-posee',
    domain: 'numbers',
    title: 'Poser une division par un nombre à un chiffre',
    prerequisites: ['cm1.division-euclidienne'],
  },
  {
    code: 'cm1.multiples',
    domain: 'numbers',
    title: 'Reconnaître les multiples de 2, 5 et 10',
    prerequisites: ['ce2.tables-multiplication'],
  },
  {
    code: 'cm1.problemes',
    domain: 'numbers',
    title: 'Résoudre des problèmes à plusieurs étapes',
    prerequisites: ['ce2.problemes-deux-etapes'],
  },
  // Grandeurs et mesures
  {
    code: 'cm1.perimetre',
    domain: 'measures',
    title: 'Calculer le périmètre d’un polygone',
    prerequisites: ['ce2.polygones', 'ce2.addition-posee'],
  },
  {
    code: 'cm1.aire-comptage',
    domain: 'measures',
    title: 'Mesurer une aire en comptant des unités',
    prerequisites: ['ce2.quadrillage'],
  },
  {
    code: 'cm1.conversions',
    domain: 'measures',
    title: 'Convertir des longueurs, des masses et des contenances',
    prerequisites: ['ce2.longueurs-conversions', 'ce2.masses', 'ce2.contenances'],
  },
  {
    code: 'cm1.durees',
    domain: 'measures',
    title: 'Calculer des durées (heures, minutes, secondes)',
    prerequisites: ['ce2.heures-durees'],
  },
  // Espace et géométrie
  {
    code: 'cm1.cercle',
    domain: 'geometry',
    title: 'Tracer un cercle et utiliser centre, rayon et diamètre',
    prerequisites: [],
  },
  {
    code: 'cm1.perpendiculaires-paralleles',
    domain: 'geometry',
    title: 'Reconnaître et tracer des droites perpendiculaires et parallèles',
    prerequisites: ['ce2.angle-droit'],
  },
  {
    code: 'cm1.symetrie-axiale',
    domain: 'geometry',
    title: 'Construire le symétrique d’une figure par rapport à un axe',
    prerequisites: ['ce2.symetrie-axiale'],
  },
  {
    code: 'cm1.figures-usuelles',
    domain: 'geometry',
    title: 'Décrire et construire des figures usuelles',
    prerequisites: ['ce2.polygones'],
  },
  // Données, probabilités, algèbre
  {
    code: 'cm1.proportionnalite',
    domain: 'data',
    title: 'Résoudre des situations simples de proportionnalité',
    prerequisites: ['ce2.tables-multiplication', 'ce2.problemes-deux-etapes'],
  },
  {
    code: 'cm1.probabilites-vocabulaire',
    domain: 'data',
    title: 'Utiliser le vocabulaire des probabilités (certain, possible, impossible)',
    prerequisites: [],
  },
  {
    code: 'cm1.suites-motifs',
    domain: 'data',
    title: 'Prolonger des suites et des motifs (pensée algébrique)',
    prerequisites: ['ce2.calcul-mental-additif'],
  },
  {
    code: 'cm1.tableaux-diagrammes',
    domain: 'data',
    title: 'Lire et produire des tableaux et des diagrammes',
    prerequisites: ['ce2.tableaux-graphiques'],
  },
]);
