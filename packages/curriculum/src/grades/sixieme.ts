import { defineGradeSkills } from '../types';

// Cycle 3 programme in force in 6e since the 2025 school year. Draft: to be reviewed by a teacher.
export const sixiemeSkills = defineGradeSkills('6e', '2025', [
  // Nombres et calcul
  {
    code: '6e.fractions-quotient',
    domain: 'numbers',
    title: 'Comprendre une fraction comme un quotient',
    prerequisites: ['cm2.division-decimale', 'cm2.fractions-comparer'],
  },
  {
    code: '6e.fractions-egales',
    domain: 'numbers',
    title: 'Reconnaître des fractions égales et simplifier une fraction',
    prerequisites: ['6e.fractions-quotient', 'cm2.multiples-diviseurs'],
  },
  {
    code: '6e.fraction-d-une-quantite',
    domain: 'numbers',
    title: 'Calculer une fraction d’une quantité',
    prerequisites: ['cm1.fractions-simples', 'cm1.division-euclidienne'],
  },
  {
    code: '6e.fractions-droite',
    domain: 'numbers',
    title: 'Repérer des fractions sur une demi-droite graduée',
    prerequisites: ['cm1.fractions-droite-graduee'],
  },
  {
    code: '6e.division-decimaux',
    domain: 'numbers',
    title: 'Diviser un nombre décimal par un nombre entier',
    prerequisites: ['cm2.division-decimale'],
  },
  {
    code: '6e.multiplication-decimaux',
    domain: 'numbers',
    title: 'Multiplier deux nombres décimaux',
    prerequisites: ['cm2.multiplication-decimaux'],
  },
  {
    code: '6e.priorites-operatoires',
    domain: 'numbers',
    title: 'Appliquer les priorités opératoires et les parenthèses',
    prerequisites: ['cm2.calcul-mental'],
  },
  {
    code: '6e.nombres-premiers',
    domain: 'numbers',
    title: 'Reconnaître un nombre premier',
    prerequisites: ['cm2.multiples-diviseurs'],
  },
  {
    code: '6e.divisibilite',
    domain: 'numbers',
    title: 'Utiliser les critères de divisibilité par 2, 3, 4, 5, 9 et 10',
    prerequisites: ['cm2.multiples-diviseurs'],
  },
  {
    code: '6e.arrondis-ordres-grandeur',
    domain: 'numbers',
    title: 'Arrondir un nombre et estimer un ordre de grandeur',
    prerequisites: ['cm2.decimaux-milliemes'],
  },
  // Grandeurs et mesures
  {
    code: '6e.aires-figures',
    domain: 'measures',
    title: 'Calculer l’aire d’un triangle et de figures composées',
    prerequisites: ['cm2.aire-rectangle'],
  },
  {
    code: '6e.aire-disque',
    domain: 'measures',
    title: 'Calculer le périmètre et l’aire d’un disque',
    prerequisites: ['cm1.cercle', '6e.aires-figures', '6e.multiplication-decimaux'],
  },
  {
    code: '6e.volume-pave',
    domain: 'measures',
    title: 'Calculer le volume d’un pavé droit',
    prerequisites: ['cm2.volumes-comptage', 'cm1.multiplication-posee'],
  },
  {
    code: '6e.angles-degres',
    domain: 'measures',
    title: 'Mesurer, construire et nommer des angles en degrés',
    prerequisites: ['cm2.angles-comparer'],
  },
  {
    code: '6e.durees-conversions',
    domain: 'measures',
    title: 'Calculer et convertir des durées',
    prerequisites: ['cm1.durees'],
  },
  // Espace et géométrie
  {
    code: '6e.symetrie-axiale',
    domain: 'geometry',
    title: 'Utiliser les propriétés de la symétrie axiale',
    prerequisites: ['cm1.symetrie-axiale'],
  },
  {
    code: '6e.constructions',
    domain: 'geometry',
    title: 'Construire triangles, médiatrice et figures à la règle et au compas',
    prerequisites: ['cm2.programmes-construction'],
  },
  {
    code: '6e.solides-patrons',
    domain: 'geometry',
    title: 'Reconnaître des solides et construire des patrons',
    prerequisites: ['ce2.cube-pave', 'cm2.volumes-comptage'],
  },
  {
    code: '6e.droites-segments',
    domain: 'geometry',
    title: 'Utiliser le vocabulaire droite, segment, demi-droite et appartenance',
    prerequisites: ['cm1.perpendiculaires-paralleles'],
  },
  // Données, probabilités, algèbre
  {
    code: '6e.proportionnalite',
    domain: 'data',
    title: 'Reconnaître la proportionnalité et calculer une quatrième proportionnelle',
    prerequisites: ['cm2.proportionnalite'],
  },
  {
    code: '6e.pourcentages',
    domain: 'data',
    title: 'Appliquer un pourcentage',
    prerequisites: ['cm2.pourcentages', '6e.proportionnalite'],
  },
  {
    code: '6e.probabilites',
    domain: 'data',
    title: 'Calculer une probabilité dans une situation simple',
    prerequisites: ['cm2.probabilites', '6e.fractions-quotient'],
  },
  {
    code: '6e.expressions-litterales',
    domain: 'data',
    title: 'Calculer une expression littérale pour une valeur donnée',
    prerequisites: ['cm2.expressions-inconnue', '6e.priorites-operatoires'],
  },
  {
    code: '6e.graphiques',
    domain: 'data',
    title: 'Lire et construire des tableaux et des graphiques',
    prerequisites: ['cm2.graphiques'],
  },
]);
