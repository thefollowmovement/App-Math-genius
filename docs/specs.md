# Cahier des charges – App maths enfants

Oct 9, 2026 · @TFM

Une app iOS, Android et web où l'enfant fait chaque jour ses exercices de maths (CP → 3e), motivé par une progression façon Duolingo, pendant que le parent fixe les horaires, reçoit les relances et peut activer un verrou doux du téléphone.

## Vision et périmètre

La V1 couvre uniquement les mathématiques, du CP à la 3e, sur iOS, Android et web à partir d'un seul code. Le lycée et les autres matières viendront ensuite sans refonte : le contenu est rangé par matière → niveau → domaine → compétence.

**Promesse pour le parent :** « Mon enfant fait ses maths tous les jours, je sais quand c'est fait, et je vois ses progrès. »

**Promesse pour l'enfant :** « C'est un jeu : je gagne des étoiles, je débloque des tenues, je garde ma série. »

**Dans la V1**

- Comptes parent et enfant reliés, plusieurs enfants par parent.
- Test de positionnement, puis parcours adaptatif par compétence.
- Séance quotidienne planifiée par le parent, rappels et escalade.
- Gamification : XP, séries, gemmes, badges, boutique d'avatar, récompenses fixées par le parent.
- Thèmes et avatars personnalisables.
- Verrou doux optionnel sur le téléphone de l'enfant (iOS et Android).
- Récaps hebdomadaires et mensuels, coach IA des erreurs, profil évolutif, mini-jeux, mode scroll vidéo et back-office.

**Hors V1**

- Lycée, français, anglais et autres matières.
- Comptes enseignant ou classe.
- Fonctions sociales entre enfants (classements publics, chat) : volontairement exclues pour la sécurité des mineurs.
- Chat libre avec le coach IA (V2) ; en V1, le coach explique les erreurs via des boutons.

## Rôles et comptes

Le parent possède le compte ; l'enfant n'a ni email ni mot de passe, il utilise un profil créé et contrôlé par le parent.

| Rôle | Ce qu'il peut faire | Connexion |
| --- | --- | --- |
| Parent (titulaire) | Crée les profils enfants, fixe horaires et objectifs, définit les récompenses, active le verrou, reçoit alertes et récaps, gère l'abonnement | Email + mot de passe, Apple ou Google |
| Co-parent (invité) | Mêmes droits de suivi et de relance, pas de suppression de compte ni d'abonnement | Invitation par lien |
| Enfant | Fait ses séances, personnalise avatar et thème, dépense ses gemmes, voit sa progression | Appareil appairé, puis code à 4 chiffres ou choix d'avatar (pour les plus jeunes) |

**Appairage d'un appareil enfant**

1. Le parent crée le profil (prénom ou pseudo, classe, année de naissance optionnelle).
2. L'app parent affiche un QR code et un code à 6 caractères valables 10 minutes.
3. L'enfant installe l'app, choisit « Je suis un enfant » et scanne le code.
4. L'appareil reçoit un jeton de session longue durée rattaché à ce profil ; le parent peut le révoquer à distance.

Sur le web (PC familial), l'enfant se connecte via le compte du parent puis choisit son profil, comme sur Netflix. Un appareil peut porter plusieurs profils enfants (tablette partagée).

## Parcours clés

Trois parcours doivent être fluides dès la V1 ; chacun tient en moins de 3 minutes hors test de positionnement.

**Onboarding parent**

1. Écran d'accueil : « Je suis un parent » / « Je suis un enfant ».
2. Création du compte parent et consentement RGPD (voir section dédiée).
3. Ajout d'un enfant : prénom ou pseudo, garçon / fille, classe (CP → 3e).
4. Routine : jours, heure de début, objectif de la séance (10, 15 ou 20 minutes, ou nombre d'exercices).
5. Récompenses optionnelles (« 7 jours d'affilée = 1 h de console »).
6. Appairage du téléphone de l'enfant (QR code).
7. Option verrou doux, proposée après le premier test pour ne pas alourdir le départ.

**Onboarding enfant**

1. Scan du QR code.
2. Choix de l'avatar et du thème (présélection selon garçon / fille, tout reste modifiable).
3. Rencontre avec la mascotte, qui explique le principe en 3 écrans courts.
4. Test de positionnement présenté comme une « aventure de départ ».
5. Révélation du niveau sous forme de carte du monde, avec les premières îles débloquées.

**Séance du jour**

1. À l'heure prévue, notification à l'enfant ; si le verrou est actif, les apps choisies sont bloquées.
2. L'enfant ouvre l'app : la séance du jour est prête (mélange de révisions et de nouveautés, voir moteur).
3. Exercices un par un, correction immédiate, explication courte en cas d'erreur.
4. Objectif atteint : animation de victoire, XP, gemmes, série +1, coffre éventuel.
5. Le verrou se lève, le parent reçoit « Léa a terminé : 18/20, 14 min ».
6. L'enfant peut continuer librement (entraînement bonus) ou fermer l'app.

## Programme de maths CP → 3e

Le contenu suit les programmes officiels, qui changent en ce moment : le référentiel doit donc être versionné par année de programme. Cycle 3 rénové en CM1 et 6e depuis 2025, en CM2 depuis la rentrée 2026 ([Bordeaux](https://ent2d.ac-bordeaux.fr/disciplines/mathematiques/le-programme-de-cycle-3-a-partir-de-2025/)). Cycle 4 rénové (BO du 5 mars 2026) en 5e en 2026, en 4e en 2027, en 3e en 2028 ([Bordeaux](https://ent2d.ac-bordeaux.fr/disciplines/mathematiques/publication-du-nouveau-programme-cycle-4/)). En 2026-2027, la 4e et la 3e suivent encore le programme de 2015.

Les nouveaux programmes insistent sur les **automatismes** (calcul mental, faits numériques entretenus chaque jour), les fractions, les probabilités et une initiation progressive à l'algèbre : c'est exactement le format d'une séance quotidienne courte.

| Niveau | Nombres et calcul | Grandeurs et mesures | Espace et géométrie | Données, probabilités, algèbre |
| --- | --- | --- | --- | --- |
| CP | Nombres jusqu'à 100, dénombrer, compléments à 10, additions et soustractions simples, problèmes en une étape | Comparer des longueurs, monnaie, lire l'heure (heures pleines) | Se repérer, reconnaître carré, rectangle, triangle, cercle | Lire un tableau simple |
| CE1 | Nombres jusqu'à 1 000, tables d'addition, techniques opératoires +/−, sens de la multiplication, doubles et moitiés | Mesurer en cm et m, monnaie, heures et demi-heures | Règle et équerre, angle droit, axes de symétrie | Tableaux et diagrammes en barres |
| CE2 | Nombres jusqu'à 10 000, tables de multiplication, multiplication posée, division (partage), premières fractions (unitaires) | km, m, cm, mm ; g et kg ; L et cL ; durées | Polygones, cube et pavé, reproduction sur quadrillage | Graphiques simples, problèmes à 2 étapes |
| CM1 | Grands nombres, fractions simples et décimales, décimaux, division posée, calcul mental renforcé | Périmètre, conversions, durées, aire par comptage | Cercle, droites perpendiculaires et parallèles, symétrie | Proportionnalité simple, premières probabilités, pensée algébrique (suites, motifs) |
| CM2 | Décimaux et opérations, fractions (comparer, ajouter de même dénominateur), multiples et diviseurs | Aire du rectangle, conversions, volumes par comptage | Triangles et quadrilatères particuliers, programmes de construction | Pourcentages simples, échelles, probabilités, expressions avec une inconnue |
| 6e | Fractions comme quotient, opérations sur décimaux, priorités opératoires, nombres premiers | Aires (disque inclus), volumes du pavé, angles en degrés | Symétrie axiale, constructions, solides et patrons | Proportionnalité, pourcentages, probabilités, premières expressions littérales |
| 5e | Nombres relatifs, fractions (opérations), puissances de 10 | Aires et volumes (prisme, cylindre), vitesses | Symétrie centrale, triangles, parallélogrammes, inégalité triangulaire | Calcul littéral (simplifier, tester une égalité), ratios, probabilités, statistiques (moyenne) |
| 4e | Puissances, opérations sur relatifs et fractions, notation scientifique | Grandeurs composées, conversions | Pythagore, translations, cosinus | Développer, factoriser simple, équations du 1er degré, fonctions (introduction), statistiques |
| 3e | Arithmétique (PGCD, nombres premiers), racines carrées | Agrandissement et réduction | Thalès, trigonométrie, homothéties, sphère | Fonctions linéaires et affines, équations et inéquations, identités remarquables, probabilités, préparation brevet |

Ce tableau sert de squelette. Le référentiel détaillé (environ 25 à 40 compétences par niveau) sera produit en phase 2 à partir des textes Éduscol, puis relu par un enseignant avant publication.

## Moteur d'exercices

Les exercices sont surtout **générés par du code** (paramètres aléatoires, corrigé calculé), complétés par une banque d'exercices rédigés pour les problèmes et la géométrie. Cela donne un stock quasi infini sans répétition et une correction fiable.

**Types d'exercices (V1)**

| Type | Exemple | Saisie |
| --- | --- | --- |
| Réponse numérique | 7 × 8 = ? | Clavier numérique intégré (pas le clavier système) |
| QCM | Quelle fraction est la plus grande ? | 3 ou 4 boutons |
| Vrai / faux | 0,5 = 1/2 | 2 boutons |
| Placer sur une droite graduée | Place 3/4 | Glisser un curseur |
| Associer / relier | Relie chaque fraction à son dessin | Glisser-déposer |
| Ordonner | Range du plus petit au plus grand | Glisser-déposer |
| Fraction visuelle | Colorie 2/5 de la barre | Toucher les parts |
| Problème rédigé | Léo a 24 billes… | Réponse numérique + unité |
| Géométrie interactive (V1.1) | Trace l'axe de symétrie | Tracé sur grille |

**Structure d'un générateur** (une fonction TypeScript pure par compétence) :

- entrée : niveau de difficulté (1 à 5) et graine aléatoire ;
- sortie : énoncé, données de rendu, bonne réponse, règles d'acceptation (ex. 0,5 = 1/2 = 0.5), indice, explication pas à pas ;
- tests unitaires obligatoires : 1 000 tirages par difficulté sans réponse fausse ni doublon trivial.

**Adaptativité**

- Chaque compétence a un score de maîtrise de 0 à 100 par enfant, mis à jour après chaque réponse (modèle de type Elo : la difficulté de l'item et le niveau de l'enfant s'ajustent mutuellement).
- Statuts : à découvrir → en cours → maîtrisée (≥ 80 sur 2 séances) → à réviser (si la maîtrise baisse avec le temps).
- Composition d'une séance de 15 minutes : environ 40 % compétence en cours, 30 % révisions espacées, 20 % automatismes (calcul mental chronométré), 10 % défi un cran au-dessus.
- Viser environ 75 à 85 % de réussite : si l'enfant enchaîne les erreurs, la difficulté baisse et un mini-rappel de cours s'affiche ; s'il réussit tout, elle monte.
- Une compétence n'est proposée que si ses prérequis sont maîtrisés (graphe de prérequis dans le référentiel).

**Après une erreur** : la bonne réponse et une explication en 1 à 3 étapes, puis un exercice jumeau plus tard dans la séance. Pas de perte de vie bloquante comme Duolingo : à cet âge, une erreur ne doit jamais empêcher de finir la séance.

**Anti-triche simple** : temps minimum par réponse, séance comptée seulement si l'objectif est atteint avec au moins 60 % de réussite, et détection des réponses tapées au hasard (parent averti, sans sanction automatique).

## Test de positionnement

Un test adaptatif de 15 à 25 questions (10 à 15 minutes) place l'enfant compétence par compétence, pas seulement sur sa classe.

1. **Point de départ** : la classe déclarée par le parent.
2. **Balayage** : 1 à 2 questions par domaine clé de la classe (nombres, calcul, fractions, mesures, géométrie, problèmes).
3. **Adaptation** : bonne réponse → question du niveau supérieur dans ce domaine ; erreur → niveau inférieur. Un domaine s'arrête dès que le niveau est encadré.
4. **Sans pression** : pas de chrono visible, pas de note, mascotte encourageante, bouton « Je ne sais pas » (compte comme erreur, évite le hasard).
5. **Résultat enfant** : la carte du monde avec les îles débloquées et la première « mission ».
6. **Résultat parent** : un profil par domaine (« en avance », « au niveau », « à consolider ») et les 3 priorités, par exemple « tables de 7 et 8 », « comparer des fractions ».

Les scores initiaux de maîtrise sont pré-remplis à partir du test : une compétence réussie au niveau supérieur marque aussi ses prérequis comme acquis. Un mini-test de recalage est proposé tous les 3 mois et à chaque rentrée de septembre (changement de classe).

## Gamification

Le moteur de motivation reprend les mécaniques de Duolingo qui fonctionnent pour les enfants (série, progression visible, récompenses fréquentes) et écarte celles qui stressent ou poussent à acheter.

| Mécanique | Règle V1 | Pourquoi |
| --- | --- | --- |
| XP | 10 XP par bonne réponse, bonus de série dans la séance (5 bonnes d'affilée = +10) | Progression visible à chaque geste |
| Niveaux de joueur | Paliers d'XP qui débloquent titres et objets | Objectif à moyen terme |
| Série (flamme) | +1 par jour où la séance est terminée ; jours sans séance prévue ignorés | Habitude quotidienne |
| Gel de série | 1 offert par semaine, d'autres achetables en gemmes | Une absence n'anéantit pas des semaines d'effort |
| Gemmes | Gagnées en séance, coffres et défis ; jamais achetables avec de l'argent réel | Monnaie de la boutique, pas de pay-to-win |
| Coffres | Un coffre à la fin de chaque séance terminée, plus rare tous les 7 jours de série | Surprise et envie de revenir |
| Badges | Environ 40 en V1 : régularité (7, 30, 100 jours), maîtrise (« Roi des tables »), découverte (premier sans-faute), progression (île terminée) | Reconnaissance de l'effort varié |
| Carte du monde | Une île par domaine, un chemin par compétence, boss de fin d'île (mini-évaluation) | Visualise le programme comme une aventure |
| Défis hebdo | Ex. « 3 séances sans-faute cette semaine » → gemmes et badge | Variété |
| Boutique | Tenues, accessoires et décors d'avatar, fonds d'écran, effets de victoire, animaux compagnons | Usage des gemmes, personnalisation |
| Récompenses du parent | Le parent crée des récompenses réelles débloquées par objectif (série, XP, île terminée) ; l'enfant voit sa barre d'avancement ; le parent valide la remise | Fait le lien avec la vie réelle |

**Mascotte** : un personnage original propre à l'app, décliné dans chaque thème, qui accueille, encourage après une erreur et célèbre les réussites.

**Garde-fous** : pas de classement public, pas de vies qui bloquent, pas de pubs, pas d'achat de gemmes, pas de notifications culpabilisantes envoyées à l'enfant (« la mascotte est triste ») : le ton reste positif côté enfant, la relance ferme passe par le parent.

## Personnalisation

Le choix garçon / fille fait à l'inscription présélectionne l'avatar et le thème par défaut ; tous les thèmes et objets restent accessibles à tous, l'enfant change quand il veut.

**Thèmes V1** (chacun change couleurs, typographie, fonds, mascotte, sons et animations de victoire)

| Thème | Ambiance | Exemple de récompense |
| --- | --- | --- |
| Kawaii | Pastels, formes rondes, petits animaux | Chaton compagnon |
| Manga | Contrastes forts, effets de vitesse, onomatopées | Aura de héros |
| Espace | Bleu nuit, planètes, fusée | Nouvelle planète sur la carte |
| Jungle / aventure | Verts, explorateur, temple | Boussole dorée |
| Océan | Bleus, poissons, sous-marin | Pieuvre compagnon |
| Gaming / pixel | Style rétro 8 bits, sons chiptune | Skin pixel |

Tous les visuels sont originaux : aucun personnage ou univers sous licence (pas de Pokémon, Naruto, etc.), ce qui serait refusé par les stores et poserait un risque juridique.

**Avatar** : corps, teint, coiffure, couleur de cheveux, yeux, tenue, accessoire, compagnon. Les éléments de base sont gratuits, les objets rares viennent de la boutique et des badges.

**Implémentation** : un thème = un fichier de tokens (couleurs, rayons, police, sons, fichiers Lottie et images), chargé dynamiquement. Ajouter un thème ne doit demander aucun changement de code d'écran.

**Adapté à l'âge** : en CP-CE1, consignes lues à voix haute (synthèse vocale), gros boutons et peu de texte ; au collège, interface plus sobre, mode sombre et thèmes plus « grands » mis en avant.

## Routine, rappels et suivi parent

Le parent définit une routine par enfant ; le serveur vérifie chaque créneau et déclenche une escalade de notifications tant que la séance n'est pas terminée.

**Réglages de la routine**

- Jours actifs (ex. lundi → vendredi, ou tous les jours) et heure de début, avec un horaire différent possible le mercredi et le week-end.
- Objectif : durée (10, 15, 20 min) ou nombre d'exercices.
- Heure limite (ex. 20 h 30) : au-delà, la journée est comptée « manquée ».
- Mode vacances : routine suspendue sur une période, série protégée.

**Escalade par défaut (modifiable)**

| Moment | Destinataire | Message |
| --- | --- | --- |
| H − 10 min | Enfant | « Ta mission du jour arrive dans 10 minutes » |
| H | Enfant | « C'est l'heure ! Ta série de 12 jours t'attend » (+ verrou si activé) |
| H + 30 min | Enfant | Rappel doux |
| H + 60 min | Parent | « Léa n'a pas encore commencé ses exercices » + bouton « Relancer » |
| Relance manuelle | Enfant | Message du parent, choisi dans une liste ou écrit librement |
| Heure limite | Parent | « Séance manquée aujourd'hui » |
| Fin de séance | Parent | « Léa a terminé : 18/20 en 14 min, série 13 jours » |

**Tableau de bord parent** : pour chaque enfant, statut en direct (pas commencé / en cours / terminé / manqué), score du jour, série, temps passé, et accès aux détails de la séance (questions, erreurs).

Les rappels sont calculés côté serveur (tâche planifiée chaque minute) plutôt que programmés localement : ils restent justes si l'enfant a fini sur un autre appareil, si le parent change l'horaire, ou si le téléphone a été éteint.

## Verrou doux

Le verrou bloque les apps choisies sur le téléphone de l'enfant de l'heure de début jusqu'à la fin de la séance, sans contrôle parental Apple ni Google. L'enfant donne lui-même l'autorisation, peut la retirer, mais le parent en est alerté : c'est un engagement, pas une prison.

**iOS (iOS 16 et plus)**

- API Screen Time d'Apple : FamilyControls avec autorisation `.individual` (donnée par l'utilisateur de l'appareil, sans Partage familial), ManagedSettings pour le blocage, DeviceActivity pour le déclenchement à l'heure prévue même app fermée.
- Le parent choisit sur son téléphone « tout bloquer sauf » ou des catégories (jeux, réseaux sociaux, vidéo) ; la sélection d'apps précises se fait sur le téléphone de l'enfant (les identifiants d'apps d'Apple sont opaques et propres à l'appareil).
- Extension « Shield Configuration » : écran de blocage aux couleurs du thème, message de la mascotte, bouton qui ouvre l'app.
- Déblocage : l'app retire le blocage dès la séance validée ; si la séance a été faite sur un autre appareil, une notification push réveille l'app pour retirer le blocage.
- Appels, Messages (configurable), urgences et l'app elle-même restent toujours accessibles.
- Prérequis : capacité « Family Controls » sur le compte Apple Developer. La version de développement est disponible tout de suite ; la publication sur l'App Store demande une autorisation de distribution à Apple (prévoir plusieurs semaines).
- Module natif Swift intégré via un plugin Expo, ou une librairie existante comme `react-native-device-activity`.

**Android (8 et plus)**

- Pas d'équivalent officiel : un service au premier plan détecte l'app ouverte via UsageStatsManager et affiche un écran de blocage par-dessus (permission « Afficher par-dessus d'autres apps »).
- Permissions à faire accorder pendant l'onboarding, avec écrans d'explication : accès aux données d'utilisation, affichage par-dessus, notifications, exclusion de l'optimisation batterie.
- Éviter le service d'accessibilité, très encadré par Google Play pour ce cas. Préparer les déclarations Play Console nécessaires (permissions sensibles, liste des apps installées).
- Module natif Kotlin intégré via un plugin Expo.

**Web / PC** : pas de blocage possible depuis un navigateur. Rappels par notification web (PWA installée) et par email ; le verrou reste géré sur le téléphone.

**Contournement et transparence**

- L'app envoie un signal de vie au serveur (à chaque ouverture, à chaque déclenchement du planning et au moins une fois par jour).
- Le parent est alerté si l'autorisation est retirée, si les permissions Android sont révoquées ou si plus aucun signal n'arrive depuis 24 h (app supprimée).
- Code de déblocage d'urgence côté parent (débloque à distance pour la soirée).
- Le verrou est désactivable à tout moment par le parent ; l'enfant voit toujours clairement pourquoi une app est bloquée et comment la débloquer.

## Statistiques et récaps

Le parent doit comprendre en 10 secondes si ça va, et en 1 minute où son enfant bloque.

**Écran Progrès (parent)**

- Calendrier du mois : vert = terminé, orange = commencé non terminé, rouge = manqué, gris = jour off ou vacances.
- Courbes : temps par jour, taux de réussite, XP par semaine.
- Maîtrise par domaine (barres) et liste des compétences : maîtrisées, en cours, à consolider.
- « Points de blocage » : les 3 compétences avec le plus d'erreurs ce mois-ci, avec un exemple d'erreur réelle.
- Comparaison au programme : position de l'enfant par rapport aux attendus de sa classe à cette période de l'année.

**Récap hebdomadaire** (notification + email, dimanche soir) : séances faites sur prévues, série, temps total, réussite, une compétence acquise, un point à travailler.

**Récap mensuel** (notification + email + PDF téléchargeable) : régularité du mois (jours faits / sautés, avec les dates), évolution de la maîtrise par domaine, badges gagnés, récompenses débloquées, conseils concrets pour le mois suivant.

**Côté enfant** : une version positive et simple (« Ce mois-ci tu as appris 6 nouvelles choses ! »), sans jours manqués mis en avant.

## Coach IA : comprendre ses erreurs

À chaque erreur, un coach IA explique ce qui s'est passé avec les références de l'enfant (ses jeux, ses passions) puis lui propose un exercice jumeau. Règle d'or : **le code calcule, l'IA raconte**. La bonne réponse, les étapes et le type d'erreur viennent toujours du moteur d'exercices ; l'IA ne fait que reformuler de façon ludique, ce qui évite qu'elle se trompe en maths.

**Déroulé après une erreur**

1. **Diagnostic par le code** : chaque générateur associe les mauvaises réponses typiques à un type d'erreur. Exemple : répondre 0,25 > 0,3 = « compare les chiffres après la virgule comme des entiers » ; 1/2 + 1/3 = 2/5 = « additionne numérateurs et dénominateurs ».
2. **Recherche en cache** : explication déjà validée pour la combinaison compétence × type d'erreur × univers × tranche d'âge ? Elle s'affiche instantanément (cas le plus fréquent).
3. **Sinon, appel IA** avec un prompt contenant : la question, la réponse de l'enfant, la bonne réponse, les étapes de correction, le type d'erreur, la tranche d'âge et 1 ou 2 univers préférés (jamais le prénom ni d'autres données d'identité).
4. **Contrôles automatiques** : les nombres de la réponse IA doivent correspondre au corrigé, longueur maximale respectée, modération (mots interdits + modèle de modération). Échec = explication standard du générateur.
5. **Affichage** : la mascotte présente l'explication, lue à voix haute en CP-CE1.
6. **Exercice jumeau** quelques minutes plus tard pour vérifier que c'est compris.

**Format d'une explication** (3 blocs, moins de 60 mots au total)

- **Ce qui s'est passé** : sans jugement (« Tu as comparé 25 et 3, c'est un piège classique ! »).
- **L'image qui fait comprendre** : une analogie tirée de son univers. Ex. pour un fan de Minecraft : « 0,3 c'est 3 blocs sur 10. 0,25 c'est 25 sur 100, donc 2,5 blocs sur 10. Ta tour de 3 blocs est plus haute ! »
- **L'astuce à retenir** : une phrase courte, réutilisée ensuite dans les rappels (« Ajoute un zéro : 0,30 contre 0,25 »).

Boutons sous l'explication : « J'ai compris », « Explique autrement » (autre analogie ou schéma), « Montre-moi en dessin » (animation du générateur). Les réponses à ces boutons nourrissent le profil (section suivante).

**Comment s'améliorer** : en plus des erreurs, le coach produit un conseil de fin de séance (« Aujourd'hui tu as tout réussi sur les tables de 6, demain on attaque le boss des 7 »), un plan de la semaine et, pour le parent, une phrase concrète sur quoi travailler.

**Garde-fous (enfants)**

- Pas de chat libre en V1 : l'enfant interagit avec le coach uniquement par boutons. Une question libre au coach pourra venir en V2, filtrée par modération et activable par le parent.
- Références à des jeux filtrées par âge : seuls les univers dont la classification PEGI convient à la tranche d'âge sont utilisables. Ex. jamais GTA ou Call of Duty (PEGI 18), même si l'enfant dit y jouer. Fortnite (PEGI 12) uniquement au collège.
- Personnes réelles (YouTubeurs, sportifs, chanteurs) : on peut évoquer leur univers ou leur type de contenu (« comme dans une vidéo de défi »), mais l'IA ne leur fait jamais dire quelque chose ni ne se fait passer pour elles.
- Marques : noms de jeux cités dans le texte uniquement, jamais de logos, personnages ou visuels sous licence.
- Ton toujours bienveillant, tutoiement, pas de moquerie ni de comparaison avec d'autres enfants.

## Choix du modèle IA

Recommandation : **Mistral**, via son API au lancement (Ministral 3 8B ou Mistral Small 4), puis le même modèle Ministral installé sur ton serveur pour la génération de nuit. Mistral est français, hébergé en Europe (simple pour le RGPD avec des données d'enfants) et bon en français. Ses modèles Ministral et Small sont sous licence Apache 2.0, donc installables gratuitement.

**Hypothèse de volume** pour 1 000 enfants actifs : 5 erreurs par jour, 70 % servies par le cache, donc environ 45 000 appels par mois. Chaque appel compte 600 tokens en entrée et 200 en sortie, soit 27 M tokens entrants et 9 M sortants par mois.

| Option | Prix / 1 M tokens (entrée / sortie) | Coût estimé / mois pour 1 000 enfants | Points clés |
| --- | --- | --- | --- |
| [Ministral 3 8B](https://docs.mistral.ai/inference/pricing) (API Mistral) | 0,15 $ / 0,15 $ | ≈ 5 $ | Le moins cher des choix sûrs, UE, poids ouverts (Apache 2.0) |
| [Mistral Small 4](https://docs.mistral.ai/inference/pricing) (API Mistral) | 0,15 $ / 0,60 $ | ≈ 9,50 $ | Meilleure qualité d'écriture, UE, poids ouverts |
| [Gemini 3.1 Flash-Lite](https://ai.google.dev/gemini-api/docs/pricing) (payant) | 0,25 $ / 1,50 $ | ≈ 20 $ | Bon modèle. La version gratuite est exclue : Google y utilise les données pour améliorer ses produits |
| [DeepSeek V4 Flash](https://www.morphllm.com/llm-api-pricing) (via DeepInfra) | 0,09 $ / 0,18 $ | ≈ 4 $ | Très peu cher, mais hébergement hors UE : à éviter pour des données d'enfants |
| [Claude Haiku 4.5](https://www.morphllm.com/llm-api-pricing) | 1,00 $ / 5,00 $ | ≈ 72 $ | Haut de gamme, utile pour générer ou relire la banque d'explications |
| Auto-hébergé sur ton serveur (Ministral 3 8B ou Qwen3-8B) | 0 $ en tokens | Coût du serveur et de l'électricité | Données chez toi ; vitesse dépendante du matériel |

Prix relevés en octobre 2026 ; ils baissent souvent, le back-office permet de changer de modèle sans mise à jour de l'app.

**Ton serveur : ce qu'il peut faire**

- Un modèle de 8B quantifié en Q4 pèse environ 5 Go et demande environ 8 Go de RAM ([Prem AI](https://www.premai.io/blog/best-lightweight-language-models-worth-running/)).
- **Sans carte graphique** (par ex. 4 cœurs, 16 Go), il tourne mais lentement : quelques tokens par seconde, à mesurer sur ta machine. C'est parfait pour **pré-générer la nuit** des milliers d'explications en cache, trop lent pour répondre en direct à beaucoup d'enfants.
- **Avec une carte graphique de 16 à 24 Go de mémoire**, le serveur peut aussi répondre en temps réel.
- Logiciel : Ollama ou llama.cpp (simple, CPU ou GPU), vLLM si GPU et beaucoup d'utilisateurs. Tous exposent une API compatible OpenAI, comme Mistral : passer de l'un à l'autre = changer une URL dans le back-office.

**Architecture retenue**

- Un service `ai-gateway` (Edge Function ou petit serveur Node) reçoit toutes les demandes. Il choisit le fournisseur selon la tâche : temps réel = API Mistral ; pré-génération de nuit = ton serveur, avec Mistral en secours. Il applique les plafonds de budget et journalise coût et latence.
- Modération : Mistral Moderation (gratuit selon la page tarifs de Mistral) en plus d'une liste de mots interdits.
- Mode dégradé : si l'IA est indisponible ou le budget atteint, l'app affiche l'explication standard du générateur. L'app ne dépend jamais de l'IA pour fonctionner.

## Profil d'apprentissage évolutif

Chaque enfant a un profil vivant qui décrit ce qu'il sait, comment il apprend et ce qu'il aime. Il est recalculé chaque nuit et le suit du CP à la 3e, puis au lycée.

**Ce que contient le profil**

| Volet | Contenu | Source |
| --- | --- | --- |
| Maîtrise | Score 0-100 par compétence (voir moteur) | Réponses |
| Forces | Domaines au-dessus de son niveau de classe, vitesse en calcul mental, séries de sans-faute | Réponses et chronos |
| Points à travailler | Types d'erreurs récurrents (ex. « oublie la retenue »), compétences qui redégradent | Diagnostic des erreurs |
| Façon d'apprendre | Explications qui marchent (analogie, schéma, étapes), durée d'attention, meilleur moment de la journée, réaction après une erreur (persévère, abandonne, répond au hasard) | Boutons du coach, réussite des exercices jumeaux, horaires |
| Centres d'intérêt | Jeux, créateurs de contenu, sports, musique, séries / mangas, animaux, métier rêvé | Questionnaire « Ton univers » |

**Questionnaire « Ton univers »**

- Proposé après le test de positionnement, sous forme de jeu (cartes à balayer ou à toucher), 1 à 2 minutes, facultatif.
- Questions et choix gérés depuis le back-office et adaptés à l'âge : « À quels jeux tu joues ? », « Tes chaînes YouTube préférées ? », « Ton sport ? », « Ce que tu regardes (dessins animés, mangas, séries) ? », « Ta musique ? », « Plus tard tu voudrais faire… ? ».
- Choix dans des listes avec icônes neutres. Au collège, un champ « Autre » en texte libre, modéré, qui remonte au back-office pour repérer les nouvelles tendances.
- Redemandé tous les 3 mois (« Tes goûts ont changé ? ») et à chaque rentrée. L'enfant peut le modifier quand il veut dans son profil.
- Le parent voit les réponses, peut les modifier ou désactiver la personnalisation (le coach utilise alors des exemples de la vie courante : cuisine, sport, argent de poche, voyages).

**Comment l'app apprend en continu**

1. Chaque événement est enregistré : réponse, temps, type d'erreur, bouton du coach, réussite du jumeau.
2. Une tâche de nuit recalcule le profil et en tire un **résumé compact** (environ 150 mots) : « CM2, fort en calcul mental, confond aire et périmètre, comprend mieux avec des schémas, aime Minecraft et le foot ». Ce résumé est envoyé à l'IA, jamais l'historique brut.
3. **Boucle de qualité** : chaque variante d'explication est notée (compris ou non, jumeau réussi ou non). Pour cet enfant, les styles qui marchent sont privilégiés ; pour tous, les meilleures explications du cache remontent et les mauvaises sont retirées.
4. Au changement de classe, le profil est conservé : les compétences de l'année précédente passent en révision espacée et le test de recalage cible les points fragiles.

**Mise en valeur des forces** : l'enfant voit son « super-pouvoir » (« Roi du calcul mental ») et le parent reçoit les forces avant les faiblesses dans chaque récap.

**RGPD** : les centres d'intérêt et le profil d'apprentissage sont du profilage de mineurs. On l'explique clairement au parent, qui y consent à part. Aucun usage publicitaire ni revente. Données pseudonymisées avant tout appel IA. Export et suppression à tout moment.

## Mini-jeux éducatifs

Les mini-jeux transforment une notion en défi d'arcade de 2 à 4 minutes. Ils se débloquent sur la carte du monde et comptent dans la séance du jour (au plus 30 % du temps), puis restent jouables librement après la séance.

| Mini-jeu | Notion | Classes | Mécanique |
| --- | --- | --- | --- |
| Course turbo | Calcul mental, tables | CP → 3e | Course contre des fantômes : chaque bonne réponse rapide donne un boost |
| Tour de blocs | Compléments à 10, 100, 1 000 | CP → CE2 | Empiler des blocs dont la somme doit tomber juste |
| L'horloge folle | Lire l'heure, durées | CP → CM1 | Remettre les aiguilles avant que le réveil sonne |
| Le marché | Monnaie, décimaux, rendu de monnaie, soldes en % | CE1 → 4e | Tenir une boutique et rendre la monnaie aux clients |
| Donjon des tables | Tables de multiplication, division | CE2 → 6e | Ouvrir des portes avec la bonne réponse, boss par table |
| Pizzeria des fractions | Fractions : partager, comparer, additionner | CE2 → 5e | Couper et servir des parts selon les commandes |
| Tir à l'arc | Droite graduée : décimaux, fractions, relatifs | CM1 → 4e | Viser le bon point sur une droite qui bouge |
| Bâtisseur | Périmètres, aires, volumes | CM1 → 5e | Construire une maison avec un budget de matériaux |
| Miroir magique | Symétries axiale et centrale | CE1 → 5e | Compléter un dessin pixel par symétrie |
| Agent secret | Problèmes, logique, probabilités | CM2 → 3e | Résoudre des indices pour découvrir le code |
| Escape room algèbre | Équations, calcul littéral | 5e → 3e | Chaque équation résolue ouvre un cadenas |
| Rampe de skate | Pythagore, trigonométrie | 4e → 3e | Calculer la bonne longueur ou le bon angle pour réussir le saut |

**Règles de conception**

- Chaque mini-jeu tire ses questions du moteur d'exercices (mêmes générateurs, même difficulté adaptative), et ses résultats mettent à jour la maîtrise. Une nouvelle compétence peut ainsi se brancher sur un jeu existant.
- Rejouable : score, étoiles (1 à 3), record personnel. Pas de classement public.
- Visuels 100 % originaux, déclinés par thème (la pizzeria devient une cantine spatiale dans le thème Espace).
- Technique : React Native Skia + Reanimated pour un rendu 2D identique sur iOS, Android et web. Un mini-jeu = un module avec une interface commune (`start`, `onAnswer`, `onEnd`).
- V1 : 4 jeux (Course turbo, Donjon des tables, Pizzeria des fractions, Le marché). Les autres arrivent progressivement, activables depuis le back-office.

## Mode scroll « Les maths dans la vraie vie »

Un fil de vidéos verticales courtes (15 à 60 s) qui montre les maths dans l'actualité et le quotidien. L'enfant regarde, se pose une question, puis touche « Pourquoi ? » pour obtenir l'explication en texte ou en vidéo. Il garde les codes de TikTok, mais pas son effet « scroll infini ».

**Exemple : les bouchons des vacances**

1. Vidéo d'accroche (20 s) : une autoroute bloquée un jour de départ en vacances. Question à l'écran : « Pourquoi on s'arrête alors qu'il n'y a aucun accident ? »
2. Bouton **« Pourquoi ? »** : explication adaptée à l'âge.
   - Primaire : distance de sécurité, temps de réaction, une voiture qui freine fait freiner celles de derrière, toujours un peu plus fort.
   - Collège : vitesse = distance ÷ temps, débit = voitures par minute, l'« onde de freinage » qui remonte la file.
3. **À toi de jouer** : 1 à 3 questions liées (« Une voiture roule à 90 km/h. Quelle distance parcourt-elle en 1 seconde de réaction ? »), qui rapportent XP et gemmes et mettent à jour la maîtrise.

**Formats de réponse**, au choix de l'éditeur dans le back-office :

- texte court illustré (carte à faire défiler, avec schéma ou image) ;
- vidéo explicative ;
- les deux, plus le quiz « À toi de jouer » (recommandé pour que le scroll reste de l'apprentissage).

**Idées de vidéos par saison** : bouchons et consommation d'essence (vacances), soldes et pourcentages (janvier, juillet), budget de rentrée (septembre), scores et statistiques d'un match (Coupe du monde, Ligue 1), températures et relatifs (hiver), recette de crêpes et proportions (Chandeleur), probabilité de pluie (météo), records sportifs et vitesses (JO), batterie du téléphone (pourcentages), pizza partagée (fractions).

**Garde-fous**

- Fil limité, pas infini : il se débloque après la séance du jour, avec 5 vidéos par jour par défaut (réglable par le parent). À la fin : « Tu as tout vu pour aujourd'hui ».
- Contenus publiés uniquement par l'équipe via le back-office : aucune vidéo envoyée par les utilisateurs, aucun commentaire, aucun like public.
- Droits d'auteur : pas d'extraits de JT ou de vidéos YouTube réutilisés sans autorisation. On utilise des images tournées soi-même, des banques libres de droits (avec licence conservée), des animations maison ou de la vidéo générée par IA, signalée comme telle.
- Pas d'intégration YouTube (publicités, pistage, recommandations) : les vidéos sont hébergées sur un service de streaming (Bunny Stream, Mux ou Cloudflare Stream) ou dans Supabase Storage au début.
- Sous-titres obligatoires (et lecture possible sans le son).

**Recommandation du fil** : priorité aux vidéos de l'actualité du moment (dates de publication et d'expiration), puis à celles liées aux points à travailler de l'enfant et à ses centres d'intérêt, filtrées par niveau. Les vidéos déjà vues ne reviennent pas, sauf en révision.

**Technique** : lecteur vertical avec expo-video et une liste virtualisée (préchargement de la vidéo suivante), format HLS adaptatif, vignette et durée affichées, statistiques de visionnage (vue, vue à 80 %, « Pourquoi ? » ouvert, quiz réussi).

## Centres d'intérêt des CE1 → 3e

Le jeu vidéo est la référence commune : selon le SELL, 92 % des 10-17 ans jouent et 84 % des enfants jouent avec d'autres ([Blog du Modérateur, sept. 2025](https://www.blogdumoderateur.com/jeu-video-france-profils-joueurs-usages-2025/)). Roblox et Minecraft sont dans le top 3 des marques préférées des garçons de 7 à 14 ans, juste derrière Marvel ([BrandTrends via Kidscreen, 2024](https://kidscreen.com/?p=208451)). Chez les 11-14 ans, les personnalités préférées sont Squeezie (27 %), Inoxtag (25 %) et Soprano (24 %), devant Gims, Michou, Mbappé, Bigflo & Oli et Jul ([baromètre Okapi / Junior City, janv. 2026](https://www.cbnews.fr/node/98111)).

Il existe peu d'études publiques récentes par jeu pour les 7-10 ans. Les lignes non sourcées ci-dessous sont donc des **valeurs de départ à valider**, puis à remplacer par les réponses réelles du questionnaire « Ton univers », qui deviendra ta meilleure source.

| Tranche | Jeux vidéo | Créateurs et personnalités | Autres univers | Ton du coach |
| --- | --- | --- | --- | --- |
| CE1-CE2 (7-8 ans) | Minecraft, Roblox (sourcés) ; Mario Kart, Pokémon, Just Dance (à valider) | Chaînes famille et gaming tout public, chanteurs (Soprano, Bigflo & Oli) | Dessins animés, animaux, foot, Lego | Phrases très courtes, onomatopées, mascotte très présente, voix off |
| CM1-CM2 (9-10 ans) | Minecraft, Roblox (sourcés) ; Brawl Stars, Pokémon, EA Sports FC, Stumble Guys (à valider) | Squeezie, Michou, Inoxtag (connus dès cet âge) | Mangas pour enfants, foot et PSG, K-pop, défis | Fun et un peu décalé, défis, « niveau débloqué » |
| 6e-5e (11-12 ans) | Roblox, Minecraft (sourcés) ; Fortnite à partir de 12 ans (PEGI 12), Brawl Stars, Clash Royale, EA Sports FC (à valider) | Squeezie, Inoxtag, Michou, Soprano, Gims (sourcés) | Mangas (shonen), foot (Mbappé), rap et pop française, TikTok | Complice, vocabulaire gaming (« combo », « boss », « speedrun »), pas trop enfantin |
| 4e-3e (13-15 ans) | Fortnite, EA Sports FC, Roblox, jeux compétitifs mobiles (à valider) | Squeezie, Inoxtag, Gims, Jul (sourcés, 11-14 ans) | Mangas et anime, sport, musique, sneakers, brevet | Sobre et direct, humour léger, liens avec la vie réelle (argent, sport, réseaux), jamais « gamin » |

**Exemples de la vie courante** (toujours disponibles, et utilisés si l'enfant n'a pas rempli le questionnaire) : argent de poche et soldes, recettes de cuisine (proportions), score d'un match, batterie du téléphone (pourcentages), trajet en bus (durées), partage d'une pizza ou d'un gâteau (fractions).

**À éviter** : jeux PEGI 16-18 (GTA, Call of Duty…) quelle que soit la réponse de l'enfant, jeux d'argent et casinos, drames ou polémiques autour d'un créateur. Les tendances bougent vite : chaque référence a une date de revue dans le back-office (tous les 3 mois).

## Back-office d'administration

Une app web réservée à l'équipe (`apps/admin`, Next.js + Supabase, accès par rôle) permet de faire évoluer tendances, IA et contenus sans publier de mise à jour de l'app.

| Module | Ce qu'on peut faire |
| --- | --- |
| Tendances et univers | Catalogue des références (jeux, créateurs, sports, musique, séries, mangas) avec catégorie, tranches d'âge autorisées, âge minimum ou PEGI, statut (actif, en test, retiré), mots et images mentales associés, date de prochaine revue. Activation ou retrait en un clic, alerte quand une revue est dépassée. |
| Radar des tendances | Graphiques des choix du questionnaire par tranche d'âge et par mois, top des réponses « Autre » pour repérer les nouveaux jeux ou créateurs, bouton « Ajouter au catalogue ». |
| Questionnaire « Ton univers » | Questions, choix et icônes par tranche d'âge, ordre, fréquence de re-sondage. |
| Événements saisonniers | Thèmes et défis temporaires (Halloween, Noël, Coupe du monde, brevet blanc) avec dates de début et de fin. |
| IA : modèles et budget | Fournisseur et modèle par tâche (temps réel, nuit, relecture), URL du serveur auto-hébergé, plafond de dépense journalier et mensuel, tableau des coûts par enfant, interrupteur d'urgence (explications standard uniquement). |
| IA : prompts | Modèles de prompts versionnés par tâche et tranche d'âge, test en direct sur une erreur exemple, A/B test entre deux versions. |
| IA : relecture et qualité | File des explications générées à valider ou rejeter, classement des explications par taux de compréhension, mots interdits, journal de modération. |
| Pédagogie | Référentiel des compétences et prérequis, catalogue des types d'erreurs, activation des générateurs et des mini-jeux, réglages de difficulté. |
| Gamification | Badges, objets de la boutique, prix en gemmes, thèmes. |
| Familles et RGPD | Recherche pseudonymisée, demandes d'export ou de suppression, retours des parents. |
| Indicateurs | Enfants actifs, rétention à 7 et 30 jours, séries moyennes, taux de réussite par compétence, compétences qui bloquent le plus, coût IA. |
| Vidéos (mode scroll) | Ajouter une vidéo d'accroche (upload, vignette, sous-titres, titre, question à l'écran). Choisir le type de réponse : texte (éditeur avec images et schémas), vidéo explicative (upload) ou les deux. Une réponse par tranche d'âge possible. Ajouter 1 à 3 questions « À toi de jouer » (écrites à la main ou liées à un générateur). Renseigner compétences, niveaux, centres d'intérêt, source et licence de chaque média, dates de publication et d'expiration (actualité). Gérer les statuts brouillon, à relire, publié, archivé. Aperçu téléphone avant publication et statistiques par vidéo (vues, « Pourquoi ? » ouvert, réussite au quiz). |

**Rôles** : super-admin (tout), éditeur pédagogique (contenus, prompts, tendances), modérateur (relecture IA, réponses « Autre »). Chaque modification est tracée (qui, quand, avant / après).

**Tables à ajouter au modèle de données**

| Table | Champs principaux |
| --- | --- |
| universes | name, category, min\_age, grades (text\[\]), status, vocabulary (json), review\_at |
| interest\_questions / interest\_options | question, grade\_band, order / question\_id, universe\_id, icon |
| child\_interests | child\_id, universe\_id, source (questionnaire / parent), answered\_at |
| error\_types | skill\_code, code, label, description |
| child\_error\_stats | child\_id, error\_type, count, last\_seen\_at |
| learner\_profiles | child\_id, strengths (json), weaknesses (json), learning\_style (json), summary (text), computed\_at |
| explanations | skill\_code, error\_type, universe\_id, grade\_band, content, model, prompt\_version, status (pending / approved / rejected), score |
| explanation\_feedback | explanation\_id, child\_id, understood, twin\_correct |
| ai\_settings / ai\_prompts / ai\_usage | fournisseur et modèle par tâche, plafonds / task, version, template / date, model, tokens\_in, tokens\_out, cost |
| admin\_audit\_log | admin\_id, entity, before, after, at |
| videos | title, hook\_question, stream\_id, thumbnail\_url, captions\_url, duration\_s, grades (text\[\]), skill\_codes (text\[\]), universe\_ids, answer\_type (text / video / both), media\_source, license, publish\_at, expire\_at, status |
| video\_answers / video\_quiz\_items | video\_id, grade\_band, text\_content (json), answer\_stream\_id / video\_id, prompt, answer, generator, difficulty |
| video\_views | child\_id, video\_id, watched\_pct, answer\_opened, quiz\_correct, viewed\_at |

## Architecture technique

Un seul code Expo (React Native + react-native-web) produit les apps iOS, Android et web ; Supabase fournit authentification, base, temps réel et tâches planifiées, hébergé en Europe.

| Brique | Choix | Rôle |
| --- | --- | --- |
| App | Expo SDK récent, TypeScript strict, Expo Router | iOS, Android, web depuis le même code |
| UI | NativeWind (Tailwind) + tokens de thème, Reanimated, Lottie, expo-haptics, expo-av | Thèmes dynamiques, animations de récompense |
| État | TanStack Query (données serveur) + Zustand (état local) | Cache, mode hors-ligne léger |
| Hors-ligne | File d'attente locale des réponses (MMKV), synchronisée au retour du réseau | Séance jouable sans réseau |
| Backend | Supabase : Postgres + RLS, Auth, Realtime, Edge Functions (Deno), pg\_cron | Comptes, données, statut en direct, rappels |
| Notifications | Expo Push (APNs / FCM) + Web Push pour la PWA | Rappels et alertes |
| Emails | Resend (ou Brevo) + modèles React Email | Récaps hebdo et mensuels |
| PDF | Génération côté serveur dans une Edge Function | Récap mensuel téléchargeable |
| Modules natifs | Plugin Expo + Swift (FamilyControls, extensions) ; Kotlin (UsageStats, overlay) | Verrou doux |
| Paiement | RevenueCat (abonnements iOS, Android, web via Stripe) | Formule Premium |
| Qualité | Jest + tests des générateurs, Maestro (tests E2E mobile), Sentry | Fiabilité |
| Build | EAS Build, EAS Update, EAS Submit ; web sur Vercel ou Netlify | Livraison |

**Organisation du dépôt (monorepo pnpm)**

```
apps/
  mobile/            # app Expo (iOS, Android, web)
  admin/             # back-office Next.js (tendances, IA, contenus)
services/
  ai-gateway/        # routage IA (Mistral / serveur perso), cache, modération, budget
packages/
  curriculum/        # référentiel : niveaux, domaines, compétences, prérequis (JSON + types)
  exercise-engine/   # générateurs, correcteurs, moteur adaptatif (TS pur, testé)
  ui/                # composants partagés + système de thèmes
  shared/            # types, schémas Zod, constantes
modules/
  soft-lock/         # module natif Expo : Swift (iOS) + Kotlin (Android)
supabase/
  migrations/        # schéma SQL + politiques RLS
  functions/         # edge functions : reminders, recap-weekly, recap-monthly, pairing
```

Le moteur d'exercices est du TypeScript pur sans dépendance à React : il tourne dans l'app (rapide, hors-ligne) et peut être réutilisé côté serveur pour vérifier les résultats.

## Modèle de données

Toutes les tables portent `id` (uuid), `created_at`, `updated_at` ; les politiques RLS limitent chaque parent à sa famille et chaque appareil enfant à son profil.

| Table | Champs principaux | Notes |
| --- | --- | --- |
| families | name, plan, timezone | Un foyer, porte l'abonnement |
| parents | user\_id (auth), family\_id, role (owner / co\_parent), display\_name | Comptes adultes |
| children | family\_id, display\_name, gender (girl / boy), grade (CP…3e), birth\_year?, theme\_id, avatar (json), pin\_hash? | Aucune donnée d'identité réelle obligatoire |
| devices | child\_id, platform, push\_token, pairing\_status, last\_heartbeat\_at, lock\_capable, lock\_authorized | Appairage et verrou |
| pairing\_codes | family\_id, child\_id, code, expires\_at, used\_at | QR / code 6 caractères |
| routines | child\_id, days (int\[\]), start\_time, deadline\_time, goal\_type, goal\_value, weekend\_overrides (json), lock\_enabled, lock\_scope | Une routine active par enfant |
| vacations | child\_id, from\_date, to\_date | Série protégée |
| skills | code, subject, grade, domain, title, prerequisites (text\[\]), program\_version | Référentiel (seed depuis packages/curriculum) |
| child\_skill\_mastery | child\_id, skill\_code, mastery (0-100), elo, status, last\_practiced\_at | Cœur de l'adaptatif |
| sessions | child\_id, date, kind (daily / bonus / placement / boss), started\_at, completed\_at, goal\_met, score, duration\_s | Une ligne par séance |
| attempts | session\_id, skill\_code, generator, difficulty, seed, answer, is\_correct, time\_ms | Permet de rejouer et d'analyser une erreur |
| progress | child\_id, xp, level, gems, streak\_current, streak\_best, freezes | Compteurs de jeu |
| badges / child\_badges | code, title, rule (json) / child\_id, badge\_code, earned\_at | Badges |
| shop\_items / child\_items | code, kind, theme\_id, price\_gems / child\_id, item\_code, equipped | Boutique |
| rewards | child\_id, title, condition\_type, condition\_value, status (locked / unlocked / given) | Récompenses du parent |
| notifications\_log | target, type, sent\_at, payload | Évite les doublons de rappels |
| lock\_events | device\_id, event (enabled / revoked / heartbeat\_missed / unlocked), at | Alertes au parent |

Les calculs sensibles (XP, gemmes, série, validation de séance) se font dans des fonctions Postgres ou Edge Functions, jamais uniquement côté client, pour éviter la triche.

## RGPD, sécurité et stores

L'app traite des données de mineurs : on collecte le strict minimum, c'est le parent qui consent, et rien n'est partagé avec des tiers à des fins publicitaires.

**RGPD (France / UE)**

- En France, un mineur de moins de 15 ans ne peut consentir seul : le compte enfant est créé par le parent, qui donne le consentement à l'inscription (case explicite, horodatée, conservée).
- Données enfant limitées : pseudo, classe, garçon / fille, avatar, résultats. Ni nom de famille, ni photo, ni géolocalisation, ni email.
- Hébergement UE (projet Supabase en région européenne), sous-traitants listés dans la politique de confidentialité.
- Droits : export des données et suppression complète du compte et des profils depuis l'app parent.
- Durées de conservation : réponses détaillées 24 mois, agrégats tant que le compte existe ; suppression des comptes inactifs après 3 ans.
- Politique de confidentialité écrite pour les parents, plus une version courte et simple pour les enfants.
- À faire valider par un juriste avant publication (registre de traitement, analyse d'impact si besoin).

**Sécurité**

- RLS Supabase sur toutes les tables, tests automatisés des politiques.
- Jetons d'appareil enfant révocables, PIN enfant hashé, aucune clé secrète dans l'app.
- Actions sensibles côté parent protégées (désactiver le verrou, supprimer un enfant) par une confirmation ou Face ID.

**Stores**

- Apple : si l'app vise les enfants, pas de SDK publicitaire ni d'analytics tiers dans la partie enfant, et un « contrôle parental » (petite question réservée aux adultes) avant tout lien externe, achat ou réglage. Prévoir l'autorisation Family Controls pour la distribution.
- Google Play : programme Familles (Designed for Families), questionnaire sur le public cible, déclarations pour les permissions sensibles du verrou.
- Achats : abonnements via les stores sur mobile (obligatoire), Stripe sur le web.
- Classement d'âge : 4+ (Apple) / Tout public (Google).

## Plan de développement avec Claude Code

On construit par phases courtes, chacune testable par ta fille : d'abord une boucle complète simple (parent → enfant → séance → notification), ensuite la richesse.

| Phase | Contenu | Critère de validation |
| --- | --- | --- |
| 0. Socle | Monorepo, Expo + web, Supabase local, CI, système de thèmes vide, CLAUDE.md | L'app démarre sur iPhone, Android et navigateur ; tests verts |
| 1. Comptes | Auth parent, création enfant, appairage QR, sélection de profil | Un parent appaire un téléphone enfant en moins de 2 min |
| 2. Référentiel + moteur | Compétences CE2 → 5e d'abord (cœur des difficultés), 30 générateurs, correcteur, tests de 1 000 tirages | Zéro réponse fausse sur les tests ; ajout d'un générateur en moins de 30 lignes |
| 3. Séance et adaptatif | Écran exercice, clavier intégré, composition de séance, maîtrise Elo, hors-ligne | Une séance de 15 min jouable sans réseau, synchronisée ensuite |
| 4. Routine et rappels | Réglages parent, pg\_cron, escalade, tableau de bord temps réel | Rappel parent reçu à H+60 si séance non faite, même app enfant fermée |
| 5. Gamification | XP, série, gel, gemmes, coffres, badges, carte du monde, boutique, récompenses parent ; recorrection côté serveur obligatoire avant d’attribuer XP et gemmes | Fin de séance avec animation, série et coffre corrects sur 7 jours simulés |
| 6. Thèmes et avatars | 3 thèmes complets (kawaii, manga, espace), éditeur d'avatar, mascotte | Changer de thème ne demande aucun code d'écran |
| 7. Positionnement | Test adaptatif, carte des résultats, pré-remplissage de la maîtrise | Résultat cohérent pour 3 profils d'élèves simulés |
| 7b. Profil et univers | Questionnaire « Ton univers », types d'erreurs par générateur, profil d'apprentissage recalculé chaque nuit, résumé compact | Forces et points à travailler cohérents sur 3 profils simulés ; parent peut modifier ou désactiver |
| 7c. Coach IA + back-office | ai-gateway (Mistral + serveur perso), cache et pré-génération de nuit, contrôles et modération, apps/admin (tendances, prompts, budget, relecture) | 100 % des explications affichées ont des nombres conformes au corrigé ; l'app fonctionne avec l'IA coupée ; une tendance ajoutée dans l'admin apparaît sans mise à jour |
| 8. Verrou doux | Module iOS (FamilyControls + extensions), module Android, signal de vie, alertes | Blocage à l'heure, levée à la validation, alerte si autorisation retirée |
| 9. Récaps | Statistiques parent, emails hebdo / mensuel, PDF | Récap mensuel correct sur un mois de données simulées |
| 9b. Mini-jeux | Socle Skia commun + 4 jeux V1 (Course turbo, Donjon des tables, Pizzeria des fractions, Le marché) | 60 fps sur un téléphone d'entrée de gamme ; les résultats mettent à jour la maîtrise |
| 9c. Mode scroll | Hébergement vidéo (Bunny / Mux), lecteur vertical, écran « Pourquoi ? » texte ou vidéo, quiz, module Vidéos du back-office, 10 premières vidéos | Une vidéo ajoutée dans l'admin apparaît dans le fil sans mise à jour ; limite quotidienne respectée ; lecture fluide en 4G |
| 10. Publication | Compléter CP-CE1 et 6e-3e, RGPD, RevenueCat, fiches stores, tests Maestro | Validé par App Store et Google Play |

**Conseils pour travailler avec Claude Code**

- Colle ce cahier des charges dans `docs/specs.md` et fais référence à la section de la phase en cours dans chaque demande.
- Demande d'abord un `CLAUDE.md` : conventions (TypeScript strict, pas de `any`, tests obligatoires pour le moteur, français pour l'UI, anglais pour le code), commandes du projet, structure du dépôt.
- Une phase = une branche ; termine chaque phase par « liste ce qui manque par rapport au critère de validation ».
- Pour le verrou iOS, il faut un vrai iPhone (pas de simulateur) et un build de développement EAS ; garde cette phase pour quand tout le reste tourne.

**Premier prompt à donner à Claude Code**

```
Lis docs/specs.md en entier. Nous attaquons la phase 0.
Mets en place un monorepo pnpm avec : apps/mobile (Expo, Expo Router, TypeScript strict, NativeWind, web activé), packages/shared, packages/curriculum, packages/exercise-engine, packages/ui, et supabase/ (CLI, migrations vides).
Ajoute un système de thèmes par tokens avec un thème "kawaii" provisoire, un écran d'accueil "Je suis un parent / Je suis un enfant", Jest configuré, et un CLAUDE.md qui documente conventions et commandes.
Ne code rien au-delà de la phase 0. Termine par la liste des commandes pour lancer l'app sur iOS, Android et web.
```

## Questions ouvertes

- [ ] Nom de l'app et de la mascotte.
- [ ] Modèle économique : gratuit pour 1 enfant + Premium (plusieurs enfants, verrou, récaps PDF, tous les thèmes) ? Prix cible ?
- [ ] Qui relit le référentiel et les exercices : un enseignant de primaire et un de collège ?
- [ ] Ordre de couverture des niveaux : commencer par la classe de ta fille, puis élargir ?
- [ ] Voix off pour les CP-CE1 : synthèse vocale ou enregistrements ?
- [ ] Ton serveur a-t-il une carte graphique ? Cela décide si l'IA peut y répondre en temps réel ou seulement pré-générer la nuit.
- [ ] Messages autorisés pendant le verrou (Messages, WhatsApp pour joindre les parents) ?

## Sources

- [Publication du nouveau programme de cycle 4 – académie de Bordeaux](https://ent2d.ac-bordeaux.fr/disciplines/mathematiques/publication-du-nouveau-programme-cycle-4/)
- [Le programme de cycle 3 à partir de 2025 – académie de Bordeaux](https://ent2d.ac-bordeaux.fr/disciplines/mathematiques/le-programme-de-cycle-3-a-partir-de-2025/)
- [Nouveaux programmes au collège, rentrée 2026 – Digischool](https://www.digischool.fr/articles/college/nouveaux-programmes-college-2026/)
- [Lettre de rentrée 2026 mathématiques – académie de Nancy-Metz](https://sites.ac-nancy-metz.fr/mathematiques/wp-content/uploads/Lettre-de-rentree-2026-Mathematiques.pdf)
- Textes de référence à télécharger pour la phase 2 : programmes et « exemples de réussite » par niveau sur [Éduscol](https://eduscol.education.gouv.fr).

Coach IA, modèles et tendances :

- [Tarifs API Mistral](https://docs.mistral.ai/inference/pricing)
- [Tarifs API Gemini – Google](https://ai.google.dev/gemini-api/docs/pricing)
- [LLM API Pricing 2026 – Morph](https://www.morphllm.com/llm-api-pricing)
- [Petits modèles à faire tourner soi-même – Prem AI](https://www.premai.io/blog/best-lightweight-language-models-worth-running/)
- [Les Français et le jeu vidéo 2025 (SELL) – Blog du Modérateur](https://www.blogdumoderateur.com/jeu-video-france-profils-joueurs-usages-2025/)
- [Roblox et Minecraft marques préférées des enfants – Kidscreen](https://kidscreen.com/?p=208451)
- [Squeezie personnalité préférée des 11-14 ans – CB News](https://www.cbnews.fr/node/98111)
