import { defineGradeSkills } from '../types';

// Cycle 4 programme (BO of 5 March 2026) in force in 5e since the 2026 school year. Draft: to be reviewed by a teacher.
export const cinquiemeSkills = defineGradeSkills('5e', '2026', [
  // Nombres et calcul
  {
    code: '5e.relatifs-reperage',
    domain: 'numbers',
    title: 'Repérer et comparer des nombres relatifs',
    prerequisites: ['6e.fractions-droite'],
  },
  {
    code: '5e.relatifs-addition-soustraction',
    domain: 'numbers',
    automatism: true,
    title: 'Additionner et soustraire des nombres relatifs',
    prerequisites: ['5e.relatifs-reperage'],
  },
  {
    code: '5e.fractions-comparer',
    domain: 'numbers',
    title: 'Comparer des fractions',
    prerequisites: ['6e.fractions-egales'],
  },
  {
    code: '5e.fractions-addition',
    domain: 'numbers',
    title: 'Additionner et soustraire des fractions',
    prerequisites: ['6e.fractions-egales'],
  },
  {
    code: '5e.fractions-multiplication',
    domain: 'numbers',
    title: 'Multiplier des fractions',
    prerequisites: ['6e.fraction-d-une-quantite', '6e.fractions-egales'],
  },
  {
    code: '5e.puissances-de-10',
    domain: 'numbers',
    title: 'Calculer avec les puissances de 10',
    prerequisites: ['6e.multiplication-decimaux'],
  },
  {
    code: '5e.enchainer-calculs',
    domain: 'numbers',
    title: 'Enchaîner des calculs avec des relatifs en respectant les priorités',
    prerequisites: ['6e.priorites-operatoires', '5e.relatifs-addition-soustraction'],
  },
  {
    code: '5e.facteurs-premiers',
    domain: 'numbers',
    title: 'Décomposer un nombre en produit de facteurs premiers',
    prerequisites: ['6e.nombres-premiers'],
  },
  // Grandeurs et mesures
  {
    code: '5e.volumes-prisme-cylindre',
    domain: 'measures',
    title: 'Calculer le volume d’un prisme droit et d’un cylindre',
    prerequisites: ['6e.volume-pave', '6e.aire-disque'],
  },
  {
    code: '5e.vitesses',
    domain: 'measures',
    title: 'Calculer une vitesse moyenne, une distance ou une durée',
    prerequisites: ['6e.proportionnalite', '6e.durees-conversions'],
  },
  {
    code: '5e.conversions-aires-volumes',
    domain: 'measures',
    title: 'Convertir des aires et des volumes',
    prerequisites: ['6e.aires-figures', '6e.volume-pave'],
  },
  {
    code: '5e.angles-triangle',
    domain: 'measures',
    title: 'Utiliser la somme des angles d’un triangle',
    prerequisites: ['6e.angles-degres'],
  },
  // Espace et géométrie
  {
    code: '5e.symetrie-centrale',
    domain: 'geometry',
    title: 'Construire et utiliser la symétrie centrale',
    prerequisites: ['6e.symetrie-axiale'],
  },
  {
    code: '5e.triangles-construction',
    domain: 'geometry',
    title: 'Construire un triangle et utiliser l’inégalité triangulaire',
    prerequisites: ['6e.constructions'],
  },
  {
    code: '5e.parallelogrammes',
    domain: 'geometry',
    title: 'Reconnaître et utiliser les propriétés du parallélogramme',
    prerequisites: ['5e.symetrie-centrale', 'cm2.quadrilateres-particuliers'],
  },
  {
    code: '5e.angles-paralleles',
    domain: 'geometry',
    title: 'Utiliser les angles alternes-internes et correspondants',
    prerequisites: ['6e.angles-degres', 'cm1.perpendiculaires-paralleles'],
  },
  {
    code: '5e.reperage-plan',
    domain: 'geometry',
    title: 'Se repérer dans le plan avec des coordonnées',
    prerequisites: ['5e.relatifs-reperage'],
  },
  // Données, probabilités, algèbre
  {
    code: '5e.calcul-litteral-simplifier',
    domain: 'data',
    title: 'Simplifier une expression littérale',
    prerequisites: ['6e.expressions-litterales'],
  },
  {
    code: '5e.tester-egalite',
    domain: 'data',
    title: 'Tester une égalité pour une valeur donnée',
    prerequisites: ['6e.expressions-litterales', '5e.relatifs-addition-soustraction'],
  },
  {
    code: '5e.distributivite',
    domain: 'data',
    title: 'Développer avec la distributivité simple',
    prerequisites: ['5e.calcul-litteral-simplifier'],
  },
  {
    code: '5e.ratios',
    domain: 'data',
    title: 'Utiliser des ratios et partager une quantité',
    prerequisites: ['6e.proportionnalite'],
  },
  {
    code: '5e.proportionnalite-pourcentages',
    domain: 'data',
    title: 'Résoudre des problèmes de proportionnalité et de pourcentages',
    prerequisites: ['6e.pourcentages'],
  },
  {
    code: '5e.probabilites',
    domain: 'data',
    title: 'Calculer des probabilités dans des expériences aléatoires',
    prerequisites: ['6e.probabilites'],
  },
  {
    code: '5e.moyenne',
    domain: 'data',
    title: 'Calculer et interpréter une moyenne',
    prerequisites: ['6e.graphiques'],
  },
  {
    code: '5e.representations-donnees',
    domain: 'data',
    title: 'Lire et choisir une représentation de données',
    prerequisites: ['6e.graphiques'],
  },
]);
