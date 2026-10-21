# Mini-jeux du compagnon (phase 9b)

Tous les mini-jeux se jouent avec **le compagnon équipé** de l'enfant (voir `compagnons.md`) : c'est lui le personnage du jeu. Sans compagnon équipé, la Chouette Galactique (gratuite) le remplace.
Style : 2D, très kawaii, couleurs pastel. Visuels dans `docs/design/jeux/` (fonds, objets) et `docs/design/compagnons/` (personnages).

Principe commun : **arcade + maths**. Le réflexe fait le plaisir, la bonne réponse fait le score. Les questions viennent du moteur d'exercices (mêmes générateurs, difficulté adaptée à l'enfant), et les réponses mettent à jour la maîtrise. Parties de 1 à 3 minutes.

## V1 : 6 jeux

| Jeu | Mécanique | Les maths dedans | Visuels |
|---|---|---|---|
| **Pêche éclair** | Le compagnon pêche au bord du lac. Le bouchon plonge : il faut appuyer vite sur « Pêcher ! ». Trop tôt ou trop tard, le poisson s'échappe. | Chaque poisson porte un nombre ; une question s'affiche (ex. 7 × 8). On ne pêche que le poisson qui porte la bonne réponse. Bonus de rapidité. | fond-peche, poisson, bouchon |
| **Pluie de gemmes** | Le compagnon glisse à gauche/droite (doigt ou inclinaison) pour attraper croquettes et gemmes qui tombent. Les bombes font perdre un cœur (3 cœurs). | Les gemmes portent des réponses à la question affichée : bonne gemme = gros bonus, mauvaise gemme = elle se transforme en bombe. Les croquettes donnent des petits points. | fond-pluie, gemme, croquettes, bombe, coeur |
| **Vol du Chaton** (style Flappy) | Le Chaton Cosmique vole : on tape pour battre des ailes, il faut passer entre les piliers de nuages. | Tous les 3 piliers, deux passages avec deux réponses : il faut passer par le bon. Vitesse douce au début, plus rapide ensuite. | fond-vol, pilier-nuage, bulle, chat (compagnon) |
| **Bulles magiques** | Des bulles montent avec des nombres. | Toucher les bulles dont la somme fait le nombre cible (compléments, additions, puis multiplications). | fond-pluie, bulle |
| **Memory du compagnon** | Cartes retournées, trouver les paires. | Paires calcul ↔ résultat (ex. 3 × 4 ↔ 12, ½ ↔ 0,5). Chrono doux. | bulle, compagnon au dos des cartes |
| **Course des croquettes** | Le compagnon court sur 3 couloirs, on glisse pour changer de couloir. | Des portes avec 3 réponses arrivent : prendre le couloir de la bonne. Croquettes à ramasser entre les portes. | fond-pluie, croquettes |

## Règles

- Score, 1 à 3 étoiles, record personnel. Pas de classement public.
- Récompenses : XP selon les bonnes réponses ; gemmes plafonnées par jour (ex. 20) pour que les jeux ne remplacent pas les séances.
- Compte dans la séance du jour au plus 30 % du temps ; ensuite jouable librement, avec une limite quotidienne réglable par le parent.
- Le compagnon réagit : saute de joie sur une bonne réponse, petite tête triste (jamais punitive) sur une erreur.
- « Réduire les animations » : vitesses plus lentes, pas de secousses d'écran.
- Sons et vibrations légers, coupables.
- Chaque jeu = un module avec la même interface (`start`, `onAnswer`, `onEnd`), activable/désactivable depuis le back-office.
