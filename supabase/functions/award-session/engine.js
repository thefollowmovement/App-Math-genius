// Generated from packages/exercise-engine/src/regrade.ts by `pnpm functions:bundle`. Do not edit.

// ../curriculum/src/types.ts
function defineGradeSkills(grade, programVersion, skills2) {
  return skills2.map((skill) => ({ ...skill, subject: "math", grade, programVersion }));
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
function generateExercise(generator, difficulty, seed) {
  return {
    ...generator.generate(createRng(seed), difficulty),
    generatorId: generatorId(generator),
    skill: generator.skill,
    difficulty,
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
function orderFields(labels, values, direction) {
  const answer = ranking(values, direction);
  return {
    type: "order",
    direction,
    items: labels,
    answer,
    prompt: orderPrompt(direction),
    explanation: [orderSentence(labels, answer, direction)]
  };
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
  generate(rng, difficulty) {
    const [aMin, aMax, bMin, bMax] = RANGES[difficulty];
    const [a, b] = [rng.int(aMin, aMax), rng.int(bMin, bMax)];
    return {
      type: "numeric",
      prompt: `${formatNumber(a)} + ${formatNumber(b)} = ?`,
      check: `${formatNumber(a)} + ${formatNumber(b)}`,
      answer: rational(a + b),
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
  generate(rng, difficulty) {
    const base = difficulty >= 4 ? rng.int(1, 9) * 1e3 : 0;
    const values = distinct(difficulty < 3 ? 4 : 5, () => base + rng.int(1, MAX[difficulty]));
    const direction = rng.pick(["ascending", "descending"]);
    return {
      ...orderFields(
        values.map(formatNumber),
        values.map((value) => rational(value)),
        direction
      ),
      hint: "Compare d\u2019abord le nombre de chiffres, puis les chiffres un par un en partant de la gauche."
    };
  }
});

// src/generators/ce2/doubles-moities.ts
var MAX2 = { 1: 20, 2: 50, 3: 100, 4: 250, 5: 500 };
var doubles_moities_default = defineGenerator({
  skill: "ce2.doubles-moities",
  generate(rng, difficulty) {
    const value = rng.int(3, MAX2[difficulty]);
    if (rng.chance(0.5)) {
      return {
        type: "numeric",
        prompt: `Quel est le double de ${formatNumber(value)} ?`,
        check: `double(${formatNumber(value)})`,
        answer: rational(2 * value),
        hint: "Le double, c\u2019est le nombre ajout\xE9 \xE0 lui-m\xEAme.",
        explanation: [`${formatNumber(value)} + ${formatNumber(value)} = ${formatNumber(2 * value)}`]
      };
    }
    return {
      type: "numeric",
      prompt: `Quelle est la moiti\xE9 de ${formatNumber(2 * value)} ?`,
      check: `moitie(${formatNumber(2 * value)})`,
      answer: rational(value),
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
  generate(rng, difficulty) {
    const den = rng.pick(DENOMINATORS[difficulty]);
    const group = rng.int(1, difficulty < 3 ? 2 : 3);
    return {
      type: "fraction-shade",
      parts: den * group,
      fraction: `1/${den}`,
      answer: group,
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
  generate(rng, difficulty) {
    const [big, small, factor] = rng.pick(PAIRS.slice(0, Math.min(difficulty + 1, PAIRS.length)));
    const count = rng.int(2, difficulty < 3 ? 9 : 25);
    const reverse = difficulty >= 4 && rng.chance(0.5);
    const [value, answer] = reverse ? [count * factor, count] : [count, count * factor];
    const [from, to] = reverse ? [small, big] : [big, small];
    return {
      type: "numeric",
      prompt: `${formatNumber(value)} ${from} = ? ${to}`,
      check: `conversion(${formatNumber(value)}, ${from}, ${to})`,
      answer: rational(answer),
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
  generate(rng, difficulty) {
    const [min, max] = RANGES2[difficulty];
    const a = rng.int(min, max);
    const b = rng.int(difficulty === 1 ? 2 : 3, difficulty === 1 ? 5 : 9);
    return {
      type: "numeric",
      prompt: `${formatNumber(a)} \xD7 ${b} = ?`,
      check: `${formatNumber(a)} \xD7 ${b}`,
      answer: rational(a * b),
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
  generate(rng, difficulty) {
    const missing = difficulty === 5;
    const a = rng.pick(TABLES[missing ? 4 : difficulty]);
    const b = rng.pick([2, 3, 4, 5, 6, 7, 8, 9, 10].filter((value) => !missing || value !== a));
    const product = formatNumber(a * b);
    return {
      type: "numeric",
      prompt: missing ? `${a} \xD7 ? = ${product}` : `${a} \xD7 ${b} = ?`,
      check: missing ? `${product} \xF7 ${a}` : `${a} \xD7 ${b}`,
      answer: rational(missing ? b : a * b),
      hint: `Pense \xE0 la table de ${a}.`,
      explanation: [`${a} \xD7 ${b} = ${product}`]
    };
  }
});

// src/generators/cm1/comparer-decimaux.ts
var comparer_decimaux_default = defineGenerator({
  skill: "cm1.comparer-decimaux",
  generate(rng, difficulty) {
    const whole = rng.int(0, difficulty < 3 ? 9 : 99);
    const draw = () => {
      const places = rng.int(1, difficulty < 3 ? 2 : 3);
      const units = difficulty === 1 ? rng.int(0, 9) : whole;
      return decimal(units * 10 ** places + rng.int(1, 10 ** places - 1), places);
    };
    const values = distinct(difficulty < 4 ? 4 : 5, draw, formatDecimal);
    const direction = rng.pick(["ascending", "descending"]);
    return {
      ...orderFields(values.map(formatDecimal), values, direction),
      hint: "Compare la partie enti\xE8re, puis les dixi\xE8mes, puis les centi\xE8mes. Ajouter des z\xE9ros \xE0 la fin ne change rien."
    };
  }
});

// src/generators/cm1/division-euclidienne.ts
var DIVISORS = { 1: [2, 5], 2: [2, 9], 3: [3, 9], 4: [6, 9], 5: [11, 25] };
var division_euclidienne_default = defineGenerator({
  skill: "cm1.division-euclidienne",
  generate(rng, difficulty) {
    const [min, max] = DIVISORS[difficulty];
    const divisor = rng.int(min, max);
    const quotient = rng.pick(range(3, difficulty * 8, divisor));
    const remainder = rng.int(difficulty === 1 ? 0 : 1, divisor - 1);
    const dividend = formatNumber(divisor * quotient + remainder);
    const asked = rng.pick(["reste", "quotient"]);
    const answer = asked === "reste" ? remainder : quotient;
    return {
      type: "numeric",
      prompt: `Quel est le ${asked} de la division de ${dividend} par ${divisor} ?`,
      check: `${asked}(${dividend}, ${divisor})`,
      answer: rational(answer),
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
  generate(rng, difficulty) {
    const units = difficulty >= 4 ? difficulty - 2 : 1;
    const fractions = DENS[difficulty].flatMap((d) => range(1, d * units - 1).map((k) => [k, d]));
    const [num = 1, den = 2] = rng.pick(fractions.filter(([k = 0, d = 1]) => k % d !== 0));
    return {
      type: "number-line",
      min: rational(0),
      max: rational(units),
      step: rational(1, den),
      target: `${num}/${den}`,
      answer: rational(num, den),
      prompt: `Place ${num}/${den} sur la droite gradu\xE9e.`,
      hint: `L\u2019unit\xE9 est partag\xE9e en ${den} parts \xE9gales : chaque graduation vaut 1/${den}.`,
      explanation: [`${num}/${den}, c\u2019est ${num} graduations de 1/${den} apr\xE8s 0.`]
    };
  }
});

// src/generators/cm1/nombres-decimaux.ts
var nombres_decimaux_default = defineGenerator({
  skill: "cm1.nombres-decimaux",
  generate(rng, difficulty) {
    const units = rng.int(difficulty === 1 ? 1 : 0, difficulty < 3 ? 9 : 99);
    const tenths = rng.int(difficulty >= 4 ? 0 : 1, 9);
    const hundredths = difficulty === 1 ? 0 : rng.int(1, 9);
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
  generate(rng, difficulty) {
    const length = rng.int(3, MAX3[difficulty]);
    const width = rng.int(2, length - 1);
    const square = rng.chance(0.3);
    const [l, w] = [formatNumber(length), formatNumber(width)];
    return {
      type: "numeric",
      prompt: square ? `Quel est le p\xE9rim\xE8tre d\u2019un carr\xE9 de ${l} cm de c\xF4t\xE9 ?` : `Quel est le p\xE9rim\xE8tre d\u2019un rectangle de ${l} cm de longueur et ${w} cm de largeur ?`,
      check: square ? `perimetre_carre(${l})` : `perimetre_rectangle(${l}, ${w})`,
      answer: rational(square ? 4 * length : 2 * (length + width)),
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
  generate(rng, difficulty) {
    const item = rng.pick(ITEMS);
    const price = rng.int(2, difficulty < 3 ? 5 : 12);
    const first = rng.int(2, difficulty < 4 ? 5 : 9);
    const second = rng.pick(range(2, difficulty < 3 ? 10 : 20, first));
    const total = formatNumber(first * price);
    return {
      type: "numeric",
      prompt: `${first} ${item}s co\xFBtent ${total} \u20AC. Combien co\xFBtent ${second} ${item}s ?`,
      check: `${total} \xF7 ${first} \xD7 ${second}`,
      answer: rational(second * price),
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
  generate(rng, difficulty) {
    const max = difficulty < 3 ? 99 : 999;
    const draw = (places) => decimal(rng.int(10 ** places, max * 10 ** places), places);
    const [x, y] = PLACES[difficulty].map(draw);
    const operator = difficulty >= 3 && rng.chance(0.5) ? "\u2212" : "+";
    const [a, b] = operator === "\u2212" && compare(x, y) < 0 ? [y, x] : [x, y];
    const answer = operator === "\u2212" ? sub(a, b) : add(a, b);
    return {
      type: "numeric",
      prompt: `${formatNumber(a)} ${operator} ${formatNumber(b)} = ?`,
      check: `${formatNumber(a)} ${operator} ${formatNumber(b)}`,
      answer,
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
  generate(rng, difficulty) {
    const [min, max] = SIDES[difficulty];
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
  generate(rng, difficulty) {
    const operator = rng.pick(
      difficulty < 3 ? ["+", "\u2212"] : ["+", "\u2212", "\xD7", "\xF7"]
    );
    const additive = operator === "+" || operator === "\u2212";
    const [x, y] = [rng.int(2, additive ? 25 * difficulty : 9 + difficulty), rng.int(2, 12)];
    const combined = additive ? x + y : x * y;
    const [a, b, c] = operator === "\u2212" || operator === "\xF7" ? [combined, y, x] : [x, y, combined];
    const hideA = rng.chance(0.5);
    const backwards = operator === "\u2212" || operator === "\xF7";
    return {
      type: "numeric",
      prompt: `Quel nombre manque ? ${hideA ? "?" : formatNumber(a)} ${operator} ${hideA ? formatNumber(b) : "?"} = ${formatNumber(c)}`,
      check: hideA || !backwards ? `${formatNumber(c)} ${OPPOSITE[operator]} ${formatNumber(hideA ? b : a)}` : `${formatNumber(a)} ${operator} ${formatNumber(c)}`,
      answer: rational(hideA ? a : b),
      hint: "Utilise l\u2019op\xE9ration inverse pour retrouver le nombre manquant.",
      explanation: [`${formatNumber(a)} ${operator} ${formatNumber(b)} = ${formatNumber(c)}, donc il manque ${formatNumber(hideA ? a : b)}.`]
    };
  }
});

// src/generators/cm2/fractions-addition-meme-denominateur.ts
var fractions_addition_meme_denominateur_default = defineGenerator({
  skill: "cm2.fractions-addition-meme-denominateur",
  generate(rng, difficulty) {
    const den = rng.int(3, difficulty < 3 ? 9 : 12);
    const limit = difficulty < 3 ? den - 1 : 2 * den;
    const a = rng.pick(range(1, limit - 1));
    const b = rng.pick(range(1, limit - a));
    const subtract = difficulty >= 3 && a !== b && rng.chance(0.5);
    const [first, second] = subtract && a < b ? [b, a] : [a, b];
    const operator = subtract ? "\u2212" : "+";
    const resultNum = subtract ? first - second : first + second;
    const expression = `${formatFraction(first, den)} ${operator} ${formatFraction(second, den)}`;
    return {
      type: "numeric",
      prompt: `${expression} = ?`,
      check: expression,
      answer: rational(resultNum, den),
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
  generate(rng, difficulty) {
    const fractions = DENS2[difficulty].flatMap((den) => range(1, den - 1).map((num) => [num, den]));
    const count = difficulty < 3 ? 3 : 4;
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
  generate(rng, difficulty) {
    const divisor = rng.pick(DIVISORS2[difficulty]);
    const quotient = rng.int(4, difficulty < 3 ? 30 : 300);
    const remainder = rng.chance(0.5) ? 0 : rng.pick(range(1, divisor - 1));
    const value = formatNumber(divisor * quotient + remainder);
    return {
      type: "true-false",
      prompt: `Vrai ou faux ? ${rng.pick(SENTENCES)(value, divisor)}`,
      check: `multiple(${value}, ${divisor})`,
      answer: remainder === 0,
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
  generate(rng, difficulty) {
    const percent = rng.pick(PERCENTS[difficulty]);
    const quantity = 100 / gcd2(percent, 100) * rng.int(1, difficulty < 3 ? 10 : 30);
    const answer = percent * quantity / 100;
    return {
      type: "numeric",
      prompt: `Combien font ${percent} % de ${formatNumber(quantity)} ?`,
      check: `${percent} % \xD7 ${formatNumber(quantity)}`,
      answer: rational(answer),
      hint: percent === 50 ? "Prendre 50 %, c\u2019est prendre la moiti\xE9." : `${percent} %, c\u2019est ${percent} pour 100.`,
      explanation: [`${formatNumber(quantity)} \xD7 ${percent} \xF7 100 = ${formatNumber(answer)}`]
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
  generate(rng, difficulty) {
    const near = Math.min(180, rng.pick([90, 180]) + rng.int(-6 * difficulty, 6));
    const spread = difficulty === 1 ? rng.pick([30, 45, 60, 90, 120, 135, 150, 180]) : 10 * rng.int(1, 18);
    const measure = difficulty < 3 ? spread : near;
    const nature = measure < 90 ? "aigu" : measure === 90 ? "droit" : measure < 180 ? "obtus" : "plat";
    return {
      type: "choice",
      prompt: `Un angle mesure ${measure}\xB0. Cet angle est :`,
      options: NATURES.map((label) => ({ label, check: `${label}(${measure})` })),
      answer: NATURES.indexOf(nature),
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
  generate(rng, difficulty) {
    const den = rng.pick(DENS3[difficulty]);
    const num = difficulty < 3 ? 1 : rng.int(2, den - 1);
    const part = rng.int(2, difficulty < 4 ? 10 : 25);
    const quantity = den * part;
    return {
      type: "numeric",
      prompt: `Combien font ${num}/${den} de ${formatNumber(quantity)} ?`,
      check: `${num}/${den} \xD7 ${formatNumber(quantity)}`,
      answer: rational(num * part),
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
  generate(rng, difficulty) {
    const numbers = range(4, MAX4[difficulty]);
    const composites = numbers.filter((x) => !isPrime(x) && (difficulty < 4 || x % 2 === 1));
    const prime = rng.pick(numbers.filter(isPrime));
    const options = rng.shuffle([prime, ...rng.sample(composites, 3)]);
    const others = options.filter((x) => x !== prime);
    return {
      type: "choice",
      prompt: "Lequel de ces nombres est premier ?",
      options: options.map((x) => ({ label: String(x), check: `premier(${x})` })),
      answer: options.indexOf(prime),
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
  generate(rng, difficulty) {
    const template = rng.pick(TEMPLATES.slice(0, difficulty));
    const [expression, value, first] = template(rng.int(2, 12), rng.int(2, 9), rng.int(2, 9));
    return {
      type: "numeric",
      prompt: `Calcule : ${expression}`,
      check: expression,
      answer: rational(value),
      hint: "Les parenth\xE8ses d\u2019abord, puis les multiplications et les divisions, puis les additions et les soustractions.",
      explanation: [`On commence par ${first}.`, `${expression} = ${formatNumber(value)}`]
    };
  }
});

// src/generators/sixieme/probabilites.ts
var COLORS = ["rouges", "bleues", "vertes", "jaunes"];
var probabilites_default = defineGenerator({
  skill: "6e.probabilites",
  generate(rng, difficulty) {
    const colors = rng.sample(COLORS, difficulty < 3 ? 2 : 3);
    const counts = colors.map(() => rng.int(2, difficulty < 4 ? 6 : 12));
    const target = rng.int(0, colors.length - 1);
    const total = counts.reduce((sum, count) => sum + count, 0);
    const favourable = counts[target] ?? 0;
    const content = colors.map((color, index) => `${counts[index]} boules ${color}`);
    return {
      type: "numeric",
      prompt: `Un sac contient ${list(content)}. On tire une boule au hasard. Quelle est la probabilit\xE9 qu\u2019elle soit ${colors[target]?.slice(0, -1)} ?`,
      check: `${favourable} \xF7 (${counts.join(" + ")})`,
      answer: rational(favourable, total),
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
  generate(rng, difficulty) {
    const coefficient = difficulty < 4 ? rational(rng.int(2, 3 + 2 * difficulty)) : decimal(rng.int(1, 9) * 10 + 5, 1);
    const first = rng.pick(range(2, 12).filter((x) => mul(coefficient, rational(x)).den === 1));
    const second = rng.pick(
      range(2, difficulty < 3 ? 12 : 30, first).filter((x) => mul(coefficient, rational(x)).den === 1)
    );
    const [y1, answer] = [mul(coefficient, rational(first)), mul(coefficient, rational(second))];
    return {
      type: "numeric",
      prompt: `Dans ce tableau de proportionnalit\xE9, ${first} correspond \xE0 ${formatNumber(y1)}. \xC0 quoi correspond ${second} ?`,
      check: `${formatNumber(y1)} \xF7 ${first} \xD7 ${second}`,
      answer,
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
  generate(rng, difficulty) {
    const den = rng.int(2, difficulty < 3 ? 5 : 9);
    const big = den * rng.int(2, difficulty < 3 ? 3 : 4);
    const [a, b] = [rng.int(1, 2 * den - 1), rng.int(1, 2 * big - 1)];
    const minus = difficulty >= 3 && a * big > b * den && rng.chance(0.5);
    const [operator, scaled] = [minus ? "\u2212" : "+", a * big / den];
    const answer = (minus ? sub : add)(rational(a, den), rational(b, big));
    const expression = `${formatFraction(a, den)} ${operator} ${formatFraction(b, big)}`;
    const simplified = answer.den === big ? "" : ` = ${formatFraction(answer.num, answer.den)}`;
    const ask = difficulty === 5 ? "Donne le r\xE9sultat sous forme irr\xE9ductible : " : "";
    return {
      type: "numeric",
      prompt: ask ? `${ask}${expression}` : `${expression} = ?`,
      check: expression,
      answer,
      display: "fraction",
      ...difficulty === 5 && { forms: ["fraction", "integer"], irreducible: true },
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
  generate(rng, difficulty) {
    const exponent = rng.int(2, difficulty === 2 ? 4 : 7);
    const factor = [rational(1), rational(rng.int(2, 9))][difficulty - 1] ?? decimal(rng.int(11, 999), rng.int(1, 3));
    const shown = difficulty === 1 ? power(10, exponent) : `${formatDecimal(factor)} \xD7 ${power(10, exponent)}`;
    const answer = mul(factor, rational(10 ** exponent));
    return {
      type: "numeric",
      prompt: `\xC9cris sans puissance : ${shown}`,
      check: difficulty === 1 ? `10^${exponent}` : `${formatDecimal(factor)} \xD7 10^${exponent}`,
      answer,
      hint: `${power(10, exponent)}, c\u2019est 1 suivi de ${exponent} z\xE9ros.`,
      explanation: [
        `${power(10, exponent)} = ${formatNumber(10 ** exponent)}`,
        ...difficulty > 1 ? [`${shown} = ${formatNumber(answer)}`] : []
      ]
    };
  }
});

// src/generators/cinquieme/relatifs-addition-soustraction.ts
var relatifs_addition_soustraction_default = defineGenerator({
  skill: "5e.relatifs-addition-soustraction",
  generate(rng, difficulty) {
    const max = [10, 10, 30, 50, 99][difficulty - 1] ?? 10;
    const draw = () => rng.pick([-1, 1]) * rng.int(1, max);
    const terms = difficulty >= 4 ? [draw(), draw(), draw()] : [draw(), draw()];
    const operators = terms.slice(1).map(() => difficulty >= 2 && rng.chance(0.5) ? "\u2212" : "+");
    const expression = terms.map((term, i) => i === 0 ? formatOperand(term) : `${operators[i - 1]} ${formatOperand(term)}`).join(" ");
    const value = terms.reduce(
      (sum, term, i) => i === 0 ? term : operators[i - 1] === "\u2212" ? sum - term : sum + term
    );
    const rule = operators.includes("\u2212") ? "Soustraire, c\u2019est ajouter l\u2019oppos\xE9." : "On additionne en tenant compte des signes.";
    return {
      type: "numeric",
      prompt: `${expression} = ?`,
      check: expression,
      answer: rational(value),
      hint: "Soustraire un nombre, c\u2019est ajouter son oppos\xE9.",
      explanation: [rule, `${expression} = ${formatNumber(value)}`]
    };
  }
});

// src/generators/cinquieme/tester-egalite.ts
var tester_egalite_default = defineGenerator({
  skill: "5e.tester-egalite",
  generate(rng, difficulty) {
    const [a, b] = [rng.int(2, 9), rng.int(1, 5 * difficulty)];
    const x = rng.int(difficulty < 3 ? 1 : -9, 9) || 1;
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

// src/exercise.ts
var DIFFICULTIES = [1, 2, 3, 4, 5];

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
  const difficulty = DIFFICULTIES.find((level) => level === stored.difficulty);
  if (!difficulty) return null;
  try {
    return buildExercise({ generatorId: stored.generator_id, difficulty, seed: stored.seed });
  } catch {
    return null;
  }
}
function regrade(answers) {
  return answers.map(({ position, ...stored }) => {
    const exercise = rebuildExercise(stored);
    if (!exercise) return { position, correct: null };
    const response = parseStoredResponse(stored.answer);
    return { position, correct: response ? gradeResponse(exercise, response).correct : false };
  });
}
export {
  parseStoredResponse,
  rebuildExercise,
  regrade
};
