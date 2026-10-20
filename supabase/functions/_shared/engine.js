// Generated from packages/exercise-engine/src/server.ts by `pnpm functions:bundle`. Do not edit.

// ../curriculum/src/types.ts
var STRANDS = [
  "numeration",
  "calcul",
  "fractions",
  "mesures",
  "geometrie",
  "problemes"
];
function defineGradeSkills(grade2, programVersion, skills2) {
  return skills2.map((skill) => ({ ...skill, subject: "math", grade: grade2, programVersion }));
}

// ../curriculum/src/grades/cinquieme.ts
var cinquiemeSkills = defineGradeSkills("5e", "2026", [
  // Nombres et calcul
  {
    code: "5e.relatifs-reperage",
    domain: "numbers",
    strand: "numeration",
    title: "Rep\xE9rer et comparer des nombres relatifs",
    prerequisites: ["6e.fractions-droite"]
  },
  {
    code: "5e.relatifs-addition-soustraction",
    domain: "numbers",
    strand: "calcul",
    automatism: true,
    title: "Additionner et soustraire des nombres relatifs",
    prerequisites: ["5e.relatifs-reperage"]
  },
  {
    code: "5e.fractions-comparer",
    domain: "numbers",
    strand: "fractions",
    title: "Comparer des fractions",
    prerequisites: ["6e.fractions-egales"]
  },
  {
    code: "5e.fractions-addition",
    domain: "numbers",
    strand: "fractions",
    title: "Additionner et soustraire des fractions",
    prerequisites: ["6e.fractions-egales"]
  },
  {
    code: "5e.fractions-multiplication",
    domain: "numbers",
    strand: "fractions",
    title: "Multiplier des fractions",
    prerequisites: ["6e.fraction-d-une-quantite", "6e.fractions-egales"]
  },
  {
    code: "5e.puissances-de-10",
    domain: "numbers",
    strand: "numeration",
    title: "Calculer avec les puissances de 10",
    prerequisites: ["6e.multiplication-decimaux"]
  },
  {
    code: "5e.enchainer-calculs",
    domain: "numbers",
    strand: "calcul",
    title: "Encha\xEEner des calculs avec des relatifs en respectant les priorit\xE9s",
    prerequisites: ["6e.priorites-operatoires", "5e.relatifs-addition-soustraction"]
  },
  {
    code: "5e.facteurs-premiers",
    domain: "numbers",
    strand: "calcul",
    title: "D\xE9composer un nombre en produit de facteurs premiers",
    prerequisites: ["6e.nombres-premiers"]
  },
  // Grandeurs et mesures
  {
    code: "5e.volumes-prisme-cylindre",
    domain: "measures",
    strand: "mesures",
    title: "Calculer le volume d\u2019un prisme droit et d\u2019un cylindre",
    prerequisites: ["6e.volume-pave", "6e.aire-disque"]
  },
  {
    code: "5e.vitesses",
    domain: "measures",
    strand: "mesures",
    title: "Calculer une vitesse moyenne, une distance ou une dur\xE9e",
    prerequisites: ["6e.proportionnalite", "6e.durees-conversions"]
  },
  {
    code: "5e.conversions-aires-volumes",
    domain: "measures",
    strand: "mesures",
    title: "Convertir des aires et des volumes",
    prerequisites: ["6e.aires-figures", "6e.volume-pave"]
  },
  {
    code: "5e.angles-triangle",
    domain: "measures",
    strand: "mesures",
    title: "Utiliser la somme des angles d\u2019un triangle",
    prerequisites: ["6e.angles-degres"]
  },
  // Espace et géométrie
  {
    code: "5e.symetrie-centrale",
    domain: "geometry",
    strand: "geometrie",
    title: "Construire et utiliser la sym\xE9trie centrale",
    prerequisites: ["6e.symetrie-axiale"]
  },
  {
    code: "5e.triangles-construction",
    domain: "geometry",
    strand: "geometrie",
    title: "Construire un triangle et utiliser l\u2019in\xE9galit\xE9 triangulaire",
    prerequisites: ["6e.constructions"]
  },
  {
    code: "5e.parallelogrammes",
    domain: "geometry",
    strand: "geometrie",
    title: "Reconna\xEEtre et utiliser les propri\xE9t\xE9s du parall\xE9logramme",
    prerequisites: ["5e.symetrie-centrale", "cm2.quadrilateres-particuliers"]
  },
  {
    code: "5e.angles-paralleles",
    domain: "geometry",
    strand: "geometrie",
    title: "Utiliser les angles alternes-internes et correspondants",
    prerequisites: ["6e.angles-degres", "cm1.perpendiculaires-paralleles"]
  },
  {
    code: "5e.reperage-plan",
    domain: "geometry",
    strand: "geometrie",
    title: "Se rep\xE9rer dans le plan avec des coordonn\xE9es",
    prerequisites: ["5e.relatifs-reperage"]
  },
  // Données, probabilités, algèbre
  {
    code: "5e.calcul-litteral-simplifier",
    domain: "data",
    strand: "calcul",
    title: "Simplifier une expression litt\xE9rale",
    prerequisites: ["6e.expressions-litterales"]
  },
  {
    code: "5e.tester-egalite",
    domain: "data",
    strand: "calcul",
    title: "Tester une \xE9galit\xE9 pour une valeur donn\xE9e",
    prerequisites: ["6e.expressions-litterales", "5e.relatifs-addition-soustraction"]
  },
  {
    code: "5e.distributivite",
    domain: "data",
    strand: "calcul",
    title: "D\xE9velopper avec la distributivit\xE9 simple",
    prerequisites: ["5e.calcul-litteral-simplifier"]
  },
  {
    code: "5e.ratios",
    domain: "data",
    strand: "problemes",
    title: "Utiliser des ratios et partager une quantit\xE9",
    prerequisites: ["6e.proportionnalite"]
  },
  {
    code: "5e.proportionnalite-pourcentages",
    domain: "data",
    strand: "problemes",
    title: "R\xE9soudre des probl\xE8mes de proportionnalit\xE9 et de pourcentages",
    prerequisites: ["6e.pourcentages"]
  },
  {
    code: "5e.probabilites",
    domain: "data",
    strand: "problemes",
    title: "Calculer des probabilit\xE9s dans des exp\xE9riences al\xE9atoires",
    prerequisites: ["6e.probabilites"]
  },
  {
    code: "5e.moyenne",
    domain: "data",
    strand: "problemes",
    title: "Calculer et interpr\xE9ter une moyenne",
    prerequisites: ["6e.graphiques"]
  },
  {
    code: "5e.representations-donnees",
    domain: "data",
    strand: "problemes",
    title: "Lire et choisir une repr\xE9sentation de donn\xE9es",
    prerequisites: ["6e.graphiques"]
  }
]);

// ../curriculum/src/grades/ce2.ts
var ce2Skills = defineGradeSkills("CE2", "2025", [
  // Nombres et calcul
  {
    code: "ce2.nombres-jusqua-10000",
    domain: "numbers",
    strand: "numeration",
    title: "Lire, \xE9crire et d\xE9composer les nombres jusqu\u2019\xE0 10 000",
    prerequisites: []
  },
  {
    code: "ce2.comparer-ranger-nombres",
    domain: "numbers",
    strand: "numeration",
    title: "Comparer, encadrer et ranger des nombres jusqu\u2019\xE0 10 000",
    prerequisites: ["ce2.nombres-jusqua-10000"]
  },
  {
    code: "ce2.droite-graduee-entiers",
    domain: "numbers",
    strand: "numeration",
    title: "Rep\xE9rer des nombres entiers sur une droite gradu\xE9e",
    prerequisites: ["ce2.nombres-jusqua-10000"]
  },
  {
    code: "ce2.complements",
    domain: "numbers",
    strand: "calcul",
    automatism: true,
    title: "Trouver les compl\xE9ments \xE0 la dizaine, \xE0 la centaine et \xE0 1 000",
    prerequisites: []
  },
  {
    code: "ce2.calcul-mental-additif",
    domain: "numbers",
    strand: "calcul",
    automatism: true,
    title: "Additionner et soustraire mentalement",
    prerequisites: ["ce2.complements"]
  },
  {
    code: "ce2.addition-posee",
    domain: "numbers",
    strand: "calcul",
    title: "Poser et calculer une addition",
    prerequisites: ["ce2.nombres-jusqua-10000"]
  },
  {
    code: "ce2.soustraction-posee",
    domain: "numbers",
    strand: "calcul",
    title: "Poser et calculer une soustraction",
    prerequisites: ["ce2.addition-posee"]
  },
  {
    code: "ce2.doubles-moities",
    domain: "numbers",
    strand: "calcul",
    automatism: true,
    title: "Conna\xEEtre les doubles et les moiti\xE9s des nombres usuels",
    prerequisites: ["ce2.calcul-mental-additif"]
  },
  {
    code: "ce2.tables-multiplication",
    domain: "numbers",
    strand: "calcul",
    automatism: true,
    title: "Conna\xEEtre les tables de multiplication de 2 \xE0 10",
    prerequisites: ["ce2.doubles-moities"]
  },
  {
    code: "ce2.multiplier-par-10-100",
    domain: "numbers",
    strand: "calcul",
    automatism: true,
    title: "Multiplier un nombre entier par 10 ou par 100",
    prerequisites: ["ce2.nombres-jusqua-10000"]
  },
  {
    code: "ce2.multiplication-posee",
    domain: "numbers",
    strand: "calcul",
    title: "Poser une multiplication par un nombre \xE0 un chiffre",
    prerequisites: ["ce2.tables-multiplication", "ce2.addition-posee"]
  },
  {
    code: "ce2.division-partage",
    domain: "numbers",
    strand: "calcul",
    title: "Comprendre la division comme un partage ou un groupement",
    prerequisites: ["ce2.tables-multiplication"]
  },
  {
    code: "ce2.fractions-unitaires",
    domain: "numbers",
    strand: "fractions",
    title: "Comprendre les fractions unitaires (un demi, un tiers, un quart\u2026)",
    prerequisites: ["ce2.division-partage"]
  },
  {
    code: "ce2.problemes-deux-etapes",
    domain: "numbers",
    strand: "problemes",
    title: "R\xE9soudre des probl\xE8mes en deux \xE9tapes",
    prerequisites: ["ce2.addition-posee", "ce2.soustraction-posee"]
  },
  // Grandeurs et mesures
  {
    code: "ce2.longueurs-conversions",
    domain: "measures",
    strand: "mesures",
    title: "Mesurer et convertir des longueurs (km, m, cm, mm)",
    prerequisites: ["ce2.multiplier-par-10-100"]
  },
  {
    code: "ce2.masses",
    domain: "measures",
    strand: "mesures",
    title: "Comparer et convertir des masses (g, kg)",
    prerequisites: ["ce2.multiplier-par-10-100"]
  },
  {
    code: "ce2.contenances",
    domain: "measures",
    strand: "mesures",
    title: "Comparer et convertir des contenances (L, cL)",
    prerequisites: ["ce2.multiplier-par-10-100"]
  },
  {
    code: "ce2.heures-durees",
    domain: "measures",
    strand: "mesures",
    title: "Lire l\u2019heure et calculer des dur\xE9es simples",
    prerequisites: []
  },
  {
    code: "ce2.monnaie",
    domain: "measures",
    strand: "mesures",
    title: "Calculer avec la monnaie (euros et centimes)",
    prerequisites: ["ce2.addition-posee"]
  },
  // Espace et géométrie
  {
    code: "ce2.polygones",
    domain: "geometry",
    strand: "geometrie",
    title: "Reconna\xEEtre et nommer des polygones (triangle, carr\xE9, rectangle, losange)",
    prerequisites: []
  },
  {
    code: "ce2.angle-droit",
    domain: "geometry",
    strand: "geometrie",
    title: "Rep\xE9rer et tracer des angles droits avec l\u2019\xE9querre",
    prerequisites: []
  },
  {
    code: "ce2.cube-pave",
    domain: "geometry",
    strand: "geometrie",
    title: "D\xE9crire le cube et le pav\xE9 droit (faces, ar\xEAtes, sommets)",
    prerequisites: ["ce2.polygones"]
  },
  {
    code: "ce2.quadrillage",
    domain: "geometry",
    strand: "geometrie",
    title: "Reproduire une figure sur quadrillage",
    prerequisites: []
  },
  {
    code: "ce2.symetrie-axiale",
    domain: "geometry",
    strand: "geometrie",
    title: "Compl\xE9ter une figure par sym\xE9trie axiale",
    prerequisites: ["ce2.quadrillage"]
  },
  // Données
  {
    code: "ce2.tableaux-graphiques",
    domain: "data",
    strand: "problemes",
    title: "Lire et compl\xE9ter des tableaux et des graphiques simples",
    prerequisites: ["ce2.nombres-jusqua-10000"]
  }
]);

// ../curriculum/src/grades/cm1.ts
var cm1Skills = defineGradeSkills("CM1", "2025", [
  // Nombres et calcul
  {
    code: "cm1.grands-nombres",
    domain: "numbers",
    strand: "numeration",
    title: "Lire, \xE9crire et d\xE9composer les nombres jusqu\u2019au million",
    prerequisites: ["ce2.nombres-jusqua-10000"]
  },
  {
    code: "cm1.comparer-grands-nombres",
    domain: "numbers",
    strand: "numeration",
    title: "Comparer, encadrer et ranger les grands nombres",
    prerequisites: ["cm1.grands-nombres", "ce2.comparer-ranger-nombres"]
  },
  {
    code: "cm1.fractions-simples",
    domain: "numbers",
    strand: "fractions",
    title: "Lire, \xE9crire et repr\xE9senter des fractions simples",
    prerequisites: ["ce2.fractions-unitaires"]
  },
  {
    code: "cm1.fractions-droite-graduee",
    domain: "numbers",
    strand: "fractions",
    title: "Placer des fractions sur une droite gradu\xE9e",
    prerequisites: ["cm1.fractions-simples", "ce2.droite-graduee-entiers"]
  },
  {
    code: "cm1.fractions-decimales",
    domain: "numbers",
    strand: "fractions",
    title: "Utiliser les fractions d\xE9cimales (dixi\xE8mes, centi\xE8mes)",
    prerequisites: ["cm1.fractions-simples"]
  },
  {
    code: "cm1.nombres-decimaux",
    domain: "numbers",
    strand: "numeration",
    title: "Lire, \xE9crire et d\xE9composer des nombres d\xE9cimaux",
    prerequisites: ["cm1.fractions-decimales"]
  },
  {
    code: "cm1.comparer-decimaux",
    domain: "numbers",
    strand: "numeration",
    title: "Comparer et ranger des nombres d\xE9cimaux",
    prerequisites: ["cm1.nombres-decimaux"]
  },
  {
    code: "cm1.calcul-mental",
    domain: "numbers",
    strand: "calcul",
    automatism: true,
    title: "Calculer mentalement avec des strat\xE9gies et des faits num\xE9riques",
    prerequisites: ["ce2.calcul-mental-additif", "ce2.tables-multiplication"]
  },
  {
    code: "cm1.multiplication-posee",
    domain: "numbers",
    strand: "calcul",
    title: "Poser une multiplication de deux nombres entiers",
    prerequisites: ["ce2.multiplication-posee"]
  },
  {
    code: "cm1.division-euclidienne",
    domain: "numbers",
    strand: "calcul",
    title: "Trouver le quotient et le reste d\u2019une division euclidienne",
    prerequisites: ["ce2.division-partage", "ce2.tables-multiplication"]
  },
  {
    code: "cm1.division-posee",
    domain: "numbers",
    strand: "calcul",
    title: "Poser une division par un nombre \xE0 un chiffre",
    prerequisites: ["cm1.division-euclidienne"]
  },
  {
    code: "cm1.multiples",
    domain: "numbers",
    strand: "calcul",
    title: "Reconna\xEEtre les multiples de 2, 5 et 10",
    prerequisites: ["ce2.tables-multiplication"]
  },
  {
    code: "cm1.problemes",
    domain: "numbers",
    strand: "problemes",
    title: "R\xE9soudre des probl\xE8mes \xE0 plusieurs \xE9tapes",
    prerequisites: ["ce2.problemes-deux-etapes"]
  },
  // Grandeurs et mesures
  {
    code: "cm1.perimetre",
    domain: "measures",
    strand: "mesures",
    title: "Calculer le p\xE9rim\xE8tre d\u2019un polygone",
    prerequisites: ["ce2.polygones", "ce2.addition-posee"]
  },
  {
    code: "cm1.aire-comptage",
    domain: "measures",
    strand: "mesures",
    title: "Mesurer une aire en comptant des unit\xE9s",
    prerequisites: ["ce2.quadrillage"]
  },
  {
    code: "cm1.conversions",
    domain: "measures",
    strand: "mesures",
    title: "Convertir des longueurs, des masses et des contenances",
    prerequisites: ["ce2.longueurs-conversions", "ce2.masses", "ce2.contenances"]
  },
  {
    code: "cm1.durees",
    domain: "measures",
    strand: "mesures",
    title: "Calculer des dur\xE9es (heures, minutes, secondes)",
    prerequisites: ["ce2.heures-durees"]
  },
  // Espace et géométrie
  {
    code: "cm1.cercle",
    domain: "geometry",
    strand: "geometrie",
    title: "Tracer un cercle et utiliser centre, rayon et diam\xE8tre",
    prerequisites: []
  },
  {
    code: "cm1.perpendiculaires-paralleles",
    domain: "geometry",
    strand: "geometrie",
    title: "Reconna\xEEtre et tracer des droites perpendiculaires et parall\xE8les",
    prerequisites: ["ce2.angle-droit"]
  },
  {
    code: "cm1.symetrie-axiale",
    domain: "geometry",
    strand: "geometrie",
    title: "Construire le sym\xE9trique d\u2019une figure par rapport \xE0 un axe",
    prerequisites: ["ce2.symetrie-axiale"]
  },
  {
    code: "cm1.figures-usuelles",
    domain: "geometry",
    strand: "geometrie",
    title: "D\xE9crire et construire des figures usuelles",
    prerequisites: ["ce2.polygones"]
  },
  // Données, probabilités, algèbre
  {
    code: "cm1.proportionnalite",
    domain: "data",
    strand: "problemes",
    title: "R\xE9soudre des situations simples de proportionnalit\xE9",
    prerequisites: ["ce2.tables-multiplication", "ce2.problemes-deux-etapes"]
  },
  {
    code: "cm1.probabilites-vocabulaire",
    domain: "data",
    strand: "problemes",
    title: "Utiliser le vocabulaire des probabilit\xE9s (certain, possible, impossible)",
    prerequisites: []
  },
  {
    code: "cm1.suites-motifs",
    domain: "data",
    strand: "calcul",
    title: "Prolonger des suites et des motifs (pens\xE9e alg\xE9brique)",
    prerequisites: ["ce2.calcul-mental-additif"]
  },
  {
    code: "cm1.tableaux-diagrammes",
    domain: "data",
    strand: "problemes",
    title: "Lire et produire des tableaux et des diagrammes",
    prerequisites: ["ce2.tableaux-graphiques"]
  }
]);

// ../curriculum/src/grades/cm2.ts
var cm2Skills = defineGradeSkills("CM2", "2026", [
  // Nombres et calcul
  {
    code: "cm2.grands-nombres",
    domain: "numbers",
    strand: "numeration",
    title: "Lire, \xE9crire et comparer les nombres jusqu\u2019au milliard",
    prerequisites: ["cm1.comparer-grands-nombres"]
  },
  {
    code: "cm2.decimaux-milliemes",
    domain: "numbers",
    strand: "numeration",
    title: "Utiliser les nombres d\xE9cimaux jusqu\u2019aux milli\xE8mes",
    prerequisites: ["cm1.comparer-decimaux"]
  },
  {
    code: "cm2.addition-soustraction-decimaux",
    domain: "numbers",
    strand: "calcul",
    title: "Additionner et soustraire des nombres d\xE9cimaux",
    prerequisites: ["cm1.nombres-decimaux", "ce2.soustraction-posee"]
  },
  {
    code: "cm2.multiplication-decimaux",
    domain: "numbers",
    strand: "calcul",
    title: "Multiplier un nombre d\xE9cimal par un nombre entier",
    prerequisites: ["cm1.multiplication-posee", "cm1.nombres-decimaux"]
  },
  {
    code: "cm2.multiplier-diviser-10-100-1000",
    domain: "numbers",
    strand: "calcul",
    automatism: true,
    title: "Multiplier et diviser par 10, 100 et 1 000",
    prerequisites: ["cm1.nombres-decimaux"]
  },
  {
    code: "cm2.division-decimale",
    domain: "numbers",
    strand: "calcul",
    title: "Diviser un nombre par un entier avec un quotient d\xE9cimal",
    prerequisites: ["cm1.division-posee"]
  },
  {
    code: "cm2.fractions-comparer",
    domain: "numbers",
    strand: "fractions",
    title: "Comparer des fractions entre elles et \xE0 l\u2019unit\xE9",
    prerequisites: ["cm1.fractions-simples"]
  },
  {
    code: "cm2.fractions-addition-meme-denominateur",
    domain: "numbers",
    strand: "fractions",
    title: "Ajouter et soustraire des fractions de m\xEAme d\xE9nominateur",
    prerequisites: ["cm1.fractions-simples"]
  },
  {
    code: "cm2.fractions-decimaux-equivalences",
    domain: "numbers",
    strand: "numeration",
    title: "Passer d\u2019une fraction d\xE9cimale \xE0 l\u2019\xE9criture d\xE9cimale",
    prerequisites: ["cm1.fractions-decimales", "cm1.nombres-decimaux"]
  },
  {
    code: "cm2.multiples-diviseurs",
    domain: "numbers",
    strand: "calcul",
    title: "Utiliser multiples, diviseurs et crit\xE8res de divisibilit\xE9",
    prerequisites: ["cm1.multiples", "cm1.division-euclidienne"]
  },
  {
    code: "cm2.calcul-mental",
    domain: "numbers",
    strand: "calcul",
    automatism: true,
    title: "Calculer mentalement avec des nombres d\xE9cimaux",
    prerequisites: ["cm1.calcul-mental"]
  },
  {
    code: "cm2.problemes",
    domain: "numbers",
    strand: "problemes",
    title: "R\xE9soudre des probl\xE8mes \xE0 plusieurs \xE9tapes avec des d\xE9cimaux",
    prerequisites: ["cm1.problemes"]
  },
  // Grandeurs et mesures
  {
    code: "cm2.aire-rectangle",
    domain: "measures",
    strand: "mesures",
    title: "Calculer l\u2019aire du carr\xE9 et du rectangle",
    prerequisites: ["cm1.aire-comptage", "ce2.tables-multiplication"]
  },
  {
    code: "cm2.perimetre-aire",
    domain: "measures",
    strand: "mesures",
    title: "Distinguer p\xE9rim\xE8tre et aire",
    prerequisites: ["cm2.aire-rectangle", "cm1.perimetre"]
  },
  {
    code: "cm2.conversions",
    domain: "measures",
    strand: "mesures",
    title: "Convertir des mesures exprim\xE9es avec des nombres d\xE9cimaux",
    prerequisites: ["cm1.conversions", "cm2.multiplier-diviser-10-100-1000"]
  },
  {
    code: "cm2.volumes-comptage",
    domain: "measures",
    strand: "mesures",
    title: "Mesurer un volume en comptant des cubes unit\xE9s",
    prerequisites: ["cm1.aire-comptage"]
  },
  {
    code: "cm2.angles-comparer",
    domain: "measures",
    strand: "mesures",
    title: "Comparer des angles et reconna\xEEtre angle aigu, droit et obtus",
    prerequisites: ["cm1.perpendiculaires-paralleles"]
  },
  // Espace et géométrie
  {
    code: "cm2.triangles-particuliers",
    domain: "geometry",
    strand: "geometrie",
    title: "Reconna\xEEtre et construire des triangles particuliers",
    prerequisites: ["cm1.figures-usuelles"]
  },
  {
    code: "cm2.quadrilateres-particuliers",
    domain: "geometry",
    strand: "geometrie",
    title: "Reconna\xEEtre et construire des quadrilat\xE8res particuliers",
    prerequisites: ["cm1.figures-usuelles", "cm1.perpendiculaires-paralleles"]
  },
  {
    code: "cm2.programmes-construction",
    domain: "geometry",
    strand: "geometrie",
    title: "Suivre et r\xE9diger un programme de construction",
    prerequisites: ["cm1.cercle", "cm1.perpendiculaires-paralleles"]
  },
  // Données, probabilités, algèbre
  {
    code: "cm2.pourcentages",
    domain: "data",
    strand: "problemes",
    title: "Calculer des pourcentages simples (10 %, 25 %, 50 %\u2026)",
    prerequisites: ["cm1.proportionnalite"]
  },
  {
    code: "cm2.echelles",
    domain: "data",
    strand: "problemes",
    title: "Utiliser une \xE9chelle sur un plan ou une carte",
    prerequisites: ["cm1.proportionnalite"]
  },
  {
    code: "cm2.proportionnalite",
    domain: "data",
    strand: "problemes",
    title: "R\xE9soudre des probl\xE8mes de proportionnalit\xE9 (passage \xE0 l\u2019unit\xE9, coefficient)",
    prerequisites: ["cm1.proportionnalite"]
  },
  {
    code: "cm2.probabilites",
    domain: "data",
    strand: "problemes",
    title: "Comparer des chances dans des exp\xE9riences al\xE9atoires simples",
    prerequisites: ["cm1.probabilites-vocabulaire", "cm1.fractions-simples"]
  },
  {
    code: "cm2.expressions-inconnue",
    domain: "data",
    strand: "calcul",
    title: "Trouver un nombre inconnu dans une \xE9galit\xE9",
    prerequisites: ["cm1.suites-motifs", "cm1.calcul-mental"]
  },
  {
    code: "cm2.graphiques",
    domain: "data",
    strand: "problemes",
    title: "Lire et interpr\xE9ter des graphiques",
    prerequisites: ["cm1.tableaux-diagrammes"]
  }
]);

// ../curriculum/src/grades/sixieme.ts
var sixiemeSkills = defineGradeSkills("6e", "2025", [
  // Nombres et calcul
  {
    code: "6e.fractions-quotient",
    domain: "numbers",
    strand: "fractions",
    title: "Comprendre une fraction comme un quotient",
    prerequisites: ["cm2.division-decimale", "cm2.fractions-comparer"]
  },
  {
    code: "6e.fractions-egales",
    domain: "numbers",
    strand: "fractions",
    title: "Reconna\xEEtre des fractions \xE9gales et simplifier une fraction",
    prerequisites: ["6e.fractions-quotient", "cm2.multiples-diviseurs"]
  },
  {
    code: "6e.fraction-d-une-quantite",
    domain: "numbers",
    strand: "fractions",
    title: "Calculer une fraction d\u2019une quantit\xE9",
    prerequisites: ["cm1.fractions-simples", "cm1.division-euclidienne"]
  },
  {
    code: "6e.fractions-droite",
    domain: "numbers",
    strand: "fractions",
    title: "Rep\xE9rer des fractions sur une demi-droite gradu\xE9e",
    prerequisites: ["cm1.fractions-droite-graduee"]
  },
  {
    code: "6e.division-decimaux",
    domain: "numbers",
    strand: "calcul",
    title: "Diviser un nombre d\xE9cimal par un nombre entier",
    prerequisites: ["cm2.division-decimale"]
  },
  {
    code: "6e.multiplication-decimaux",
    domain: "numbers",
    strand: "calcul",
    title: "Multiplier deux nombres d\xE9cimaux",
    prerequisites: ["cm2.multiplication-decimaux"]
  },
  {
    code: "6e.priorites-operatoires",
    domain: "numbers",
    strand: "calcul",
    title: "Appliquer les priorit\xE9s op\xE9ratoires et les parenth\xE8ses",
    prerequisites: ["cm2.calcul-mental"]
  },
  {
    code: "6e.nombres-premiers",
    domain: "numbers",
    strand: "calcul",
    title: "Reconna\xEEtre un nombre premier",
    prerequisites: ["cm2.multiples-diviseurs"]
  },
  {
    code: "6e.divisibilite",
    domain: "numbers",
    strand: "calcul",
    title: "Utiliser les crit\xE8res de divisibilit\xE9 par 2, 3, 4, 5, 9 et 10",
    prerequisites: ["cm2.multiples-diviseurs"]
  },
  {
    code: "6e.arrondis-ordres-grandeur",
    domain: "numbers",
    strand: "numeration",
    title: "Arrondir un nombre et estimer un ordre de grandeur",
    prerequisites: ["cm2.decimaux-milliemes"]
  },
  // Grandeurs et mesures
  {
    code: "6e.aires-figures",
    domain: "measures",
    strand: "mesures",
    title: "Calculer l\u2019aire d\u2019un triangle et de figures compos\xE9es",
    prerequisites: ["cm2.aire-rectangle"]
  },
  {
    code: "6e.aire-disque",
    domain: "measures",
    strand: "mesures",
    title: "Calculer le p\xE9rim\xE8tre et l\u2019aire d\u2019un disque",
    prerequisites: ["cm1.cercle", "6e.aires-figures", "6e.multiplication-decimaux"]
  },
  {
    code: "6e.volume-pave",
    domain: "measures",
    strand: "mesures",
    title: "Calculer le volume d\u2019un pav\xE9 droit",
    prerequisites: ["cm2.volumes-comptage", "cm1.multiplication-posee"]
  },
  {
    code: "6e.angles-degres",
    domain: "measures",
    strand: "mesures",
    title: "Mesurer, construire et nommer des angles en degr\xE9s",
    prerequisites: ["cm2.angles-comparer"]
  },
  {
    code: "6e.durees-conversions",
    domain: "measures",
    strand: "mesures",
    title: "Calculer et convertir des dur\xE9es",
    prerequisites: ["cm1.durees"]
  },
  // Espace et géométrie
  {
    code: "6e.symetrie-axiale",
    domain: "geometry",
    strand: "geometrie",
    title: "Utiliser les propri\xE9t\xE9s de la sym\xE9trie axiale",
    prerequisites: ["cm1.symetrie-axiale"]
  },
  {
    code: "6e.constructions",
    domain: "geometry",
    strand: "geometrie",
    title: "Construire triangles, m\xE9diatrice et figures \xE0 la r\xE8gle et au compas",
    prerequisites: ["cm2.programmes-construction"]
  },
  {
    code: "6e.solides-patrons",
    domain: "geometry",
    strand: "geometrie",
    title: "Reconna\xEEtre des solides et construire des patrons",
    prerequisites: ["ce2.cube-pave", "cm2.volumes-comptage"]
  },
  {
    code: "6e.droites-segments",
    domain: "geometry",
    strand: "geometrie",
    title: "Utiliser le vocabulaire droite, segment, demi-droite et appartenance",
    prerequisites: ["cm1.perpendiculaires-paralleles"]
  },
  // Données, probabilités, algèbre
  {
    code: "6e.proportionnalite",
    domain: "data",
    strand: "problemes",
    title: "Reconna\xEEtre la proportionnalit\xE9 et calculer une quatri\xE8me proportionnelle",
    prerequisites: ["cm2.proportionnalite"]
  },
  {
    code: "6e.pourcentages",
    domain: "data",
    strand: "problemes",
    title: "Appliquer un pourcentage",
    prerequisites: ["cm2.pourcentages", "6e.proportionnalite"]
  },
  {
    code: "6e.probabilites",
    domain: "data",
    strand: "problemes",
    title: "Calculer une probabilit\xE9 dans une situation simple",
    prerequisites: ["cm2.probabilites", "6e.fractions-quotient"]
  },
  {
    code: "6e.expressions-litterales",
    domain: "data",
    strand: "calcul",
    title: "Calculer une expression litt\xE9rale pour une valeur donn\xE9e",
    prerequisites: ["cm2.expressions-inconnue", "6e.priorites-operatoires"]
  },
  {
    code: "6e.graphiques",
    domain: "data",
    strand: "problemes",
    title: "Lire et construire des tableaux et des graphiques",
    prerequisites: ["cm2.graphiques"]
  }
]);

// ../curriculum/src/error-types.ts
var ERROR_TYPES = [
  {
    code: "forgot-carry",
    label: "oublie la retenue",
    skills: ["ce2.addition-posee", "ce2.multiplication-posee"]
  },
  {
    code: "reverse-order",
    label: "range dans le mauvais sens",
    skills: ["ce2.comparer-ranger-nombres", "cm1.comparer-decimaux"]
  },
  {
    code: "digits-not-length",
    label: "compare les chiffres sans regarder combien les nombres en ont",
    skills: ["ce2.comparer-ranger-nombres"]
  },
  { code: "double-half", label: "confond le double et la moiti\xE9", skills: ["ce2.doubles-moities"] },
  {
    code: "one-part-only",
    label: "colorie une seule part au lieu d\u2019un morceau entier",
    skills: ["ce2.fractions-unitaires"]
  },
  {
    code: "shades-denominator",
    label: "colorie autant de parts que le d\xE9nominateur",
    skills: ["ce2.fractions-unitaires"]
  },
  {
    code: "conversion-factor",
    label: "se trompe de nombre de z\xE9ros dans les conversions",
    skills: ["ce2.longueurs-conversions"]
  },
  {
    code: "conversion-direction",
    label: "convertit dans le mauvais sens",
    skills: ["ce2.longueurs-conversions"]
  },
  {
    code: "table-neighbour",
    label: "confond des r\xE9sultats voisins dans les tables",
    skills: ["ce2.tables-multiplication"]
  },
  {
    code: "adds-instead-of-multiplying",
    label: "additionne au lieu de multiplier",
    skills: ["ce2.tables-multiplication", "cm2.aire-rectangle"]
  },
  {
    code: "decimals-as-integers",
    label: "compare les chiffres apr\xE8s la virgule comme des nombres entiers",
    skills: ["cm1.comparer-decimaux"]
  },
  {
    code: "quotient-remainder",
    label: "confond le quotient et le reste",
    skills: ["cm1.division-euclidienne"]
  },
  {
    code: "off-by-one-graduation",
    label: "se d\xE9cale d\u2019une graduation sur la droite gradu\xE9e",
    skills: ["cm1.fractions-droite-graduee"]
  },
  {
    code: "decimal-place-value",
    label: "place mal les dixi\xE8mes et les centi\xE8mes",
    skills: ["cm1.nombres-decimaux"]
  },
  {
    code: "area-perimeter",
    label: "confond aire et p\xE9rim\xE8tre",
    skills: ["cm1.perimetre", "cm2.aire-rectangle"]
  },
  {
    code: "half-perimeter",
    label: "ne compte chaque c\xF4t\xE9 qu\u2019une fois dans le p\xE9rim\xE8tre",
    skills: ["cm1.perimetre"]
  },
  {
    code: "additive-reasoning",
    label: "ajoute au lieu de multiplier dans les probl\xE8mes de proportionnalit\xE9",
    skills: ["cm1.proportionnalite", "6e.proportionnalite"]
  },
  {
    code: "skips-unit-price",
    label: "oublie de passer par le prix d\u2019un seul objet",
    skills: ["cm1.proportionnalite"]
  },
  {
    code: "misaligned-commas",
    label: "n\u2019aligne pas les virgules",
    skills: ["cm2.addition-soustraction-decimaux"]
  },
  {
    code: "inverse-operation",
    label: "n\u2019utilise pas l\u2019op\xE9ration inverse pour trouver un nombre manquant",
    skills: ["cm2.expressions-inconnue"]
  },
  {
    code: "adds-denominators",
    label: "additionne aussi les d\xE9nominateurs",
    skills: ["cm2.fractions-addition-meme-denominateur", "5e.fractions-addition"]
  },
  {
    code: "tenths-hundredths",
    label: "confond dixi\xE8mes et centi\xE8mes",
    skills: ["cm2.fractions-decimaux-equivalences"]
  },
  {
    code: "last-digit-rule",
    label: "regarde le dernier chiffre pour savoir si un nombre est divisible par 3 ou 9",
    skills: ["cm2.multiples-diviseurs"]
  },
  {
    code: "percent-subtract",
    label: "enl\xE8ve le nombre au lieu de prendre le pourcentage",
    skills: ["cm2.pourcentages"]
  },
  {
    code: "percent-hundred",
    label: "oublie de diviser par 100 dans un pourcentage",
    skills: ["cm2.pourcentages"]
  },
  {
    code: "acute-obtuse",
    label: "confond angle aigu et angle obtus",
    skills: ["6e.angles-degres"]
  },
  {
    code: "divides-only",
    label: "partage sans multiplier par le num\xE9rateur",
    skills: ["6e.fraction-d-une-quantite"]
  },
  {
    code: "odd-is-prime",
    label: "croit que les nombres impairs sont premiers",
    skills: ["6e.nombres-premiers"]
  },
  {
    code: "left-to-right",
    label: "calcule de gauche \xE0 droite sans les priorit\xE9s",
    skills: ["6e.priorites-operatoires"]
  },
  {
    code: "favourable-over-others",
    label: "divise par les autres cas au lieu du total",
    skills: ["6e.probabilites"]
  },
  {
    code: "same-denominator",
    label: "additionne les num\xE9rateurs sans mettre au m\xEAme d\xE9nominateur",
    skills: ["5e.fractions-addition"]
  },
  {
    code: "zeros-count",
    label: "se trompe dans le nombre de z\xE9ros",
    skills: ["5e.puissances-de-10"]
  },
  {
    code: "exponent-times-ten",
    label: "multiplie 10 par l\u2019exposant",
    skills: ["5e.puissances-de-10"]
  },
  {
    code: "subtract-negative",
    label: "oublie que soustraire un nombre n\xE9gatif revient \xE0 ajouter",
    skills: ["5e.relatifs-addition-soustraction"]
  },
  {
    code: "sign-error",
    label: "se trompe de signe",
    skills: ["5e.relatifs-addition-soustraction"]
  }
];
var BY_CODE = new Map(
  ERROR_TYPES.map((item) => [item.code, item])
);
var isErrorTypeCode = (code) => BY_CODE.has(code);
function getErrorType(code) {
  const type = BY_CODE.get(code);
  if (!type) throw new Error(`Unknown error type ${code}`);
  return type;
}

// ../curriculum/src/index.ts
var skills = [
  ...ce2Skills,
  ...cm1Skills,
  ...cm2Skills,
  ...sixiemeSkills,
  ...cinquiemeSkills
];
var skillsByCode = new Map(
  skills.map((skill) => [skill.code, skill])
);
function isSkillCode(code) {
  return skillsByCode.has(code);
}
function getSkill(code) {
  const skill = skillsByCode.get(code);
  if (!skill) throw new Error(`Unknown skill ${code}`);
  return skill;
}

// ../shared/src/grade.ts
var GRADES = ["CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e"];
var gradeRank = (grade2) => GRADES.indexOf(grade2);

// src/exercise.ts
var DIFFICULTIES = [1, 2, 3, 4, 5];

// src/adaptive/ratings.ts
var DIFFICULTY_RATINGS = {
  1: 800,
  2: 1e3,
  3: 1200,
  4: 1400,
  5: 1600
};
var ITEM_K = 4;
var itemKey = (generatorId2, difficulty2) => `${generatorId2}:${difficulty2}`;
var itemRating = (ratings, generatorId2, difficulty2) => ratings[itemKey(generatorId2, difficulty2)] ?? DIFFICULTY_RATINGS[difficulty2];
var expectedSuccess = (learner, item) => 1 / (1 + 10 ** ((item - learner) / 400));
var learnerK = (attempts) => Math.max(24, 64 - 4 * attempts);
function updateRatings(input) {
  const expected = expectedSuccess(input.learner, input.item);
  const actual = input.correct ? 1 : 0;
  return {
    learner: input.learner + learnerK(input.learnerAttempts) * (actual - expected),
    item: input.item + ITEM_K * (expected - actual)
  };
}

// src/adaptive/mastery.ts
var MASTERY_THRESHOLD = 80;
var SESSIONS_TO_MASTER = 2;
var PRESUMED_THRESHOLD = 70;
var DAY_MS = 864e5;
var masteryFromElo = (elo) => Math.min(100, Math.max(0, Math.round((elo - 800) / 8)));
function decayedElo(record, at) {
  if (!record.practicedAt) return record.elo;
  const days = (Date.parse(at) - Date.parse(record.practicedAt)) / DAY_MS;
  return record.elo - Math.min(200, Math.max(0, days - 2) * 4);
}
var masteryOf = (record, at) => masteryFromElo(decayedElo(record, at));
function masteryStatus(record, at) {
  if (record.attempts === 0 && !record.masteredAt) return "to_discover";
  if (record.masteredAt)
    return masteryOf(record, at) >= MASTERY_THRESHOLD ? "mastered" : "to_review";
  return "in_progress";
}
function applyAnswer(record, answer) {
  const { learner } = updateRatings({
    learner: decayedElo(record, answer.at),
    item: answer.item,
    correct: answer.correct,
    learnerAttempts: record.attempts
  });
  return { ...record, elo: learner, attempts: record.attempts + 1, practicedAt: answer.at };
}
function closeSession(record, at) {
  const streak = masteryOf(record, at) >= MASTERY_THRESHOLD ? record.streak + 1 : 0;
  const masteredAt = record.masteredAt ?? (streak >= SESSIONS_TO_MASTER ? at : null);
  return { ...record, streak, masteredAt };
}

// src/random.ts
function createRng(seed) {
  let state = seed >>> 0;
  const next = () => {
    state = state + 1831565813 >>> 0;
    let t = state;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const int = (min, max) => min + Math.floor(next() * (max - min + 1));
  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = int(0, i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };
  return {
    next,
    int,
    pick: (items) => {
      if (items.length === 0) throw new RangeError("pick from an empty list");
      return items[int(0, items.length - 1)];
    },
    sample: (items, count) => {
      if (count > items.length) throw new RangeError("sample larger than the list");
      return shuffle(items).slice(0, count);
    },
    shuffle,
    chance: (probability) => next() < probability
  };
}

// src/generator.ts
var defineGenerator = (generator) => generator;
var generatorId = (generator) => generator.id ?? generator.skill;
function generateExercise(generator, difficulty2, seed) {
  return {
    ...generator.generate(createRng(seed), difficulty2),
    generatorId: generatorId(generator),
    skill: generator.skill,
    difficulty: difficulty2,
    seed
  };
}

// src/rational.ts
function gcd(a, b) {
  let [x, y] = [Math.abs(a), Math.abs(b)];
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}
function rational(num, den = 1) {
  if (!Number.isSafeInteger(num) || !Number.isSafeInteger(den) || den === 0) {
    throw new RangeError(`Invalid rational ${num}/${den}`);
  }
  const divisor = gcd(num, den) * Math.sign(den);
  const reducedNum = num / divisor;
  return { num: reducedNum === 0 ? 0 : reducedNum, den: den / divisor };
}
function decimal(scaled, places) {
  return rational(scaled, 10 ** places);
}
var add = (a, b) => rational(a.num * b.den + b.num * a.den, a.den * b.den);
var sub = (a, b) => rational(a.num * b.den - b.num * a.den, a.den * b.den);
var mul = (a, b) => rational(a.num * b.num, a.den * b.den);
var div = (a, b) => rational(a.num * b.den, a.den * b.num);
var equals = (a, b) => a.num === b.num && a.den === b.den;
var compare = (a, b) => Math.sign(a.num * b.den - b.num * a.den);
function isTerminating(value) {
  let den = value.den;
  while (den % 2 === 0) den /= 2;
  while (den % 5 === 0) den /= 5;
  return den === 1;
}

// src/format.ts
var MINUS = "\u2212";
var THOUSANDS_SEPARATOR = "\u202F";
function groupThousands(digits) {
  return digits.length > 3 ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR) : digits;
}
function formatInteger(value) {
  return (value < 0 ? MINUS : "") + groupThousands(Math.abs(value).toString());
}
function formatDecimal(value) {
  if (!isTerminating(value)) throw new RangeError(`${value.num}/${value.den} is not a decimal`);
  let places = 0;
  while (10 ** places % value.den !== 0) places++;
  const scaled = Math.abs(value.num) * (10 ** places / value.den);
  const digits = scaled.toString().padStart(places + 1, "0");
  const units = groupThousands(digits.slice(0, digits.length - places));
  const decimals = digits.slice(digits.length - places);
  return (value.num < 0 ? MINUS : "") + units + (places > 0 ? `,${decimals}` : "");
}
function formatFraction(num, den) {
  return `${num < 0 ? MINUS : ""}${Math.abs(num)}/${den}`;
}
function formatNumber(value) {
  const exact = typeof value === "number" ? rational(value) : value;
  if (exact.den === 1) return formatInteger(exact.num);
  return isTerminating(exact) ? formatDecimal(exact) : formatFraction(exact.num, exact.den);
}
function formatOperand(value) {
  const text = formatNumber(value);
  return text.startsWith(MINUS) ? `(${text})` : text;
}

// src/generators/helpers.ts
function distinct(count, make, key = String) {
  const values = /* @__PURE__ */ new Map();
  for (let attempt = 0; values.size < count; attempt++) {
    if (attempt > 1e4) throw new Error(`Could not draw ${count} distinct values`);
    const value = make();
    values.set(key(value), value);
  }
  return [...values.values()];
}
function list(items) {
  return items.length < 2 ? items[0] ?? "" : `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`;
}
function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}
var SUPERSCRIPT_DIGITS = "\u2070\xB9\xB2\xB3\u2074\u2075\u2076\u2077\u2078\u2079";
function power(base, exponent) {
  return `${base}${[...String(exponent)].map((digit) => SUPERSCRIPT_DIGITS[Number(digit)]).join("")}`;
}
function ranking(values, direction) {
  const sign = direction === "ascending" ? 1 : -1;
  return values.map((value, index) => ({ value, index })).sort((a, b) => sign * compare(a.value, b.value)).map(({ index }) => index);
}
function isPrime(value) {
  if (value < 2) return false;
  for (let divisor = 2; divisor * divisor <= value; divisor++) {
    if (value % divisor === 0) return false;
  }
  return true;
}
function smallestFactor(value) {
  for (let divisor = 2; divisor * divisor <= value; divisor++) {
    if (value % divisor === 0) return divisor;
  }
  return value;
}
function range(min, max, ...excluded) {
  const values = [];
  for (let value = min; value <= max; value++) if (!excluded.includes(value)) values.push(value);
  return values;
}
function orderPrompt(direction) {
  return `Range ces nombres du plus ${direction === "ascending" ? "petit au plus grand" : "grand au plus petit"}.`;
}
function orderSentence(labels, order, direction) {
  return order.map((index) => labels[index]).join(direction === "ascending" ? " < " : " > ");
}
function gcd2(a, b) {
  return b === 0 ? Math.abs(a) : gcd2(b, a % b);
}
function orderFields(labels, values, direction, mistakes = {}) {
  const answer = ranking(values, direction);
  return {
    type: "order",
    direction,
    items: labels,
    answer,
    prompt: orderPrompt(direction),
    explanation: [orderSentence(labels, answer, direction)],
    mistakes: { "reverse-order": [[...answer].reverse()], ...mistakes }
  };
}
var digitsOf = (value) => [...String(value)].reverse().map(Number);
function noCarrySum(a, b) {
  const [x, y] = [digitsOf(a), digitsOf(b)];
  const length = Math.max(x.length, y.length);
  return Array.from({ length }, (_, i) => ((x[i] ?? 0) + (y[i] ?? 0)) % 10).reduce(
    (sum, digit, i) => sum + digit * 10 ** i,
    0
  );
}
function noCarryProduct(a, b) {
  return digitsOf(a).reduce((sum, digit, i) => sum + digit * b % 10 * 10 ** i, 0);
}
function rankBy(keys, direction) {
  const sign = direction === "ascending" ? 1 : -1;
  return keys.map((key, index) => ({ key, index })).sort((a, b) => sign * (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)).map(({ index }) => index);
}
var afterCommaKey = (label) => {
  const [whole = "0", decimals = "0"] = label.replace(/\D*$/, "").split(",");
  return Number(whole.replace(/\D/g, "")) * 1e6 + Number(decimals);
};
function calc(operator, a, b) {
  if (operator === "+") return add(a, b);
  if (operator === "\u2212") return sub(a, b);
  if (operator === "\xD7") return mul(a, b);
  return b.num === 0 ? void 0 : div(a, b);
}
function leftToRight(expression) {
  const tokens = expression.replace(/[()]/g, "").split(" ").filter(Boolean);
  let value = rational(Number(tokens[0]));
  for (let i = 1; i + 1 < tokens.length && value; i += 2) {
    value = calc(tokens[i] ?? "+", value, rational(Number(tokens[i + 1])));
  }
  return value;
}
function misalignedSum(a, b) {
  const written = (value) => {
    const [whole = "", decimals = ""] = formatDecimal(value).replace(/\s/g, "").split(",");
    return { digits: Number(whole + decimals), places: decimals.length };
  };
  const [x, y] = [written(a), written(b)];
  return rational(x.digits + y.digits, 10 ** Math.max(x.places, y.places));
}
function swapped(list2, i, j) {
  if (i < 0 || j < 0) return void 0;
  const copy = [...list2];
  [copy[i], copy[j]] = [list2[j] ?? 0, list2[i] ?? 0];
  return copy;
}
function chain(terms, operators, minusNegative = false) {
  return terms.reduce((sum, term, i) => {
    if (i === 0) return term;
    if (operators[i - 1] !== "\u2212") return sum + term;
    return minusNegative ? sum - Math.abs(term) : sum - term;
  }, 0);
}
var endsLikeMultiple = (value, divisor) => value % 10 > 0 && value % 10 % divisor === 0;
function swapTenths(fractions, answer) {
  const tenth = fractions.findIndex(
    ([num2, den]) => den === 10 && fractions.some(([k, d]) => k === num2 && d === 100)
  );
  const num = fractions[tenth]?.[0];
  return swapped(
    answer,
    tenth,
    fractions.findIndex(([k, d]) => k === num && d === 100)
  );
}

// src/generators/ce2/addition-posee.ts
var RANGES = {
  1: [10, 49, 10, 49],
  2: [100, 899, 10, 99],
  3: [100, 499, 100, 499],
  4: [1e3, 7999, 100, 999],
  5: [1e3, 4999, 1e3, 4999]
};
var addition_posee_default = defineGenerator({
  skill: "ce2.addition-posee",
  generate(rng, difficulty2) {
    const [aMin, aMax, bMin, bMax] = RANGES[difficulty2];
    const [a, b] = [rng.int(aMin, aMax), rng.int(bMin, bMax)];
    return {
      type: "numeric",
      prompt: `${formatNumber(a)} + ${formatNumber(b)} = ?`,
      check: `${formatNumber(a)} + ${formatNumber(b)}`,
      answer: rational(a + b),
      mistakes: { "forgot-carry": [rational(noCarrySum(a, b))] },
      hint: "Pose l\u2019addition en alignant les unit\xE9s, puis calcule de droite \xE0 gauche sans oublier les retenues.",
      explanation: [
        "On additionne colonne par colonne, en commen\xE7ant par les unit\xE9s.",
        `${formatNumber(a)} + ${formatNumber(b)} = ${formatNumber(a + b)}`
      ]
    };
  }
});

// src/generators/ce2/comparer-ranger-nombres.ts
var MAX = { 1: 99, 2: 999, 3: 9999, 4: 999, 5: 999 };
var comparer_ranger_nombres_default = defineGenerator({
  skill: "ce2.comparer-ranger-nombres",
  generate(rng, difficulty2) {
    const base = difficulty2 >= 4 ? rng.int(1, 9) * 1e3 : 0;
    const values = distinct(difficulty2 < 3 ? 4 : 5, () => base + rng.int(1, MAX[difficulty2]));
    const direction = rng.pick(["ascending", "descending"]);
    return {
      ...orderFields(
        values.map(formatNumber),
        values.map((value) => rational(value)),
        direction,
        // Read as words, 1 000 comes before 999: the length of the numbers is overlooked.
        { "digits-not-length": [rankBy(values.map(String), direction)] }
      ),
      hint: "Compare d\u2019abord le nombre de chiffres, puis les chiffres un par un en partant de la gauche."
    };
  }
});

// src/generators/ce2/doubles-moities.ts
var MAX2 = { 1: 20, 2: 50, 3: 100, 4: 250, 5: 500 };
var doubles_moities_default = defineGenerator({
  skill: "ce2.doubles-moities",
  generate(rng, difficulty2) {
    const value = rng.int(3, MAX2[difficulty2]);
    if (rng.chance(0.5)) {
      return {
        type: "numeric",
        prompt: `Quel est le double de ${formatNumber(value)} ?`,
        check: `double(${formatNumber(value)})`,
        answer: rational(2 * value),
        mistakes: { "double-half": [rational(value, 2)] },
        hint: "Le double, c\u2019est le nombre ajout\xE9 \xE0 lui-m\xEAme.",
        explanation: [`${formatNumber(value)} + ${formatNumber(value)} = ${formatNumber(2 * value)}`]
      };
    }
    return {
      type: "numeric",
      prompt: `Quelle est la moiti\xE9 de ${formatNumber(2 * value)} ?`,
      check: `moitie(${formatNumber(2 * value)})`,
      answer: rational(value),
      mistakes: { "double-half": [rational(4 * value)] },
      hint: "La moiti\xE9, c\u2019est le nombre qu\u2019il faut doubler pour retrouver le nombre de d\xE9part.",
      explanation: [`${formatNumber(value)} + ${formatNumber(value)} = ${formatNumber(2 * value)}, donc la moiti\xE9 est ${formatNumber(value)}.`]
    };
  }
});

// src/generators/ce2/fractions-unitaires.ts
var DENOMINATORS = {
  1: [2, 3, 4],
  2: [2, 3, 4, 5, 6],
  3: [3, 4, 5, 6, 8],
  4: [4, 5, 6, 8, 10],
  5: [3, 4, 5, 6]
};
var fractions_unitaires_default = defineGenerator({
  skill: "ce2.fractions-unitaires",
  generate(rng, difficulty2) {
    const den = rng.pick(DENOMINATORS[difficulty2]);
    const group = rng.int(1, difficulty2 < 3 ? 2 : 3);
    return {
      type: "fraction-shade",
      parts: den * group,
      fraction: `1/${den}`,
      answer: group,
      mistakes: { "one-part-only": [1], "shades-denominator": [den] },
      prompt: `Colorie 1/${den} de la barre.`,
      hint: `Regroupe les parts pour former ${den} morceaux \xE9gaux.`,
      explanation: [
        `${den * group} parts \xF7 ${den} = ${group} : on colorie ${group} part${group > 1 ? "s" : ""}.`
      ]
    };
  }
});

// src/generators/ce2/longueurs-conversions.ts
var PAIRS = [
  ["m", "cm", 100],
  ["cm", "mm", 10],
  ["km", "m", 1e3],
  ["m", "mm", 1e3]
];
var longueurs_conversions_default = defineGenerator({
  skill: "ce2.longueurs-conversions",
  generate(rng, difficulty2) {
    const [big, small, factor] = rng.pick(PAIRS.slice(0, Math.min(difficulty2 + 1, PAIRS.length)));
    const count = rng.int(2, difficulty2 < 3 ? 9 : 25);
    const reverse = difficulty2 >= 4 && rng.chance(0.5);
    const [value, answer] = reverse ? [count * factor, count] : [count, count * factor];
    const [from, to] = reverse ? [small, big] : [big, small];
    return {
      type: "numeric",
      prompt: `${formatNumber(value)} ${from} = ? ${to}`,
      check: `conversion(${formatNumber(value)}, ${from}, ${to})`,
      answer: rational(answer),
      mistakes: {
        "conversion-factor": [rational(answer * 10), rational(answer, 10)],
        "conversion-direction": [reverse ? rational(value * factor) : rational(value, factor)]
      },
      unit: to,
      hint: `Combien de ${small} dans 1 ${big} ?`,
      explanation: [
        `1 ${big} = ${formatNumber(factor)} ${small}, donc ${formatNumber(value)} ${from} = ${formatNumber(answer)} ${to}.`
      ]
    };
  }
});

// src/generators/ce2/multiplication-posee.ts
var RANGES2 = { 1: [11, 30], 2: [12, 99], 3: [100, 499], 4: [100, 999], 5: [1e3, 1999] };
var multiplication_posee_default = defineGenerator({
  skill: "ce2.multiplication-posee",
  generate(rng, difficulty2) {
    const [min, max] = RANGES2[difficulty2];
    const a = rng.int(min, max);
    const b = rng.int(difficulty2 === 1 ? 2 : 3, difficulty2 === 1 ? 5 : 9);
    return {
      type: "numeric",
      prompt: `${formatNumber(a)} \xD7 ${b} = ?`,
      check: `${formatNumber(a)} \xD7 ${b}`,
      answer: rational(a * b),
      mistakes: { "forgot-carry": [rational(noCarryProduct(a, b))] },
      hint: "Multiplie d\u2019abord les unit\xE9s, puis les dizaines, sans oublier les retenues.",
      explanation: [
        `On multiplie chaque chiffre de ${formatNumber(a)} par ${b}, en commen\xE7ant par les unit\xE9s.`,
        `${formatNumber(a)} \xD7 ${b} = ${formatNumber(a * b)}`
      ]
    };
  }
});

// src/generators/ce2/tables-multiplication.ts
var TABLES = { 1: [2, 5, 10], 2: [2, 3, 4, 5, 10], 3: [2, 3, 4, 5, 6, 7, 8, 9], 4: [6, 7, 8, 9] };
var tables_multiplication_default = defineGenerator({
  skill: "ce2.tables-multiplication",
  generate(rng, difficulty2) {
    const missing = difficulty2 === 5;
    const a = rng.pick(TABLES[missing ? 4 : difficulty2]);
    const b = rng.pick([2, 3, 4, 5, 6, 7, 8, 9, 10].filter((value) => !missing || value !== a));
    const product = formatNumber(a * b);
    return {
      type: "numeric",
      prompt: missing ? `${a} \xD7 ? = ${product}` : `${a} \xD7 ${b} = ?`,
      check: missing ? `${product} \xF7 ${a}` : `${a} \xD7 ${b}`,
      answer: rational(missing ? b : a * b),
      mistakes: missing ? { "table-neighbour": [rational(b - 1), rational(b + 1)] } : {
        "table-neighbour": [rational(a * (b - 1)), rational(a * (b + 1))],
        "adds-instead-of-multiplying": [rational(a + b)]
      },
      hint: `Pense \xE0 la table de ${a}.`,
      explanation: [`${a} \xD7 ${b} = ${product}`]
    };
  }
});

// src/generators/cm1/comparer-decimaux.ts
var comparer_decimaux_default = defineGenerator({
  skill: "cm1.comparer-decimaux",
  generate(rng, difficulty2) {
    const whole = rng.int(0, difficulty2 < 3 ? 9 : 99);
    const draw = () => {
      const places = rng.int(1, difficulty2 < 3 ? 2 : 3);
      const units = difficulty2 === 1 ? rng.int(0, 9) : whole;
      return decimal(units * 10 ** places + rng.int(1, 10 ** places - 1), places);
    };
    const values = distinct(difficulty2 < 4 ? 4 : 5, draw, formatDecimal);
    const direction = rng.pick(["ascending", "descending"]);
    return {
      ...orderFields(values.map(formatDecimal), values, direction, {
        "decimals-as-integers": [rankBy(values.map(formatDecimal).map(afterCommaKey), direction)]
      }),
      hint: "Compare la partie enti\xE8re, puis les dixi\xE8mes, puis les centi\xE8mes. Ajouter des z\xE9ros \xE0 la fin ne change rien."
    };
  }
});

// src/generators/cm1/division-euclidienne.ts
var DIVISORS = { 1: [2, 5], 2: [2, 9], 3: [3, 9], 4: [6, 9], 5: [11, 25] };
var division_euclidienne_default = defineGenerator({
  skill: "cm1.division-euclidienne",
  generate(rng, difficulty2) {
    const [min, max] = DIVISORS[difficulty2];
    const divisor = rng.int(min, max);
    const quotient = rng.pick(range(3, difficulty2 * 8, divisor));
    const remainder = rng.int(difficulty2 === 1 ? 0 : 1, divisor - 1);
    const dividend = formatNumber(divisor * quotient + remainder);
    const asked = rng.pick(["reste", "quotient"]);
    const answer = asked === "reste" ? remainder : quotient;
    return {
      type: "numeric",
      prompt: `Quel est le ${asked} de la division de ${dividend} par ${divisor} ?`,
      check: `${asked}(${dividend}, ${divisor})`,
      answer: rational(answer),
      mistakes: { "quotient-remainder": [rational(asked === "reste" ? quotient : remainder)] },
      hint: `Cherche le plus grand multiple de ${divisor} qui ne d\xE9passe pas ${dividend}.`,
      explanation: [
        `${dividend} = ${divisor} \xD7 ${quotient} + ${remainder}`,
        `Le ${asked} est ${answer}.`
      ]
    };
  }
});

// src/generators/cm1/fractions-droite-graduee.ts
var DENS = {
  1: [2, 3, 4],
  2: [3, 4, 5],
  3: [4, 5, 6, 8, 10],
  4: [3, 4, 5, 6, 8],
  5: [3, 4, 6, 8, 10]
};
var fractions_droite_graduee_default = defineGenerator({
  skill: "cm1.fractions-droite-graduee",
  generate(rng, difficulty2) {
    const units = difficulty2 >= 4 ? difficulty2 - 2 : 1;
    const fractions = DENS[difficulty2].flatMap((d) => range(1, d * units - 1).map((k) => [k, d]));
    const [num = 1, den = 2] = rng.pick(fractions.filter(([k = 0, d = 1]) => k % d !== 0));
    return {
      type: "number-line",
      min: rational(0),
      max: rational(units),
      step: rational(1, den),
      target: `${num}/${den}`,
      answer: rational(num, den),
      mistakes: { "off-by-one-graduation": [rational(num - 1, den), rational(num + 1, den)] },
      prompt: `Place ${num}/${den} sur la droite gradu\xE9e.`,
      hint: `L\u2019unit\xE9 est partag\xE9e en ${den} parts \xE9gales : chaque graduation vaut 1/${den}.`,
      explanation: [`${num}/${den}, c\u2019est ${num} graduations de 1/${den} apr\xE8s 0.`]
    };
  }
});

// src/generators/cm1/nombres-decimaux.ts
var nombres_decimaux_default = defineGenerator({
  skill: "cm1.nombres-decimaux",
  generate(rng, difficulty2) {
    const units = rng.int(difficulty2 === 1 ? 1 : 0, difficulty2 < 3 ? 9 : 99);
    const tenths = rng.int(difficulty2 >= 4 ? 0 : 1, 9);
    const hundredths = difficulty2 === 1 ? 0 : rng.int(1, 9);
    const parts = [
      [units, "unit\xE9", ""],
      [tenths, "dixi\xE8me", "dixiemes"],
      [hundredths, "centi\xE8me", "centiemes"]
    ];
    const shown = parts.filter(([count]) => count > 0);
    const words = shown.map(([count, name]) => plural(count, name));
    const answer = decimal(units * 100 + tenths * 10 + hundredths, 2);
    return {
      type: "numeric",
      prompt: `\xC9cris ce nombre avec une virgule : ${list(words)}.`,
      check: shown.map(([count, , fn]) => fn ? `${fn}(${count})` : `${count}`).join(" + "),
      answer,
      mistakes: {
        // 3 units and 5 hundredths written 3,5, or tenths and hundredths swapped.
        "decimal-place-value": [
          decimal(units * 10 + hundredths, 1),
          decimal(units * 100 + hundredths * 10 + tenths, 2)
        ]
      },
      forms: ["decimal"],
      hint: "Les dixi\xE8mes s\u2019\xE9crivent juste apr\xE8s la virgule, puis viennent les centi\xE8mes.",
      explanation: [`${list(words)} : ${formatDecimal(answer)}`]
    };
  }
});

// src/generators/cm1/perimetre.ts
var MAX3 = { 1: 10, 2: 20, 3: 50, 4: 99, 5: 250 };
var perimetre_default = defineGenerator({
  skill: "cm1.perimetre",
  generate(rng, difficulty2) {
    const length = rng.int(3, MAX3[difficulty2]);
    const width = rng.int(2, length - 1);
    const square = rng.chance(0.3);
    const [l, w] = [formatNumber(length), formatNumber(width)];
    return {
      type: "numeric",
      prompt: square ? `Quel est le p\xE9rim\xE8tre d\u2019un carr\xE9 de ${l} cm de c\xF4t\xE9 ?` : `Quel est le p\xE9rim\xE8tre d\u2019un rectangle de ${l} cm de longueur et ${w} cm de largeur ?`,
      check: square ? `perimetre_carre(${l})` : `perimetre_rectangle(${l}, ${w})`,
      answer: rational(square ? 4 * length : 2 * (length + width)),
      mistakes: {
        "area-perimeter": [rational(square ? length * length : length * width)],
        "half-perimeter": [rational(square ? 2 * length : length + width)]
      },
      unit: "cm",
      hint: "Le p\xE9rim\xE8tre, c\u2019est la longueur du tour de la figure.",
      explanation: [
        square ? `${l} + ${l} + ${l} + ${l} = ${formatNumber(4 * length)} cm` : `${l} + ${w} + ${l} + ${w} = ${formatNumber(2 * (length + width))} cm`
      ]
    };
  }
});

// src/generators/cm1/proportionnalite.ts
var ITEMS = ["cahier", "croissant", "ballon", "stylo", "livre"];
var proportionnalite_default = defineGenerator({
  skill: "cm1.proportionnalite",
  generate(rng, difficulty2) {
    const item = rng.pick(ITEMS);
    const price = rng.int(2, difficulty2 < 3 ? 5 : 12);
    const first = rng.int(2, difficulty2 < 4 ? 5 : 9);
    const second = rng.pick(range(2, difficulty2 < 3 ? 10 : 20, first));
    const total = formatNumber(first * price);
    return {
      type: "numeric",
      prompt: `${first} ${item}s co\xFBtent ${total} \u20AC. Combien co\xFBtent ${second} ${item}s ?`,
      check: `${total} \xF7 ${first} \xD7 ${second}`,
      answer: rational(second * price),
      mistakes: {
        "additive-reasoning": [rational(first * price + second - first)],
        "skips-unit-price": [rational(first * price * second)]
      },
      unit: "\u20AC",
      hint: `Cherche d\u2019abord le prix d\u2019un seul ${item}.`,
      explanation: [
        `1 ${item} co\xFBte ${total} \xF7 ${first} = ${price} \u20AC.`,
        `${second} ${item}s co\xFBtent ${second} \xD7 ${price} = ${formatNumber(second * price)} \u20AC.`
      ]
    };
  }
});

// src/generators/cm2/addition-soustraction-decimaux.ts
var PLACES = { 1: [1, 1], 2: [1, 2], 3: [2, 2], 4: [0, 2], 5: [3, 1] };
var addition_soustraction_decimaux_default = defineGenerator({
  skill: "cm2.addition-soustraction-decimaux",
  generate(rng, difficulty2) {
    const max = difficulty2 < 3 ? 99 : 999;
    const draw = (places) => decimal(rng.int(10 ** places, max * 10 ** places), places);
    const [x, y] = PLACES[difficulty2].map(draw);
    const operator = difficulty2 >= 3 && rng.chance(0.5) ? "\u2212" : "+";
    const [a, b] = operator === "\u2212" && compare(x, y) < 0 ? [y, x] : [x, y];
    const answer = operator === "\u2212" ? sub(a, b) : add(a, b);
    return {
      type: "numeric",
      prompt: `${formatNumber(a)} ${operator} ${formatNumber(b)} = ?`,
      check: `${formatNumber(a)} ${operator} ${formatNumber(b)}`,
      answer,
      mistakes: { "misaligned-commas": [operator === "+" ? misalignedSum(a, b) : void 0] },
      hint: "Pose l\u2019op\xE9ration en alignant les virgules. Tu peux compl\xE9ter avec des z\xE9ros.",
      explanation: [
        "On aligne les virgules, puis on calcule comme avec des entiers.",
        `${formatNumber(a)} ${operator} ${formatNumber(b)} = ${formatNumber(answer)}`
      ]
    };
  }
});

// src/generators/cm2/aire-rectangle.ts
var SIDES = { 1: [2, 9], 2: [3, 12], 3: [5, 25], 4: [10, 60], 5: [12, 120] };
var aire_rectangle_default = defineGenerator({
  skill: "cm2.aire-rectangle",
  generate(rng, difficulty2) {
    const [min, max] = SIDES[difficulty2];
    const unit = rng.pick(["cm", "m"]);
    const length = rng.int(min + 1, max);
    const width = rng.int(min, length - 1);
    const square = rng.chance(0.25);
    const [l, w] = [formatNumber(length), formatNumber(width)];
    return {
      type: "numeric",
      prompt: square ? `Quelle est l\u2019aire d\u2019un carr\xE9 de ${l} ${unit} de c\xF4t\xE9 ?` : `Quelle est l\u2019aire d\u2019un rectangle de ${l} ${unit} sur ${w} ${unit} ?`,
      check: square ? `aire_carre(${l})` : `aire_rectangle(${l}, ${w})`,
      answer: rational(square ? length * length : length * width),
      mistakes: {
        "area-perimeter": [rational(square ? 4 * length : 2 * (length + width))],
        "adds-instead-of-multiplying": [rational(square ? 2 * length : length + width)]
      },
      unit: `${unit}\xB2`,
      hint: "L\u2019aire d\u2019un rectangle, c\u2019est la longueur multipli\xE9e par la largeur.",
      explanation: [
        square ? `${l} \xD7 ${l} = ${formatNumber(length * length)} ${unit}\xB2` : `${l} \xD7 ${w} = ${formatNumber(length * width)} ${unit}\xB2`
      ]
    };
  }
});

// src/generators/cm2/expressions-inconnue.ts
var OPPOSITE = { "+": "\u2212", "\u2212": "+", "\xD7": "\xF7", "\xF7": "\xD7" };
var expressions_inconnue_default = defineGenerator({
  skill: "cm2.expressions-inconnue",
  generate(rng, difficulty2) {
    const operator = rng.pick(
      difficulty2 < 3 ? ["+", "\u2212"] : ["+", "\u2212", "\xD7", "\xF7"]
    );
    const additive = operator === "+" || operator === "\u2212";
    const [x, y] = [rng.int(2, additive ? 25 * difficulty2 : 9 + difficulty2), rng.int(2, 12)];
    const combined = additive ? x + y : x * y;
    const [a, b, c] = operator === "\u2212" || operator === "\xF7" ? [combined, y, x] : [x, y, combined];
    const hideA = rng.chance(0.5);
    const backwards = operator === "\u2212" || operator === "\xF7";
    return {
      type: "numeric",
      prompt: `Quel nombre manque ? ${hideA ? "?" : formatNumber(a)} ${operator} ${hideA ? formatNumber(b) : "?"} = ${formatNumber(c)}`,
      check: hideA || !backwards ? `${formatNumber(c)} ${OPPOSITE[operator]} ${formatNumber(hideA ? b : a)}` : `${formatNumber(a)} ${operator} ${formatNumber(c)}`,
      answer: rational(hideA ? a : b),
      mistakes: {
        // The other operation on the same two numbers: 12 + 7 for ? + 7 = 12.
        "inverse-operation": [
          hideA || !backwards ? calc(operator, rational(c), rational(hideA ? b : a)) : calc(OPPOSITE[operator], rational(a), rational(c))
        ]
      },
      hint: "Utilise l\u2019op\xE9ration inverse pour retrouver le nombre manquant.",
      explanation: [`${formatNumber(a)} ${operator} ${formatNumber(b)} = ${formatNumber(c)}, donc il manque ${formatNumber(hideA ? a : b)}.`]
    };
  }
});

// src/generators/cm2/fractions-addition-meme-denominateur.ts
var fractions_addition_meme_denominateur_default = defineGenerator({
  skill: "cm2.fractions-addition-meme-denominateur",
  generate(rng, difficulty2) {
    const den = rng.int(3, difficulty2 < 3 ? 9 : 12);
    const limit = difficulty2 < 3 ? den - 1 : 2 * den;
    const a = rng.pick(range(1, limit - 1));
    const b = rng.pick(range(1, limit - a));
    const subtract = difficulty2 >= 3 && a !== b && rng.chance(0.5);
    const [first, second] = subtract && a < b ? [b, a] : [a, b];
    const operator = subtract ? "\u2212" : "+";
    const resultNum = subtract ? first - second : first + second;
    const expression = `${formatFraction(first, den)} ${operator} ${formatFraction(second, den)}`;
    return {
      type: "numeric",
      prompt: `${expression} = ?`,
      check: expression,
      answer: rational(resultNum, den),
      mistakes: { "adds-denominators": [subtract ? void 0 : rational(resultNum, 2 * den)] },
      display: "fraction",
      hint: "Les d\xE9nominateurs sont les m\xEAmes : regarde seulement les num\xE9rateurs.",
      explanation: [
        `${first} ${operator} ${second} = ${resultNum}, donc ${expression} = ${formatFraction(resultNum, den)}.`
      ]
    };
  }
});

// src/generators/cm2/fractions-decimaux-equivalences.ts
var DENS2 = { 1: [10], 2: [10, 100], 3: [10, 100, 2, 4], 4: [100, 4, 5, 20], 5: [1e3, 4, 5, 25] };
var fractions_decimaux_equivalences_default = defineGenerator({
  skill: "cm2.fractions-decimaux-equivalences",
  generate(rng, difficulty2) {
    const fractions = DENS2[difficulty2].flatMap((den) => range(1, den - 1).map((num) => [num, den]));
    const count = difficulty2 < 3 ? 3 : 4;
    const picked = distinct(
      count,
      () => rng.pick(fractions),
      ([num = 0, den = 1]) => num / den
    );
    const left = picked.map(([num = 0, den = 1]) => formatFraction(num, den));
    const values = picked.map(([num = 0, den = 1]) => formatDecimal(rational(num, den)));
    const right = rng.shuffle(values);
    return {
      type: "match",
      left,
      right,
      answer: values.map((value) => right.indexOf(value)),
      mistakes: {
        // 3/10 matched with 0,03 and 3/100 with 0,3.
        "tenths-hundredths": [
          swapTenths(
            picked,
            values.map((value) => right.indexOf(value))
          )
        ]
      },
      prompt: "Relie chaque fraction \xE0 son \xE9criture d\xE9cimale.",
      hint: "1/10 s\u2019\xE9crit 0,1 et 1/100 s\u2019\xE9crit 0,01. Pour 1/4 ou 1/5, pense \xE0 des centi\xE8mes.",
      explanation: [left.map((label, index) => `${label} = ${values[index]}`).join(" ; ")]
    };
  }
});

// src/generators/cm2/multiples-diviseurs.ts
var DIVISORS2 = { 1: [2, 5, 10], 2: [2, 5, 10], 3: [2, 3, 5, 9, 10], 4: [3, 9], 5: [3, 4, 6, 9] };
var SENTENCES = [
  (value, divisor) => `${value} est un multiple de ${divisor}.`,
  (value, divisor) => `${value} est divisible par ${divisor}.`,
  (value, divisor) => `${divisor} est un diviseur de ${value}.`
];
var multiples_diviseurs_default = defineGenerator({
  skill: "cm2.multiples-diviseurs",
  generate(rng, difficulty2) {
    const divisor = rng.pick(DIVISORS2[difficulty2]);
    const quotient = rng.int(4, difficulty2 < 3 ? 30 : 300);
    const remainder = rng.chance(0.5) ? 0 : rng.pick(range(1, divisor - 1));
    const value = formatNumber(divisor * quotient + remainder);
    return {
      type: "true-false",
      prompt: `Vrai ou faux ? ${rng.pick(SENTENCES)(value, divisor)}`,
      check: `multiple(${value}, ${divisor})`,
      answer: remainder === 0,
      mistakes: {
        // For 3 and 9 the last digit says nothing: 23 is no multiple of 3, 27 is.
        "last-digit-rule": [
          divisor === 3 || divisor === 9 ? endsLikeMultiple(divisor * quotient + remainder, divisor) : void 0
        ]
      },
      hint: `Essaie de diviser ${value} par ${divisor} : y a-t-il un reste ?`,
      explanation: [
        `${value} = ${divisor} \xD7 ${formatNumber(quotient)} + ${remainder}`,
        remainder === 0 ? "Il ne reste rien : c\u2019est vrai." : `Il reste ${remainder} : c\u2019est faux.`
      ]
    };
  }
});

// src/generators/cm2/pourcentages.ts
var PERCENTS = {
  1: [50, 10],
  2: [50, 25, 10],
  3: [10, 20, 25, 50, 75],
  4: [5, 15, 30, 40, 60],
  5: [12, 35, 45, 65, 80]
};
var pourcentages_default = defineGenerator({
  skill: "cm2.pourcentages",
  generate(rng, difficulty2) {
    const percent2 = rng.pick(PERCENTS[difficulty2]);
    const quantity = 100 / gcd2(percent2, 100) * rng.int(1, difficulty2 < 3 ? 10 : 30);
    const answer = percent2 * quantity / 100;
    return {
      type: "numeric",
      prompt: `Combien font ${percent2} % de ${formatNumber(quantity)} ?`,
      check: `${percent2} % \xD7 ${formatNumber(quantity)}`,
      answer: rational(answer),
      mistakes: {
        "percent-subtract": [quantity > percent2 ? rational(quantity - percent2) : void 0],
        "percent-hundred": [rational(percent2 * quantity)]
      },
      hint: percent2 === 50 ? "Prendre 50 %, c\u2019est prendre la moiti\xE9." : `${percent2} %, c\u2019est ${percent2} pour 100.`,
      explanation: [`${formatNumber(quantity)} \xD7 ${percent2} \xF7 100 = ${formatNumber(answer)}`]
    };
  }
});

// src/generators/sixieme/angles-degres.ts
var NATURES = ["aigu", "droit", "obtus", "plat"];
var REASONS = {
  aigu: (measure) => `${measure}\xB0 est moins que 90\xB0`,
  droit: () => "Il mesure exactement 90\xB0",
  obtus: (measure) => `${measure}\xB0 est entre 90\xB0 et 180\xB0`,
  plat: () => "Il mesure exactement 180\xB0"
};
var angles_degres_default = defineGenerator({
  skill: "6e.angles-degres",
  generate(rng, difficulty2) {
    const near = Math.min(180, rng.pick([90, 180]) + rng.int(-6 * difficulty2, 6));
    const spread = difficulty2 === 1 ? rng.pick([30, 45, 60, 90, 120, 135, 150, 180]) : 10 * rng.int(1, 18);
    const measure = difficulty2 < 3 ? spread : near;
    const nature = measure < 90 ? "aigu" : measure === 90 ? "droit" : measure < 180 ? "obtus" : "plat";
    return {
      type: "choice",
      prompt: `Un angle mesure ${measure}\xB0. Cet angle est :`,
      options: NATURES.map((label) => ({ label, check: `${label}(${measure})` })),
      answer: NATURES.indexOf(nature),
      mistakes: {
        "acute-obtuse": [{ aigu: 2, obtus: 0, droit: void 0, plat: void 0 }[nature]]
      },
      hint: "Compare la mesure \xE0 90\xB0 (angle droit) et \xE0 180\xB0 (angle plat).",
      explanation: [`${REASONS[nature](measure)} : l\u2019angle est ${nature}.`]
    };
  }
});

// src/generators/sixieme/fraction-d-une-quantite.ts
var DENS3 = {
  1: [2, 3, 4],
  2: [2, 3, 4, 5],
  3: [3, 4, 5, 6],
  4: [4, 5, 6, 8, 10],
  5: [6, 7, 8, 9, 12]
};
var fraction_d_une_quantite_default = defineGenerator({
  skill: "6e.fraction-d-une-quantite",
  generate(rng, difficulty2) {
    const den = rng.pick(DENS3[difficulty2]);
    const num = difficulty2 < 3 ? 1 : rng.int(2, den - 1);
    const part = rng.int(2, difficulty2 < 4 ? 10 : 25);
    const quantity = den * part;
    return {
      type: "numeric",
      prompt: `Combien font ${num}/${den} de ${formatNumber(quantity)} ?`,
      check: `${num}/${den} \xD7 ${formatNumber(quantity)}`,
      answer: rational(num * part),
      mistakes: { "divides-only": [rational(part)] },
      hint: `Partage d\u2019abord ${formatNumber(quantity)} en ${den} parts \xE9gales.`,
      explanation: [
        `${formatNumber(quantity)} \xF7 ${den} = ${formatNumber(part)}`,
        `${formatNumber(part)} \xD7 ${num} = ${formatNumber(num * part)}`
      ]
    };
  }
});

// src/generators/sixieme/nombres-premiers.ts
var MAX4 = { 1: 20, 2: 30, 3: 50, 4: 100, 5: 100 };
var nombres_premiers_default = defineGenerator({
  skill: "6e.nombres-premiers",
  generate(rng, difficulty2) {
    const numbers = range(4, MAX4[difficulty2]);
    const composites = numbers.filter((x) => !isPrime(x) && (difficulty2 < 4 || x % 2 === 1));
    const prime = rng.pick(numbers.filter(isPrime));
    const options = rng.shuffle([prime, ...rng.sample(composites, 3)]);
    const others = options.filter((x) => x !== prime);
    return {
      type: "choice",
      prompt: "Lequel de ces nombres est premier ?",
      options: options.map((x) => ({ label: String(x), check: `premier(${x})` })),
      answer: options.indexOf(prime),
      mistakes: {
        "odd-is-prime": options.map((x, i) => x % 2 === 1 && x !== prime ? i : void 0)
      },
      hint: "Un nombre premier a exactement deux diviseurs : 1 et lui-m\xEAme.",
      explanation: [
        `${prime} n\u2019est divisible que par 1 et par lui-m\xEAme.`,
        others.map((x) => `${x} = ${smallestFactor(x)} \xD7 ${x / smallestFactor(x)}`).join(" ; ")
      ]
    };
  }
});

// src/generators/sixieme/priorites-operatoires.ts
var TEMPLATES = [
  (a, b, c) => [`${a} + ${b} \xD7 ${c}`, a + b * c, `${b} \xD7 ${c} = ${b * c}`],
  (a, b, c) => [`${a * b + c} \u2212 ${a} \xD7 ${b}`, c, `${a} \xD7 ${b} = ${a * b}`],
  (a, b, c) => [`(${a} + ${b}) \xD7 ${c}`, (a + b) * c, `${a} + ${b} = ${a + b}`],
  (a, b, c) => [
    `${a * c} \xF7 ${c} + ${b} \xD7 ${c}`,
    a + b * c,
    `${a * c} \xF7 ${c} = ${a} et ${b} \xD7 ${c} = ${b * c}`
  ],
  (a, b, c) => [`${a} \xD7 (${b + c} \u2212 ${c}) \u2212 ${b}`, a * b - b, `${b + c} \u2212 ${c} = ${b}`]
];
var priorites_operatoires_default = defineGenerator({
  skill: "6e.priorites-operatoires",
  generate(rng, difficulty2) {
    const template = rng.pick(TEMPLATES.slice(0, difficulty2));
    const [expression, value, first] = template(rng.int(2, 12), rng.int(2, 9), rng.int(2, 9));
    return {
      type: "numeric",
      prompt: `Calcule : ${expression}`,
      check: expression,
      answer: rational(value),
      mistakes: { "left-to-right": [leftToRight(expression)] },
      hint: "Les parenth\xE8ses d\u2019abord, puis les multiplications et les divisions, puis les additions et les soustractions.",
      explanation: [`On commence par ${first}.`, `${expression} = ${formatNumber(value)}`]
    };
  }
});

// src/generators/sixieme/probabilites.ts
var COLORS = ["rouges", "bleues", "vertes", "jaunes"];
var probabilites_default = defineGenerator({
  skill: "6e.probabilites",
  generate(rng, difficulty2) {
    const colors = rng.sample(COLORS, difficulty2 < 3 ? 2 : 3);
    const counts = colors.map(() => rng.int(2, difficulty2 < 4 ? 6 : 12));
    const target = rng.int(0, colors.length - 1);
    const total = counts.reduce((sum, count) => sum + count, 0);
    const favourable = counts[target] ?? 0;
    const content = colors.map((color, index) => `${counts[index]} boules ${color}`);
    return {
      type: "numeric",
      prompt: `Un sac contient ${list(content)}. On tire une boule au hasard. Quelle est la probabilit\xE9 qu\u2019elle soit ${colors[target]?.slice(0, -1)} ?`,
      check: `${favourable} \xF7 (${counts.join(" + ")})`,
      answer: rational(favourable, total),
      mistakes: { "favourable-over-others": [rational(favourable, total - favourable)] },
      display: "fraction",
      hint: "Probabilit\xE9 = nombre de cas favorables \xF7 nombre total de cas.",
      explanation: [
        `Il y a ${total} boules, dont ${favourable} ${colors[target]}.`,
        `La probabilit\xE9 est ${formatFraction(favourable, total)}.`
      ]
    };
  }
});

// src/generators/sixieme/proportionnalite.ts
var proportionnalite_default2 = defineGenerator({
  skill: "6e.proportionnalite",
  generate(rng, difficulty2) {
    const coefficient = difficulty2 < 4 ? rational(rng.int(2, 3 + 2 * difficulty2)) : decimal(rng.int(1, 9) * 10 + 5, 1);
    const first = rng.pick(range(2, 12).filter((x) => mul(coefficient, rational(x)).den === 1));
    const second = rng.pick(
      range(2, difficulty2 < 3 ? 12 : 30, first).filter((x) => mul(coefficient, rational(x)).den === 1)
    );
    const [y1, answer] = [mul(coefficient, rational(first)), mul(coefficient, rational(second))];
    return {
      type: "numeric",
      prompt: `Dans ce tableau de proportionnalit\xE9, ${first} correspond \xE0 ${formatNumber(y1)}. \xC0 quoi correspond ${second} ?`,
      check: `${formatNumber(y1)} \xF7 ${first} \xD7 ${second}`,
      answer,
      mistakes: { "additive-reasoning": [add(y1, rational(second - first))] },
      hint: "Cherche par combien il faut multiplier la premi\xE8re ligne pour obtenir la seconde.",
      explanation: [
        `${formatNumber(y1)} \xF7 ${first} = ${formatNumber(coefficient)}`,
        `${second} \xD7 ${formatNumber(coefficient)} = ${formatNumber(answer)}`
      ]
    };
  }
});

// src/generators/cinquieme/fractions-addition.ts
var fractions_addition_default = defineGenerator({
  skill: "5e.fractions-addition",
  generate(rng, difficulty2) {
    const den = rng.int(2, difficulty2 < 3 ? 5 : 9);
    const big = den * rng.int(2, difficulty2 < 3 ? 3 : 4);
    const [a, b] = [rng.int(1, 2 * den - 1), rng.int(1, 2 * big - 1)];
    const minus = difficulty2 >= 3 && a * big > b * den && rng.chance(0.5);
    const [operator, scaled] = [minus ? "\u2212" : "+", a * big / den];
    const answer = (minus ? sub : add)(rational(a, den), rational(b, big));
    const expression = `${formatFraction(a, den)} ${operator} ${formatFraction(b, big)}`;
    const simplified = answer.den === big ? "" : ` = ${formatFraction(answer.num, answer.den)}`;
    const ask = difficulty2 === 5 ? "Donne le r\xE9sultat sous forme irr\xE9ductible : " : "";
    return {
      type: "numeric",
      prompt: ask ? `${ask}${expression}` : `${expression} = ?`,
      check: expression,
      answer,
      mistakes: {
        "adds-denominators": [minus ? void 0 : rational(a + b, den + big)],
        "same-denominator": [rational(minus ? a - b : a + b, big)]
      },
      display: "fraction",
      ...difficulty2 === 5 && { forms: ["fraction", "integer"], irreducible: true },
      hint: `\xC9cris ${formatFraction(a, den)} avec le d\xE9nominateur ${big}.`,
      explanation: [
        `${formatFraction(a, den)} = ${formatFraction(scaled, big)}`,
        `${formatFraction(scaled, big)} ${operator} ${formatFraction(b, big)} = ${formatFraction(minus ? scaled - b : scaled + b, big)}${simplified}`
      ]
    };
  }
});

// src/generators/cinquieme/puissances-de-10.ts
var puissances_de_10_default = defineGenerator({
  skill: "5e.puissances-de-10",
  generate(rng, difficulty2) {
    const exponent = rng.int(2, difficulty2 === 2 ? 4 : 7);
    const factor = [rational(1), rational(rng.int(2, 9))][difficulty2 - 1] ?? decimal(rng.int(11, 999), rng.int(1, 3));
    const shown = difficulty2 === 1 ? power(10, exponent) : `${formatDecimal(factor)} \xD7 ${power(10, exponent)}`;
    const answer = mul(factor, rational(10 ** exponent));
    return {
      type: "numeric",
      prompt: `\xC9cris sans puissance : ${shown}`,
      check: difficulty2 === 1 ? `10^${exponent}` : `${formatDecimal(factor)} \xD7 10^${exponent}`,
      answer,
      mistakes: {
        "zeros-count": [mul(factor, rational(10 ** (exponent - 1))), mul(factor, rational(10 ** (exponent + 1)))],
        "exponent-times-ten": [difficulty2 === 1 ? rational(10 * exponent) : void 0]
      },
      hint: `${power(10, exponent)}, c\u2019est 1 suivi de ${exponent} z\xE9ros.`,
      explanation: [
        `${power(10, exponent)} = ${formatNumber(10 ** exponent)}`,
        ...difficulty2 > 1 ? [`${shown} = ${formatNumber(answer)}`] : []
      ]
    };
  }
});

// src/generators/cinquieme/relatifs-addition-soustraction.ts
var relatifs_addition_soustraction_default = defineGenerator({
  skill: "5e.relatifs-addition-soustraction",
  generate(rng, difficulty2) {
    const max = [10, 10, 30, 50, 99][difficulty2 - 1] ?? 10;
    const draw = () => rng.pick([-1, 1]) * rng.int(1, max);
    const terms = difficulty2 >= 4 ? [draw(), draw(), draw()] : [draw(), draw()];
    const operators = terms.slice(1).map(() => difficulty2 >= 2 && rng.chance(0.5) ? "\u2212" : "+");
    const expression = terms.map((term, i) => i === 0 ? formatOperand(term) : `${operators[i - 1]} ${formatOperand(term)}`).join(" ");
    const value = chain(terms, operators);
    const rule = operators.includes("\u2212") ? "Soustraire, c\u2019est ajouter l\u2019oppos\xE9." : "On additionne en tenant compte des signes.";
    return {
      type: "numeric",
      prompt: `${expression} = ?`,
      check: expression,
      answer: rational(value),
      mistakes: {
        // − (−3) taken as − 3; or the right size with the wrong sign.
        "subtract-negative": [rational(chain(terms, operators, true))],
        "sign-error": [rational(-value)]
      },
      hint: "Soustraire un nombre, c\u2019est ajouter son oppos\xE9.",
      explanation: [rule, `${expression} = ${formatNumber(value)}`]
    };
  }
});

// src/generators/cinquieme/tester-egalite.ts
var tester_egalite_default = defineGenerator({
  skill: "5e.tester-egalite",
  generate(rng, difficulty2) {
    const [a, b] = [rng.int(2, 9), rng.int(1, 5 * difficulty2)];
    const x = rng.int(difficulty2 < 3 ? 1 : -9, 9) || 1;
    const value = a * x + b;
    const truth = rng.chance(0.5);
    const right = truth ? value : value + rng.pick([-2, -1, 1, 2]);
    return {
      type: "true-false",
      prompt: `L\u2019\xE9galit\xE9 ${a}x + ${b} = ${formatNumber(right)} est-elle vraie pour x = ${formatNumber(x)} ?`,
      check: `${a} \xD7 ${formatOperand(x)} + ${b} = ${formatOperand(right)}`,
      answer: truth,
      hint: `Remplace x par ${formatNumber(x)}, puis calcule le membre de gauche.`,
      explanation: [
        `${a} \xD7 ${formatOperand(x)} + ${b} = ${formatNumber(value)}`,
        truth ? `On trouve bien ${formatNumber(right)} : l\u2019\xE9galit\xE9 est vraie.` : `${formatNumber(value)} n\u2019est pas \xE9gal \xE0 ${formatNumber(right)} : l\u2019\xE9galit\xE9 est fausse.`
      ]
    };
  }
});

// src/generators/index.ts
var generators = [
  // CE2
  addition_posee_default,
  comparer_ranger_nombres_default,
  doubles_moities_default,
  fractions_unitaires_default,
  longueurs_conversions_default,
  multiplication_posee_default,
  tables_multiplication_default,
  // CM1
  comparer_decimaux_default,
  division_euclidienne_default,
  fractions_droite_graduee_default,
  nombres_decimaux_default,
  perimetre_default,
  proportionnalite_default,
  // CM2
  addition_soustraction_decimaux_default,
  aire_rectangle_default,
  expressions_inconnue_default,
  fractions_addition_meme_denominateur_default,
  fractions_decimaux_equivalences_default,
  multiples_diviseurs_default,
  pourcentages_default,
  // 6e
  angles_degres_default,
  fraction_d_une_quantite_default,
  nombres_premiers_default,
  priorites_operatoires_default,
  probabilites_default,
  proportionnalite_default2,
  // 5e
  fractions_addition_default,
  puissances_de_10_default,
  relatifs_addition_soustraction_default,
  tester_egalite_default
];

// src/adaptive/placement.ts
var AGREE = 2;
function placementRungs(strand, childGrade, generators2 = generators) {
  const own = gradeRank(childGrade);
  const withGenerator = new Set(generators2.map((generator) => generator.skill));
  const byRank = /* @__PURE__ */ new Map();
  for (const skill of skills) {
    const rank = gradeRank(skill.grade);
    if (skill.strand !== strand || !withGenerator.has(skill.code) || rank > own + 1) continue;
    byRank.set(rank, [...byRank.get(rank) ?? [], skill]);
  }
  const rungs = [...byRank.entries()].sort(([a], [b]) => a - b).map(([rank, list2]) => {
    const grade2 = list2[0]?.grade ?? childGrade;
    const difficulty2 = rank === own ? 2 : 3;
    const codes = list2.map((skill) => skill.code).filter(isSkillCode);
    return { rank, grade: grade2, difficulty: difficulty2, skills: codes };
  });
  const lowest = rungs[0];
  if (!lowest || lowest.rank > own) return [];
  if (lowest.rank === own) rungs.unshift({ ...lowest, rank: own - 1, difficulty: 1 });
  return rungs;
}
var rungOf = (rungs, answer) => {
  const grade2 = isSkillCode(answer.skill) ? getSkill(answer.skill).grade : null;
  return rungs.findIndex((rung) => rung.grade === grade2 && rung.difficulty === answer.difficulty);
};
var verdictOf = (answers = []) => {
  const right = answers.filter(Boolean).length;
  if (right >= AGREE) return "passed";
  if (answers.length - right >= AGREE) return "failed";
  return "open";
};
function currentRung(rungs, answers, own) {
  if (rungs.length === 0) return null;
  let index = rungs.reduce((start, rung, i) => rung.rank <= own ? i : start, 0);
  for (; ; ) {
    const verdict2 = verdictOf(answers[index]);
    if (verdict2 === "open") return index;
    const next = index + (verdict2 === "passed" ? 1 : -1);
    const nextVerdict = verdictOf(answers[next]);
    if (next < 0 || next >= rungs.length) return null;
    if (verdict2 === "passed" ? nextVerdict === "failed" : nextVerdict === "passed") return null;
    index = next;
  }
}
function placementState(childGrade, attempts, generators2 = generators) {
  const own = gradeRank(childGrade);
  return STRANDS.map((strand) => {
    const rungs = placementRungs(strand, childGrade, generators2);
    const answers = rungs.map(() => []);
    for (const attempt of attempts) {
      if (!isSkillCode(attempt.skill) || getSkill(attempt.skill).strand !== strand) continue;
      answers[rungOf(rungs, attempt)]?.push(attempt.correct);
    }
    return { strand, rungs, answers, current: currentRung(rungs, answers, own) };
  });
}
function levelOf(placedRank, own) {
  if (placedRank > own) return "ahead";
  return placedRank >= own - 1 ? "on_track" : "to_consolidate";
}
function strandResult(state, own) {
  const answered = state.answers.flat().length;
  if (state.rungs.length === 0 || answered === 0) {
    return { strand: state.strand, level: null, placedRank: null, answered };
  }
  const verdicts = state.answers.map(verdictOf);
  const passed = state.rungs.filter((_, i) => verdicts[i] === "passed").map((rung) => rung.rank);
  const failed = state.rungs.filter((_, i) => verdicts[i] === "failed").map((rung) => rung.rank);
  const start = state.rungs.reduce((rank, rung) => rung.rank <= own ? rung.rank : rank, 0);
  const placedRank = passed.length > 0 ? Math.max(...passed) : Math.min(start, ...failed) - 1;
  return { strand: state.strand, level: levelOf(placedRank, own), placedRank, answered };
}
function skillTallies(attempts) {
  const tallies = /* @__PURE__ */ new Map();
  for (const { skill, correct } of attempts) {
    const tally = tallies.get(skill) ?? { right: 0, wrong: 0 };
    tallies.set(
      skill,
      correct ? { ...tally, right: tally.right + 1 } : { ...tally, wrong: tally.wrong + 1 }
    );
  }
  return tallies;
}
function prerequisitesOf(code, into = /* @__PURE__ */ new Set()) {
  for (const prerequisite of getSkill(code).prerequisites) {
    if (!isSkillCode(prerequisite) || into.has(prerequisite)) continue;
    into.add(prerequisite);
    prerequisitesOf(prerequisite, into);
  }
  return into;
}
var earlierPrerequisites = (code) => {
  const rank = gradeRank(getSkill(code).grade);
  return [...prerequisitesOf(code)].filter((other) => gradeRank(getSkill(other).grade) < rank);
};
var PLACED_ELO = { acquired: 1450, next: 1150, beyond: 950 };
function conclude(context, attempts, at) {
  const { childGrade } = context;
  const own = gradeRank(childGrade);
  const generators2 = context.generators ?? generators;
  const states = placementState(childGrade, attempts, generators2);
  const results = states.map((state) => strandResult(state, own));
  const placedRank = new Map(results.map((result) => [result.strand, result.placedRank]));
  const tallies = skillTallies(attempts);
  const failed = (code) => {
    const tally = tallies.get(code);
    return tally !== void 0 && tally.wrong > tally.right;
  };
  const right = (code) => {
    const tally = tallies.get(code);
    return tally !== void 0 && tally.right > tally.wrong;
  };
  const required = /* @__PURE__ */ new Set();
  for (const [code] of tallies) {
    const skill = getSkill(code);
    const placed = placedRank.get(skill.strand) ?? null;
    if (right(code) && placed !== null && gradeRank(skill.grade) <= placed) {
      for (const prerequisite of earlierPrerequisites(code)) required.add(prerequisite);
    }
  }
  const withGenerator = new Set(generators2.map((generator) => generator.skill));
  const mastery = { ...context.mastery };
  const acquired = /* @__PURE__ */ new Set();
  for (const skill of skills) {
    if (!isSkillCode(skill.code)) continue;
    const code = skill.code;
    const rank = gradeRank(skill.grade);
    const placed = placedRank.get(skill.strand) ?? null;
    const tested = tallies.has(code);
    if (!withGenerator.has(code) || rank > own && !tested || placed === null && !tested) {
      continue;
    }
    const existing = context.mastery[code];
    const practised = existing !== void 0 && existing.attempts > 0;
    const guess = placed === null || rank <= placed ? PLACED_ELO.acquired : rank === placed + 1 ? PLACED_ELO.next : PLACED_ELO.beyond;
    let record = practised && existing ? existing : {
      elo: guess,
      attempts: 0,
      streak: 0,
      masteredAt: existing?.masteredAt ?? null,
      practicedAt: null
    };
    for (const attempt of attempts.filter((candidate) => candidate.skill === code)) {
      record = applyAnswer(record, {
        item: itemRating(context.itemRatings, attempt.generatorId, attempt.difficulty),
        correct: attempt.correct,
        at: attempt.answeredAt
      });
    }
    if (tested) record = closeSession(record, at);
    const known = !failed(code) && rank <= own && (required.has(code) || placed !== null && rank < own && rank <= placed && masteryOf(record, at) >= PRESUMED_THRESHOLD);
    if (known) {
      record = {
        ...record,
        elo: Math.max(record.elo, PLACED_ELO.acquired),
        masteredAt: record.masteredAt ?? at
      };
    }
    if (record.masteredAt) acquired.add(code);
    mastery[code] = record;
  }
  return { results, mastery, acquired, failed, own };
}
function placementResult(childGrade, attempts, at, generators2 = generators) {
  const { results, mastery, acquired, failed, own } = conclude(
    { childGrade, mastery: {}, itemRatings: {}, generators: generators2 },
    attempts,
    at
  );
  const open = (code) => getSkill(code).prerequisites.every(
    (prerequisite) => !isSkillCode(prerequisite) || !(prerequisite in mastery) || acquired.has(prerequisite)
  );
  const score = (code) => {
    const record = mastery[code];
    return record ? masteryOf(record, at) : 0;
  };
  const candidates = skills.map((skill) => skill.code).filter(isSkillCode).filter((code) => code in mastery && !acquired.has(code)).filter((code) => gradeRank(getSkill(code).grade) <= own && (failed(code) || open(code))).sort(
    (a, b) => Number(failed(b)) - Number(failed(a)) || gradeRank(getSkill(a).grade) - gradeRank(getSkill(b).grade) || score(a) - score(b)
  );
  const priorities = [];
  for (const code of candidates) {
    const strand = getSkill(code).strand;
    if (priorities.length < 3 && !priorities.some((other) => getSkill(other).strand === strand)) {
      priorities.push(code);
    }
  }
  for (const code of candidates) {
    if (priorities.length < 3 && !priorities.includes(code)) priorities.push(code);
  }
  return { strands: results, priorities };
}

// src/adaptive/session.ts
var MAX_GAP_MS = 12e4;

// src/adaptive/profile.ts
var PROFILE_WINDOW_DAYS = 30;
var MENTAL_FAST_MS = 4e3;
var MENTAL_MIN_ANSWERS = 20;
var MENTAL_MIN_RATE = 0.75;
var FLAWLESS_RUN = 30;
var SOLID_MASTERED = 2;
var PRACTISED_ANSWERS = 10;
var BEST_MASTERY = 50;
var RECURRENT_ERROR = 3;
var RECURRENT_SHARE = 0.3;
var STUCK_ANSWERS = 20;
var STUCK_MASTERY = 50;
var MAX_ITEMS = 3;
var ATTENTION_STRETCH = 5;
var ATTENTION_STRETCHES = 5;
var ATTENTION_MIN_ANSWERS = 100;
var ATTENTION_DROP = 0.12;
var MIN_SESSIONS = 5;
var TIME_MIN_ANSWERS = 100;
var TIME_GAP = 0.06;
var RUSHED_MS = 2e3;
var MIN_ERRORS = 10;
var RUSHED_SHARE = 0.3;
var GIVE_UP_SESSIONS = 2;
var GIVE_UP_SHARE = 0.25;
var ABANDONED_AFTER_MS = 864e5;
var MIN_TWINS = 5;
var DAY_MS2 = 864e5;
var MINUTE_MS = 6e4;
function learnerProfile(input) {
  const since = Date.parse(input.at) - PROFILE_WINDOW_DAYS * DAY_MS2;
  const recent = input.sessions.filter((session) => Date.parse(session.startedAt) >= since);
  const sessions = recent.filter((session) => session.kind !== "placement");
  const timed = sessions.flatMap((session) => timedAttempts(session, input.itemRatings ?? {}));
  const all = recent.flatMap((session) => session.attempts);
  const placement = lastPlacement(input);
  const records = Object.entries(input.mastery).filter(
    (entry) => isSkillCode(entry[0]) && entry[1] !== void 0
  );
  const status = (code) => {
    const record = input.mastery[code];
    return record ? masteryStatus(record, input.at) : "to_discover";
  };
  const practice = strandPractice(input, all);
  return {
    grade: input.childGrade,
    answers: all.length,
    mastered: records.filter(([code]) => status(code) === "mastered").length,
    inProgress: records.filter(([code]) => status(code) === "in_progress").length,
    strengths: strengthsOf(input, timed, placement, status, practice),
    weaknesses: weaknessesOf(input, all, placement, records, practice),
    style: styleOf(input, sessions, timed),
    computedAt: input.at
  };
}
function strandPractice(input, attempts) {
  const answers = /* @__PURE__ */ new Map();
  for (const { skill } of attempts) answers.set(skill, (answers.get(skill) ?? 0) + 1);
  const levels = /* @__PURE__ */ new Map();
  for (const [skill, count] of answers) {
    const record = input.mastery[skill];
    if (!record || count < PRACTISED_ANSWERS) continue;
    const { strand } = getSkill(skill);
    levels.set(strand, [...levels.get(strand) ?? [], masteryOf(record, input.at)]);
  }
  return (strand) => {
    const values = levels.get(strand);
    return values ? mean(values) : null;
  };
}
function lastPlacement(input) {
  const tests = input.sessions.filter((s) => s.kind === "placement" && s.completedAt && s.grade === input.childGrade).sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  const test = tests[0];
  if (!test?.completedAt) return null;
  return placementResult(input.childGrade, test.attempts, test.completedAt);
}
function strengthsOf(input, timed, placement, status, practice) {
  const own = gradeRank(input.childGrade);
  const ahead = new Set(
    placement?.strands.filter((s) => s.level === "ahead" && (practice(s.strand) ?? 100) >= PRESUMED_THRESHOLD).map((s) => s.strand) ?? []
  );
  const solid = /* @__PURE__ */ new Map();
  for (const code of Object.keys(input.mastery).filter(isSkillCode)) {
    if (status(code) !== "mastered") continue;
    const skill = getSkill(code);
    const rank = gradeRank(skill.grade);
    if (rank > own) ahead.add(skill.strand);
    if (rank === own) solid.set(skill.strand, (solid.get(skill.strand) ?? 0) + 1);
  }
  const strengths = [...ahead].slice(0, 2).map((strand) => ({ kind: "ahead", strand }));
  const mental = timed.filter((attempt) => getSkill(attempt.skill).automatism);
  const fast = median(mental.filter((a) => a.correct).map((a) => a.timeMs));
  const rate = share(mental, (attempt) => attempt.correct);
  if (mental.length >= MENTAL_MIN_ANSWERS && fast !== null && fast <= MENTAL_FAST_MS) {
    if (rate >= MENTAL_MIN_RATE) strengths.push({ kind: "mental_speed", medianMs: fast, rate });
  }
  [...solid].filter(([strand, count]) => count >= SOLID_MASTERED && !ahead.has(strand)).sort((a, b) => b[1] - a[1]).slice(0, 2).forEach(([strand, mastered]) => strengths.push({ kind: "solid", strand, mastered }));
  const run = longestRun(timed);
  if (run >= FLAWLESS_RUN) strengths.push({ kind: "flawless", run });
  if (strengths.length === 0) {
    const [best] = STRANDS.map((strand) => ({ strand, level: practice(strand) ?? 0 })).filter(({ level }) => level >= BEST_MASTERY).sort((a, b) => b.level - a.level);
    if (best) strengths.push({ kind: "best", strand: best.strand });
  }
  return strengths;
}
function weaknessesOf(input, attempts, placement, records, practice) {
  const weaknesses = recurrentErrors(attempts);
  for (const strand of placement?.strands ?? []) {
    if (strand.level === "to_consolidate" && (practice(strand.strand) ?? 0) < MASTERY_THRESHOLD) {
      weaknesses.push({ kind: "behind", strand: strand.strand });
    }
  }
  const mastery = (record) => masteryOf(record, input.at);
  records.filter(([, record]) => record.masteredAt && masteryStatus(record, input.at) === "to_review").sort((a, b) => mastery(a[1]) - mastery(b[1])).slice(0, MAX_ITEMS).forEach(
    ([skill, record]) => weaknesses.push({ kind: "fading", skill, mastery: mastery(record) })
  );
  const answered = /* @__PURE__ */ new Map();
  for (const attempt of attempts) {
    answered.set(attempt.skill, (answered.get(attempt.skill) ?? 0) + 1);
  }
  records.filter(([skill, record]) => !record.masteredAt && (answered.get(skill) ?? 0) > 0).filter(([, record]) => record.attempts >= STUCK_ANSWERS && mastery(record) < STUCK_MASTERY).sort((a, b) => mastery(a[1]) - mastery(b[1])).slice(0, 2).forEach(
    ([skill, record]) => weaknesses.push({
      kind: "stuck",
      skill,
      mastery: mastery(record),
      answers: record.attempts
    })
  );
  return weaknesses;
}
function recurrentErrors(attempts) {
  const found = /* @__PURE__ */ new Map();
  for (const attempt of attempts) {
    if (attempt.correct || !attempt.error) continue;
    const seen = found.get(attempt.error);
    found.set(attempt.error, {
      count: (seen?.count ?? 0) + 1,
      lastSeenAt: seen && seen.lastSeenAt > attempt.answeredAt ? seen.lastSeenAt : attempt.answeredAt
    });
  }
  return [...found].filter(([error, { count }]) => {
    const skills2 = getErrorType(error).skills;
    const errors = attempts.filter((a) => !a.correct && skills2.includes(a.skill)).length;
    return count >= RECURRENT_ERROR && count >= RECURRENT_SHARE * errors;
  }).sort((a, b) => b[1].count - a[1].count || b[1].lastSeenAt.localeCompare(a[1].lastSeenAt)).slice(0, MAX_ITEMS).map(([error, seen]) => ({ kind: "error", error, ...seen }));
}
function styleOf(input, practice, timed) {
  return {
    attention: attentionOf(practice, timed),
    bestTime: bestTimeOf(timed, input.timeZone),
    afterError: afterErrorOf(practice, input.at),
    twinSuccess: twinSuccessOf(timed)
  };
}
function attentionOf(practice, timed) {
  const completed = timed.filter((attempt) => attempt.session.completedAt);
  const lengths = practice.filter((session) => session.completedAt && session.attempts.length > 0).map((session) => activeMinutes(session));
  const minutes = median(lengths);
  if (lengths.length < MIN_SESSIONS || minutes === null) return null;
  const stretches = Array.from(
    { length: ATTENTION_STRETCHES },
    (_, index) => completed.filter((attempt) => Math.floor(attempt.minute / ATTENTION_STRETCH) === index).map((attempt) => attempt.surprise)
  );
  const [first = [], ...later] = stretches;
  if (first.length >= ATTENTION_MIN_ANSWERS) {
    const fading = later.findIndex(
      (stretch) => stretch.length >= ATTENTION_MIN_ANSWERS && mean(first) - mean(stretch) >= ATTENTION_DROP
    );
    if (fading >= 0) return { kind: "drops", after: (fading + 1) * ATTENTION_STRETCH };
  }
  return { kind: "steady", minutes: Math.round(minutes) };
}
function bestTimeOf(timed, timeZone) {
  const parts = /* @__PURE__ */ new Map();
  for (const attempt of timed) {
    const part = timeOfDay(localHour(attempt.answeredAt, timeZone));
    parts.set(part, [...parts.get(part) ?? [], attempt.surprise]);
  }
  const ranked = [...parts].filter(([, surprises]) => surprises.length >= TIME_MIN_ANSWERS).map(([part, surprises]) => ({ part, score: mean(surprises) })).sort((a, b) => b.score - a.score);
  const [best, next] = ranked;
  return best && next && best.score - next.score >= TIME_GAP ? best.part : null;
}
function afterErrorOf(practice, at) {
  let errors = 0;
  let rushed = 0;
  for (const session of practice) {
    session.attempts.forEach((attempt, index) => {
      const next = session.attempts[index + 1];
      if (attempt.correct || !next) return;
      errors += 1;
      if (next.timeMs < RUSHED_MS) rushed += 1;
    });
  }
  const left = practice.filter((session) => {
    const last = session.attempts.at(-1);
    return !session.completedAt && last && !last.correct && Date.parse(at) - Date.parse(last.answeredAt) >= ABANDONED_AFTER_MS;
  }).length;
  if (errors < MIN_ERRORS) return null;
  if (rushed >= RUSHED_SHARE * errors) return "guesses";
  if (left >= GIVE_UP_SESSIONS && left >= GIVE_UP_SHARE * practice.length) return "gives_up";
  return "perseveres";
}
function twinSuccessOf(timed) {
  const twins = timed.filter((attempt) => attempt.twinOf !== null);
  return twins.length >= MIN_TWINS ? share(twins, (attempt) => attempt.correct) : null;
}
function timedAttempts(session, ratings) {
  let previous = Date.parse(session.startedAt);
  let active = 0;
  return session.attempts.map((attempt) => {
    const at = Date.parse(attempt.answeredAt);
    active += Math.min(MAX_GAP_MS, Math.max(0, at - previous));
    previous = Math.max(previous, at);
    const item = itemRating(ratings, attempt.generatorId, attempt.difficulty);
    const expected = expectedSuccess(attempt.learnerElo, item);
    return {
      ...attempt,
      session,
      minute: active / MINUTE_MS,
      surprise: (attempt.correct ? 1 : 0) - expected
    };
  });
}
var activeMinutes = (session) => timedAttempts(session, {}).at(-1)?.minute ?? 0;
function longestRun(timed) {
  let best = 0;
  let run = 0;
  let session = null;
  for (const attempt of timed) {
    if (attempt.session !== session) run = 0;
    session = attempt.session;
    run = attempt.correct ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}
var formatters = /* @__PURE__ */ new Map();
function localHour(iso, timeZone) {
  let format = formatters.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "numeric", hourCycle: "h23" });
    formatters.set(timeZone, format);
  }
  const hour = format.formatToParts(new Date(iso)).find((part) => part.type === "hour");
  return Number(hour?.value ?? 0) % 24;
}
var timeOfDay = (hour) => hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 17 ? "afternoon" : "evening";
var mean = (values) => values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] ?? 0 : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}
var share = (list2, test) => list2.length === 0 ? 0 : list2.filter(test).length / list2.length;

// src/adaptive/profile-summary.ts
var STRANDS2 = {
  numeration: "num\xE9ration",
  calcul: "calcul",
  fractions: "fractions",
  mesures: "mesures",
  geometrie: "g\xE9om\xE9trie",
  problemes: "probl\xE8mes"
};
var TIMES = {
  morning: "le matin",
  afternoon: "l\u2019apr\xE8s-midi",
  evening: "en fin de journ\xE9e"
};
var lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);
var seconds = (ms) => `${(Math.round(ms / 100) / 10).toString().replace(".", ",")} s`;
var percent = (rate) => `${Math.round(rate * 100)} %`;
function strength(item) {
  switch (item.kind) {
    case "ahead":
      return `en avance en ${STRANDS2[item.strand]}`;
    case "solid":
      return `\xE0 l\u2019aise en ${STRANDS2[item.strand]} (${item.mastered} comp\xE9tences de l\u2019ann\xE9e ma\xEEtris\xE9es)`;
    case "best":
      return `meilleur domaine en ce moment : ${STRANDS2[item.strand]}`;
    case "mental_speed":
      return `calcul mental rapide (${seconds(item.medianMs)} par calcul, ${percent(item.rate)} de r\xE9ussite)`;
    case "flawless":
      return `jusqu\u2019\xE0 ${item.run} bonnes r\xE9ponses d\u2019affil\xE9e`;
  }
}
function weakness(item) {
  switch (item.kind) {
    case "error":
      return `${getErrorType(item.error).label} (${item.count} fois)`;
    case "behind":
      return `\xE0 consolider en ${STRANDS2[item.strand]}`;
    case "fading":
      return `\xE0 revoir : ${lowerFirst(getSkill(item.skill).title)}`;
    case "stuck":
      return `bloque sur : ${lowerFirst(getSkill(item.skill).title)}`;
  }
}
function style(learning) {
  const parts = [];
  const { attention, bestTime, afterError, twinSuccess } = learning;
  if (attention?.kind === "steady") {
    parts.push(`garde sa concentration toute la s\xE9ance (${attention.minutes} min)`);
  }
  if (attention?.kind === "drops") {
    parts.push(`perd sa concentration apr\xE8s ${attention.after} minutes environ`);
  }
  if (bestTime) parts.push(`plus efficace ${TIMES[bestTime]}`);
  if (afterError === "perseveres") parts.push("pers\xE9v\xE8re apr\xE8s une erreur");
  if (afterError === "gives_up") parts.push("abandonne parfois la s\xE9ance apr\xE8s une erreur");
  if (afterError === "guesses") parts.push("r\xE9pond vite au hasard apr\xE8s une erreur");
  if (twinSuccess !== null) {
    parts.push(`r\xE9ussit ${percent(twinSuccess)} des exercices jumeaux apr\xE8s une correction`);
  }
  return parts;
}
function profileSummary(profile, interests = []) {
  const strengths = profile.strengths.map(strength);
  const weaknesses = profile.weaknesses.slice(0, 5).map(weakness);
  const learning = style(profile.style);
  return [
    `\xC9l\xE8ve de ${profile.grade}, ${profile.mastered} comp\xE9tences ma\xEEtris\xE9es, ${profile.inProgress} en cours.`,
    `Points forts : ${strengths.length ? strengths.join(" ; ") : "encore \xE0 d\xE9couvrir"}.`,
    `\xC0 travailler : ${weaknesses.length ? weaknesses.join(" ; ") : "rien de particulier pour l\u2019instant"}.`,
    `Fa\xE7on d\u2019apprendre : ${learning.length ? learning.join(" ; ") : "encore \xE0 observer"}.`,
    interests.length ? `Centres d\u2019int\xE9r\xEAt : ${interests.slice(0, 6).join(", ")}.` : "Centres d\u2019int\xE9r\xEAt : non renseign\xE9s, prendre des exemples de la vie courante."
  ].join("\n");
}

// src/adaptive/planner.ts
function buildExercise(step, generators2 = generators) {
  const generator = generators2.find((candidate) => generatorId(candidate) === step.generatorId);
  if (!generator) throw new Error(`Unknown generator ${step.generatorId}`);
  return generateExercise(generator, step.difficulty, step.seed);
}

// src/parse.ts
var MAX_DIGITS = 15;
function parseTypedNumber(text) {
  let normalized = text.replace(/\s/g, "").replace(/−/g, "-");
  if (/^\(.*\)$/.test(normalized)) normalized = normalized.slice(1, -1);
  const fraction = /^([+-]?\d+)\/([+-]?\d+)$/.exec(normalized);
  if (fraction) {
    const [num, den] = [Number(fraction[1]), Number(fraction[2])];
    if (den === 0 || normalized.length > MAX_DIGITS) return null;
    const value = rational(num, den);
    return { value, form: "fraction", irreducible: Math.abs(value.num) === Math.abs(num) };
  }
  const decimal2 = /^([+-]?)(\d*)(?:[.,](\d*))?$/.exec(normalized);
  if (!decimal2) return null;
  const [, sign = "", units = "", decimals] = decimal2;
  if (units === "" && !decimals) return null;
  if (units.length + (decimals?.length ?? 0) > MAX_DIGITS) return null;
  const places = decimals?.length ?? 0;
  const scaled = Number(`${units || "0"}${decimals ?? ""}`) * (sign === "-" ? -1 : 1);
  return {
    value: rational(scaled, 10 ** places),
    form: decimals === void 0 ? "integer" : "decimal",
    irreducible: true
  };
}

// src/grade.ts
var sameList = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);
var verdict = (correct) => correct ? { correct: true } : { correct: false, reason: "incorrect" };
function gradeResponse(exercise, response) {
  if (exercise.type !== response.type) return { correct: false, reason: "unreadable" };
  switch (response.type) {
    case "numeric": {
      if (exercise.type !== "numeric") break;
      const typed = parseTypedNumber(response.text);
      if (!typed) return { correct: false, reason: "unreadable" };
      if (!equals(typed.value, exercise.answer)) return verdict(false);
      if (exercise.forms && !exercise.forms.includes(typed.form)) {
        return { correct: false, reason: "wrong-form" };
      }
      if (exercise.irreducible && typed.form === "fraction" && !typed.irreducible) {
        return { correct: false, reason: "not-irreducible" };
      }
      return verdict(true);
    }
    case "choice":
      if (exercise.type === "choice") return verdict(response.index === exercise.answer);
      break;
    case "true-false":
      if (exercise.type === "true-false") return verdict(response.value === exercise.answer);
      break;
    case "number-line":
      if (exercise.type === "number-line") return verdict(equals(response.value, exercise.answer));
      break;
    case "order":
      if (exercise.type === "order") return verdict(sameList(response.order, exercise.answer));
      break;
    case "match":
      if (exercise.type === "match") return verdict(sameList(response.pairs, exercise.answer));
      break;
    case "fraction-shade":
      if (exercise.type === "fraction-shade") return verdict(response.shaded === exercise.answer);
      break;
  }
  return { correct: false, reason: "unreadable" };
}

// src/diagnose.ts
function diagnoseResponse(exercise, response) {
  if (exercise.type !== response.type || gradeResponse(exercise, response).correct) return null;
  switch (response.type) {
    case "numeric": {
      if (exercise.type !== "numeric") return null;
      const typed = parseTypedNumber(response.text)?.value;
      return typed ? find(exercise.mistakes, exercise.answer, typed, equals) : null;
    }
    case "number-line":
      if (exercise.type !== "number-line") return null;
      return find(exercise.mistakes, exercise.answer, response.value, equals);
    case "choice":
      if (exercise.type !== "choice") return null;
      return find(exercise.mistakes, exercise.answer, response.index, same);
    case "true-false":
      if (exercise.type !== "true-false") return null;
      return find(exercise.mistakes, exercise.answer, response.value, same);
    case "fraction-shade":
      if (exercise.type !== "fraction-shade") return null;
      return find(exercise.mistakes, exercise.answer, response.shaded, same);
    case "order":
      if (exercise.type !== "order") return null;
      return find(exercise.mistakes, exercise.answer, response.order, sameList2);
    case "match":
      if (exercise.type !== "match") return null;
      return find(exercise.mistakes, exercise.answer, response.pairs, sameList2);
  }
}
var same = (a, b) => a === b;
var sameList2 = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);
function find(mistakes, answer, given, equal) {
  for (const [code, values] of Object.entries(mistakes ?? {})) {
    for (const value of values) {
      if (value !== void 0 && !equal(value, answer) && equal(value, given)) return code;
    }
  }
  return null;
}

// src/regrade.ts
var isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var isNumberList = (value) => Array.isArray(value) && value.every((item) => typeof item === "number");
function parseStoredResponse(value) {
  if (!isObject(value)) return null;
  const { type } = value;
  if (type === "numeric" && typeof value.text === "string") return { type, text: value.text };
  if (type === "choice" && typeof value.index === "number") return { type, index: value.index };
  if (type === "true-false" && typeof value.value === "boolean") {
    return { type, value: value.value };
  }
  if (type === "number-line" && isObject(value.value)) {
    const { num, den } = value.value;
    if (typeof num === "number" && typeof den === "number" && den !== 0) {
      return { type, value: rational(num, den) };
    }
  }
  if (type === "order" && isNumberList(value.order)) return { type, order: value.order };
  if (type === "match" && isNumberList(value.pairs)) return { type, pairs: value.pairs };
  if (type === "fraction-shade" && typeof value.shaded === "number") {
    return { type, shaded: value.shaded };
  }
  return null;
}
function rebuildExercise(stored) {
  const difficulty2 = DIFFICULTIES.find((level) => level === stored.difficulty);
  if (!difficulty2) return null;
  try {
    return buildExercise({ generatorId: stored.generator_id, difficulty: difficulty2, seed: stored.seed });
  } catch {
    return null;
  }
}
function regrade(answers) {
  return answers.map(({ position, ...stored }) => {
    const exercise = rebuildExercise(stored);
    if (!exercise) return { position, correct: null, error: null };
    const response = parseStoredResponse(stored.answer);
    if (!response) return { position, correct: false, error: null };
    const correct = gradeResponse(exercise, response).correct;
    return { position, correct, error: correct ? null : diagnoseResponse(exercise, response) };
  });
}

// src/server.ts
var isRow = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var rows = (value) => Array.isArray(value) ? value.filter(isRow) : [];
var number = (value, fallback = 0) => typeof value === "number" && Number.isFinite(value) ? value : fallback;
var date = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null;
var grade = (value) => GRADES.find((item) => item === value) ?? null;
var difficulty = (value) => DIFFICULTIES.find((item) => item === value) ?? null;
var KINDS = ["daily", "bonus", "boss", "placement"];
var SLOTS = ["current", "review", "automatism", "challenge"];
function attemptOf(row) {
  const skill = row.skill_code;
  const level = difficulty(row.difficulty);
  const answeredAt = date(row.answered_at);
  if (typeof skill !== "string" || !isSkillCode(skill) || !level || !answeredAt) return null;
  const error = row.error_type;
  return {
    generatorId: typeof row.generator_id === "string" ? row.generator_id : skill,
    skill,
    difficulty: level,
    slot: SLOTS.find((slot) => slot === row.slot) ?? "current",
    twinOf: typeof row.twin_of === "number" ? row.twin_of : null,
    correct: row.correct === true,
    timeMs: number(row.time_ms),
    answeredAt,
    learnerElo: number(row.learner_elo, 1e3),
    error: typeof error === "string" && isErrorTypeCode(error) ? error : null
  };
}
function sessionOf(row) {
  const kind = KINDS.find((item) => item === row.kind);
  const played = grade(row.grade);
  const startedAt = date(row.started_at);
  if (!kind || !played || !startedAt) return null;
  return {
    kind,
    grade: played,
    startedAt,
    completedAt: date(row.completed_at),
    attempts: rows(row.attempts).map(attemptOf).filter((attempt) => attempt !== null)
  };
}
function masteryOf2(list2) {
  const map = {};
  for (const row of rows(list2)) {
    const skill = row.skill_code;
    if (typeof skill !== "string" || !isSkillCode(skill)) continue;
    map[skill] = {
      elo: number(row.elo, 1e3),
      attempts: number(row.attempts_count),
      streak: number(row.sessions_streak),
      masteredAt: date(row.mastered_at),
      practicedAt: date(row.last_practiced_at)
    };
  }
  return map;
}
function ratingsOf(list2) {
  const ratings = {};
  for (const row of rows(list2)) {
    const level = difficulty(row.difficulty);
    if (typeof row.generator_id !== "string" || !level) continue;
    ratings[itemKey(row.generator_id, level)] = number(row.rating, 1e3);
  }
  return ratings;
}
function profileFromInput(input, at) {
  if (!isRow(input) || !isRow(input.child)) return null;
  const childGrade = grade(input.child.grade);
  if (!childGrade) return null;
  const timeZone = typeof input.child.timezone === "string" ? input.child.timezone : "Europe/Paris";
  const profile = learnerProfile({
    childGrade,
    mastery: masteryOf2(input.mastery),
    sessions: rows(input.sessions).map(sessionOf).filter((session) => session !== null),
    itemRatings: ratingsOf(input.item_ratings),
    timeZone: validTimeZone(timeZone) ? timeZone : "Europe/Paris",
    at
  });
  const interests = Array.isArray(input.interests) ? input.interests.filter((name) => typeof name === "string") : [];
  return { profile, summary: profileSummary(profile, interests) };
}
function validTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone });
    return true;
  } catch {
    return false;
  }
}
export {
  profileFromInput,
  regrade
};
