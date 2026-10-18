# App maths enfants — instructions pour Claude Code

App d'exercices de maths (CP → 3e) pour iOS, Android et web, avec comptes parent / enfant, gamification, coach IA et verrou doux.
Le cahier des charges complet est dans `docs/specs.md` : lis la section de la phase en cours avant de coder.

## Skills Expo (obligatoire)

- Pour toute tâche Expo ou EAS, charge d'abord le skill `expo-overview`, puis le skill spécialisé qu'il indique. Ne code jamais de l'Expo de mémoire quand un skill couvre le sujet.
- Si les skills Expo ne sont pas disponibles, arrête-toi et demande d'installer le plugin : `claude plugin install expo@claude-plugins-official`.
- Correspondance avec les phases du cahier des charges :

| Phase | Skills à utiliser |
| --- | --- |
| 0. Socle | `expo-project-structure`, `expo-design-system`, `expo-examples` (Supabase, NativeWind, Skia) |
| 1, 4. Comptes, routine, tableau de bord | `expo-router`, `expo-data-fetching`, `expo-ui` |
| 3, 5, 9b. Séance, gamification, mini-jeux | `expo-animation`, `expo-examples` (Skia) |
| 8. Verrou doux | `expo-module` (Swift FamilyControls + Kotlin), `expo-dev-client` |
| 9c. Mode scroll vidéo | `expo-native-ui` |
| 10. Publication | `eas-app-stores`, `eas-update`, `eas-workflows`, `eas-hosting` |

- Les skills `eas-*` correspondent à des services EAS payants au-delà de l'offre gratuite : demande avant de lancer une commande `eas` qui consomme des crédits (build, submit, update).
- Si un skill Expo est faux ou dépassé, signale-le avec `expo-skill-feedback`.

## Stack

- Monorepo pnpm : `apps/mobile` (Expo, Expo Router, iOS + Android + web), `apps/admin` (back-office Next.js), `packages/curriculum`, `packages/exercise-engine`, `packages/ui`, `packages/shared`, `modules/soft-lock`, `services/ai-gateway`, `supabase/`.
- Expo SDK 57 (React Native 0.86, TypeScript 6), NativeWind v5 (Tailwind v4, d'après l'exemple Expo `with-tailwindcss`), Jest (`jest-expo` pour l'app, `@swc/jest` pour les paquets TypeScript purs).
- TypeScript strict partout, schémas Zod dans `packages/shared`.
- UI : NativeWind + tokens de thème (aucune couleur ni taille en dur dans les écrans), Reanimated, Skia pour les mini-jeux.
- Données : Supabase (Postgres + RLS, Auth, Realtime, Edge Functions, pg_cron), TanStack Query + Zustand côté app.

## Conventions

- Code, noms de fichiers et commentaires en anglais ; textes de l'interface en français, centralisés (pas de chaînes en dur dans les composants).
- Pas de `any`. Composants petits ; logique métier hors des composants.
- `packages/exercise-engine` reste du TypeScript pur, sans React : chaque générateur a des tests (1 000 tirages par difficulté, zéro réponse fausse).
- Le code calcule, l'IA raconte : la bonne réponse vient toujours du moteur, jamais d'un modèle IA.
- Toute nouvelle table Supabase a ses politiques RLS et un test de ces politiques.
- XP, gemmes, séries et validation de séance sont calculés côté serveur.
- Données d'enfants : minimum nécessaire, aucun SDK publicitaire ou analytics tiers dans la partie enfant, rien d'identifiant envoyé à l'IA.

## Thèmes et écrans

- Routes Expo Router dans `apps/mobile/src/app` (uniquement des fichiers de route) ; le corps des écrans va dans `apps/mobile/src/screens`.
- Textes de l'interface dans `apps/mobile/src/i18n/fr.ts`.
- Importer `View`, `Text`, `Pressable` et `ScrollView` depuis `@math-genius/ui` (versions qui acceptent `className`), jamais depuis `react-native` : une règle ESLint l'impose.
- Couleurs et rayons uniquement via les classes sémantiques : `bg-background`, `bg-surface`, `bg-primary`, `bg-secondary`, `bg-success`, `border-border`, `border-primary`, `border-success`, `border-danger`, `text-foreground`, `text-muted`, `text-on-primary`, `text-on-secondary`, `text-on-success`, `text-danger`, `rounded-sm|md|lg|full`. La palette Tailwind par défaut est supprimée dans `apps/mobile/src/global.css`. Les espacements suivent l'échelle Tailwind (multiples de 4 px).
- Typographie : `ThemedText` avec les variantes `display`, `title`, `headline`, `body` et `caption`. Sa couleur passe par `tone` (`default`, `muted`, `danger`, `onPrimary`, `onSecondary`, `onSuccess`), jamais par une classe `text-*` dans `className` (deux classes de couleur se contrediraient). Les interlignes du `@theme` sont des ratios sans unité (`calc(2.75 / 2.25)`) : en `px` ou `rem`, NativeWind les multiplie par la taille de police sur natif.
- `apps/mobile/src/screens/screens.styles.test.tsx` rend chaque écran avec les styles natifs réels (Tailwind puis le compilateur NativeWind, mêmes options que Metro via `native-css.config.js`) et vérifie espacements et interlignes. Ajoute chaque nouvel écran à sa liste.
- Un thème = un fichier de tokens dans `packages/ui/src/theme/themes/`, enregistré dans `themes/index.ts`. `ThemeProvider` injecte ses valeurs en variables CSS `--theme-*` ; `useTheme()` sert seulement aux API qui n'acceptent pas de classe (barre d'état, navigation, Skia). Les tests vérifient le contraste WCAG AA de chaque thème.
- `packages/shared`, `packages/curriculum` et `packages/exercise-engine` n'importent ni React, ni React Native, ni Expo (règle ESLint).
- Ajouter une dépendance à l'app : `pnpm --filter @math-genius/mobile exec expo install <paquet>` pour garder des versions compatibles avec le SDK.
- Écrans purs dans `apps/mobile/src/screens` (données et callbacks en props) ; les routes de `src/app` les branchent sur les hooks de `src/data` (TanStack Query + Supabase). Dans Jest, `@expo/ui` est remplacé par `apps/mobile/jest/expo-ui.tsx`.
- `lightningcss` est figé en 1.30.1 : NativeWind v5 (`react-native-css`) casse sur `var()` avec les versions suivantes. Ne le mets pas à jour sans vérifier `pnpm --filter @math-genius/mobile export`.

## Comptes et base de données

- Le parent se connecte par email et mot de passe ; à l'inscription, un trigger crée sa famille avec le consentement horodaté. L'appareil d'un enfant reçoit une session anonyme Supabase, reliée à un profil par `redeem_pairing_code` ; `revoke_device` lui retire tout accès.
- Les écritures sensibles passent par des fonctions SQL `security definer` qui vérifient l'appelant ; les tables concernées n'ont pas de politique d'écriture.
- Erreurs métier des fonctions SQL : `raise exception '<code>' using errcode = 'PTxyz'` (PostgREST renvoie le statut HTTP xyz). L'app les traduit dans `apps/mobile/src/data/errors.ts` et `strings.errors`.
- Après une migration : `pnpm supabase:reset`, `pnpm supabase:test`, puis `pnpm supabase:types` (la CI vérifie que les types sont à jour).
- Après une écriture qui change le résultat d'une requête peut-être déjà partie (appairage : la requête des profils démarre dès la connexion anonyme), utiliser `refetchAfterWrite` (`data/query-client.ts`) plutôt que `invalidateQueries` seul : une invalidation réutilise une requête en cours qui n'a pas encore de données, même si elle a lu la base avant l'écriture.

## Référentiel et moteur d'exercices

- `packages/curriculum` : compétences de la CE2 à la 5e, par niveau (`src/grades/`). Les codes `<niveau>.<slug>` sont stables (la maîtrise de chaque enfant y est rattachée) : ne jamais les renommer. Prérequis du même niveau ou d'un niveau inférieur, sans cycle (testé). Le contenu est un brouillon à faire relire par un enseignant.
- Ajouter un générateur : un fichier dans `packages/exercise-engine/src/generators/<niveau>/`, de moins de 30 lignes non vides (vérifié par un test), qui importe tout depuis `../kit`, puis une ligne dans `generators/index.ts`. Les tests de 1 000 tirages par difficulté s'appliquent alors automatiquement.
- Réponses en nombres exacts (`r()`, `decimal()`), jamais de flottants ; nombres affichés au format français avec `n()`, `frac()`, `op()`.
- Chaque exercice porte un `check` : le calcul ou l'énoncé derrière la réponse, écrit avec les nombres de l'énoncé. L'oracle des tests (`src/testing/oracle.ts`, en BigInt, sans code commun avec le moteur) le recalcule et vérifie que chaque nombre du `check` apparaît bien dans l'énoncé. Pour une nouvelle notion (formule, unité), ajouter sa fonction à l'oracle avec un test, pas au moteur.
- Le correcteur (`gradeResponse`) accepte toutes les écritures d'une même valeur (0,5 = 0.5 = 1/2), sauf si l'exercice impose `forms` ou `irreducible` ; il distingue une valeur juste mal écrite (`wrong-form`, `not-irreducible`) d'une erreur.

## Séance, adaptatif et hors-ligne

- Moteur adaptatif dans `packages/exercise-engine/src/adaptive/` : notes Elo enfant × item (`ratings.ts`), maîtrise 0-100, oubli et statuts (`mastery.ts`), règles de séance (`session.ts`) et planificateur (`planner.ts`). L'exercice suivant est une fonction pure du contexte de départ et des réponses déjà données : une séance interrompue reprend à l'identique. Composition 40 / 30 / 20 / 10 (`SLOT_PATTERN`), exercice jumeau 3 exercices après une erreur, rappel et difficulté abaissée après 2 erreurs d'affilée. `src/testing/learner.ts` simule des élèves virtuels (taux de réussite visé 75-85 %).
- La fonction SQL `sync_session` recalcule côté serveur le score, le temps actif, la validation (objectif atteint avec au moins 60 % de réussite) et le signalement des réponses trop rapides, avec les mêmes constantes que `session.ts` et `ratings.ts`. Changer une règle, c'est changer les deux : le test de `session.test.ts` et `practice_sessions.test.sql` partagent le même cas, et `sync-contract.test.ts` compare les champs envoyés par l'app aux colonnes lues par la migration.
- Côté app, tout passe par `apps/mobile/src/data/practice/` : `practice-store.ts` (Zustand persisté dans AsyncStorage : maîtrise, séance en cours, sessions à envoyer), `sync-engine.ts` (payload et envoi, sans Supabase, testable) et `sync.ts` (branchement Supabase, envoi au retour du réseau et au retour au premier plan). Chaque réponse est enregistrée sur l'appareil dès qu'elle est donnée ; l'envoi renvoie toute la séance et ne crée jamais de doublon. Les profils (cache TanStack Query) sont gardés une semaine sur l'appareil, NetInfo pilote `onlineManager`, et une session Supabase expirée reste utilisable hors-ligne (`data/session.ts`).
- Les écrans d'exercice sont dans `apps/mobile/src/screens/practice/` (une saisie par type dans `inputs/`, clavier intégré, jamais le clavier système). La logique de séance est dans `hooks/use-practice-session.ts`.
- La table `skills` est remplie par des migrations générées depuis `packages/curriculum` : après un changement du référentiel, lancer `pnpm curriculum:sql` (un test échoue sinon). Appliquer les migrations avant de publier une version de l'app qui utilise de nouvelles compétences.
- Tests de l'app : `jest/setup.ts` simule AsyncStorage, NetInfo et Gesture Handler ; Reanimated tourne grâce au resolver de `react-native-worklets`. Les imports CSS sont remplacés par `jest/css-stub.js`, et `renderRouter` (`expo-router/testing-library`) rend de vraies routes. `fetch` est simulé par `jest-expo` : les tests ne joignent jamais Supabase, d'où le transport injectable de `sync-engine.ts`.

## Suivi parent (phase 4)

- Séances du jour côté parent : `apps/mobile/src/data/family-sessions.ts` (requêtes et abonnement Realtime) et `data/session-report.ts` (état du jour par enfant, état d'une séance, lecture des réponses stockées). La table `sessions` est publiée dans Supabase Realtime (migration `*_parent_live_sessions.sql`) ; Realtime applique ses politiques RLS, donc un parent ne reçoit que les séances de ses enfants. Un seul abonnement, ouvert dans `app/parent/_layout.tsx`, rafraîchit toutes les pages parent ; il recharge aussi les séances dès qu'il est actif, pour ne rien manquer de ce qui précède.
- Le texte des exercices n'est jamais stocké : le détail d'une séance les reconstruit avec le moteur (générateur, difficulté, graine). Un générateur retiré d'une version de l'app s'affiche comme « exercice indisponible ».
- Routines et vacances : tables `routines` (une par enfant : jours ISO 1 = lundi … 7 = dimanche, début, début du mercredi et du week-end, heure limite, objectif) et `vacations` (premier et dernier jour inclus, 92 jours au plus). Le parent les écrit directement (RLS) ; l'appareil de l'enfant les lit. Les règles du jour (prévu, repos, vacances) sont dans `packages/shared/src/routine.ts` (`dayPlan`) et, côté serveur, dans `private.day_plan` : changer l'une, c'est changer l'autre (`routine.test.ts` et `routines.test.sql` partagent le même cas).
- Statut du jour (`childDay`) : une séance terminée fait « terminé », même en retard ; passé l'heure limite d'un jour prévu, rien de terminé fait « manqué » ; un jour de repos ou de vacances sans séance n'est pas manqué. Le tableau de bord recalcule ce statut chaque minute (`hooks/use-local-clock.ts`), sans recharger.
- Une nouvelle séance prend l'objectif de la routine (`use-start-session.ts`), 15 minutes sans routine ; la routine est gardée sur l'appareil (cache TanStack Query persisté) pour démarrer hors-ligne. Une séance en cours garde l'objectif de son début. Les fonctions pures sont dans `data/routine-plan.ts`, les requêtes Supabase dans `data/routines.ts`.
- Heures et dates se choisissent avec le `Picker` d'@expo/ui (créneaux de 15 minutes) : le `DateTimePicker` d'@expo/ui n'affiche rien sur le web.
- Rappels côté serveur (migration `*_reminders.sql`) : pg_cron lance `private.run_reminders()` chaque minute. `private.enqueue_reminders(p_now)` met en file les étapes dues, à l'heure de la famille (`families.timezone`) : H − 10, H et H + 30 pour l'enfant, H + 60 et l'heure limite pour le parent, plus la fin de la séance du jour. Une étape part dans les 10 minutes qui suivent son heure, sinon elle est sautée (jamais de rappel en retard) ; rien un jour de repos, en vacances ou après une séance terminée, et pas de rappel à l'enfant pendant qu'il joue (réponse envoyée depuis moins de 10 minutes). `notifications.dedup_key` empêche tout doublon. Les tests pgTAP passent `p_now` pour simuler l'horloge.
- Envoi : `private.send_notifications` poste à l'API Expo Push avec pg_net (aucune Edge Function, aucune clé : l'API Expo Push n'en demande pas tant que la sécurité renforcée des push n'est pas activée sur le projet Expo). `private.collect_push_receipts` lit les réponses à la minute suivante et supprime le jeton d'un appareil désinstallé (`DeviceNotRegistered`). Les notifications sont gardées 30 jours.
- Les textes des notifications sont écrits en SQL (`private.notification_content`) : le téléphone les affiche lui-même, app fermée. C'est la seule exception à `fr.ts`.
- Jetons push : `register_push_token` (au démarrage, parent et appareil enfant, une fois les notifications autorisées), `unregister_push_token` (à la déconnexion). Code de l'app : `lib/notifications.ts` (permission, jeton, ouverture de l'écran au toucher, limitée aux routes `/child/` et `/parent/`) et `data/push.ts`. Sans `expo.extra.eas.projectId` dans `app.json` (écrit par `eas init`), l'app ne demande pas de jeton. Le web n'en a pas.
- `expo-notifications` est optionnel : ne jamais l'importer en tête de fichier (seulement `import type`), toujours passer par `loadNotifications()`. Sur Android, Expo Go n'a plus ses modules natifs depuis le SDK 53 : charger le paquet y lève une erreur qui faisait planter toutes les routes. `loadNotifications()` ne le charge jamais sur web ni dans Expo Go sur Android, et le charge ailleurs dans un `try`. `src/app-start.test.tsx` démarre le vrai layout racine avec un module absent.
- Chaque appareil enfant signale s'il peut afficher les notifications (`report_push_status` : `enabled`, `denied` ou `unsupported`, colonne `devices.push_status`). La fiche de l'enfant l'affiche pour chaque appareil, et le panneau de message avertit le parent quand aucun appareil ne peut les recevoir.
- Message du parent : `send_child_message` (120 caractères, un toutes les 2 minutes par enfant, envoyé tout de suite) renvoie le nombre d'appareils joints ; 0 veut dire qu'aucun appareil de l'enfant n'a autorisé les notifications.

## Récompenses (phase 5)

- Recorrection serveur : l'XP et les gemmes ne viennent jamais de ce que l'appareil a jugé. Après chaque envoi d'une séance terminée (`sync.ts`), l'app appelle l'Edge Function `award-session` (`supabase/functions/award-session/index.ts`). Elle lit les séances à récompenser avec le jeton de l'appelant (RLS), reconstruit chaque exercice avec le moteur (`regrade` de `packages/exercise-engine/src/regrade.ts`), note à nouveau chaque réponse stockée et passe ses verdicts à `award_session`, réservée à `service_role`. `award_session` est idempotente : un nouvel appel renvoie la récompense déjà donnée (`sessions.award`).
- Le moteur est embarqué dans la fonction sous forme d'un bundle généré, `supabase/functions/award-session/engine.js` (esbuild, sans import). Après un changement du moteur ou de `packages/shared`, lancer `pnpm functions:bundle` (un test échoue sinon), puis redéployer la fonction sur le projet en ligne. `packages/shared` est déclaré `sideEffects: false` et `grade.ts` n'importe pas Zod (`grade-schema.ts` à part) : sans cela, Zod entrerait dans le bundle.
- La fonction ne s'appuie pas sur la vérification JWT de la passerelle (`verify_jwt = false` dans `config.toml`) : PostgREST et la RLS vérifient le jeton et la clé de l'appelant, qu'elle transmet tels quels. Sans jeton, elle répond 401.
- Règles dans `packages/shared/src/rewards.ts` et dans la migration `*_rewards.sql` : changer l'une, c'est changer l'autre (`rewards.test.ts` et `rewards.test.sql` partagent le même cas). 10 XP par bonne réponse vérifiée, sauf en moins de 1,2 s ; +10 XP par série de 5 bonnes réponses d'affilée ; le niveau L demande 50 × L × (L − 1) XP. La séance du jour validée (objectif atteint et 60 % de bonnes réponses vérifiées) rapporte 5 gemmes et un coffre (5 à 15 gemmes, rare tous les 7 jours de série : 25 à 50), tirés d'un hachage de la séance.
- Série : rejouée sur tout l'historique (`private.streak_state`), donc une séance envoyée en retard compte pour son jour. Les jours de repos et de vacances sont ignorés, aujourd'hui n'est jamais manqué, et un jour manqué consomme un gel s'il en reste. Un gel gratuit chaque lundi ; un gel acheté coûte 30 gemmes (`buy_freeze`), 3 au plus. pg_cron recalcule la progression chaque heure (`refresh-progress`) ; une ligne de `progress` inchangée n'est pas réécrite.
- Tables `progress`, `gem_transactions` (le solde de gemmes est leur somme) et `chests` : lecture seule pour la famille (RLS), écritures par `award_session`, `open_chest` et `buy_freeze`. `progress` est publiée dans Realtime : la fiche de l'enfant côté parent suit série, niveau et gemmes en direct (même abonnement que les séances).
- Badges : catalogue dans `packages/shared/src/badges.ts` (code, famille, mesure, seuil) et dans la migration `*_badges.sql` (`badges.test.ts` compare les deux) ; icônes, titres et descriptions dans `fr.ts` (`strings.badges.items`, typé par code). Les codes sont stables : ne jamais les renommer. `private.badge_metrics` calcule les mesures uniquement à partir des données du serveur (réponses recorrigées, série, coffres, gemmes, maîtrise) ; `award_session` accorde les badges atteints et renvoie les nouveaux dans la récompense (`badges`). Ajouter un badge : une ligne dans `badges.ts`, la même dans une nouvelle migration, et ses textes ; une nouvelle mesure : une clé de `BADGE_METRICS` et de `private.badge_metrics`. Ce qu'une séance rapporte en plus de l'XP et des gemmes passe par `private.award_extras` : le compléter plutôt que réécrire `award_session`.
- App : `data/rewards.ts` (appel de la fonction, `useRewards`, `useSessionAward`, qui interroge toutes les 3 s jusqu'à la récompense, `useOpenChest` et `useBadges`), `data/rewards-model.ts` et `data/badges-model.ts` (fonctions pures). Écrans : `screens/rewards/` (bandeau de progression, panneau de fin de séance), `screens/chest-opening.tsx` et la route modale `child/chest`, `screens/badges/` et la route `child/badges`. Les animations (Reanimated CSS, `FadeInDown`) respectent la réduction des animations.

## Façon de travailler

- Une phase = une branche. Ne code rien au-delà de la phase demandée.
- Termine chaque phase en listant ce qui manque par rapport à son critère de validation dans `docs/specs.md`.
- Mets à jour la section Commandes ci-dessous dès qu'une commande est ajoutée.

## Commandes

Prérequis : Node 22 (`.nvmrc`), pnpm 10 (`corepack enable`), Docker Desktop installé et lancé pour Supabase local.

Sur un téléphone (Expo Go), `127.0.0.1` désigne le téléphone lui-même. En développement, l'app remplace donc l'hôte d'une URL Supabase locale par l'adresse IP du Mac sur le réseau, déduite de l'hôte Metro (`Constants.expoConfig.hostUri`, voir `apps/mobile/src/lib/dev-host.ts`) : rien à modifier dans `.env.local`. Il faut que le téléphone et le Mac soient sur le même Wi-Fi, que Docker Desktop tourne avec `pnpm supabase:start` (l'API écoute sur toutes les interfaces, port 54321) et, si le pare-feu de macOS est actif, qu'il accepte les connexions entrantes vers Docker. En mode tunnel (`--tunnel`), seul Metro passe : Supabase local n'est alors pas joignable.

**Supabase en ligne** (tests sur de vrais téléphones sans Mac allumé, ou hors du Wi-Fi local). Créer un projet sur supabase.com (région Europe), puis depuis la racine du dépôt :

1. `pnpm exec supabase login`, puis `pnpm exec supabase link --project-ref <ref>` (le `ref` est dans l'URL du projet ; le mot de passe demandé est celui de la base).
2. `pnpm exec supabase db push` : applique toutes les migrations de `supabase/migrations`, y compris les `*_skills.sql` générées depuis le référentiel. À relancer après chaque nouvelle migration. `seed.sql` n'est pas envoyé. Puis `pnpm exec supabase functions deploy award-session` : déploie la recorrection serveur qui donne XP, gemmes et coffres (à relancer après chaque `pnpm functions:bundle`). Elle utilise les variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`, fournies d'office aux Edge Functions tant que les clés API héritées (« legacy ») du projet restent actives.
3. `pnpm exec supabase config push` : envoie la configuration Auth de `supabase/config.toml` (connexions anonymes activées, mot de passe de 8 caractères minimum). Attention, elle envoie aussi les réglages de développement : `site_url` en `localhost` et emails non confirmés. Très bien pour un projet de test, à revoir avant la production.
4. Dans le tableau de bord, Authentication → Sign In / Providers : vérifier que « Allow anonymous sign-ins » est activé. Sans cette option, un téléphone enfant ne peut pas être appairé.
5. Dans `apps/mobile/.env.local` : `EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co` et `EXPO_PUBLIC_SUPABASE_KEY=` la clé publishable (Project Settings → API Keys, `sb_publishable_…`). Jamais la clé secrète ni `service_role`. Relancer `pnpm mobile`, car les variables `EXPO_PUBLIC_` sont figées au démarrage de Metro. Une URL en ligne n'est jamais réécrite par `dev-host.ts`.

Les types TypeScript restent générés depuis la base locale (`pnpm supabase:types`) : appliquer les mêmes migrations aux deux bases.

**Notifications sur téléphone** : il faut un projet EAS. Lancer une fois `npx eas-cli init` dans `apps/mobile` (gratuit, aucun build ; demande un compte Expo) : il écrit `extra.eas.projectId` dans `app.json`, à commiter. Sur iPhone, Expo Go reçoit alors les notifications. Sur Android, Expo Go ne reçoit plus de notifications à distance depuis le SDK 53 : l'app y tourne sans push (le parent voit « ne peut pas recevoir de notifications »), et il faut un build de développement (`eas build`, qui consomme des crédits : demander avant) pour les tester. Avec Supabase local, les rappels partent du conteneur Docker de la base, qui doit pouvoir joindre `exp.host`. Pour suivre les envois : `select kind, title, body, sent_at, push_status, push_errors from notifications order by created_at desc;` dans Studio.

| Besoin | Commande |
| --- | --- |
| Installer les dépendances | `pnpm install` |
| Configurer l'app (Supabase local) | `cp apps/mobile/.env.example apps/mobile/.env.local` (garder `127.0.0.1` : sur téléphone, l'app le remplace par l'IP du Mac) |
| Lancer l'app (menu Expo : `i` iOS, `a` Android, `w` web) | `pnpm mobile` |
| Ouvrir directement sur iOS / Android / navigateur | `pnpm ios` / `pnpm android` / `pnpm web` |
| Tester sur un vrai téléphone (même Wi-Fi que le Mac, Docker Desktop lancé) | `pnpm supabase:start`, puis `pnpm mobile` et scanner le QR code avec Expo Go |
| Lint, types, tests, format | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format:check` (`pnpm format` corrige) |
| Tests d'un seul paquet | `pnpm --filter @math-genius/ui test` |
| Catalogue d'exemples d'exercices à faire relire (Markdown) | `pnpm --filter @math-genius/exercise-engine catalog > catalogue.md` |
| Bundle iOS + Android + web (comme la CI) | `pnpm --filter @math-genius/mobile export` |
| Démarrer / arrêter Supabase local (sert aussi les Edge Functions de `supabase/functions`) | `pnpm supabase:start` / `pnpm supabase:stop` |
| URL et clés locales (API `http://127.0.0.1:54321`, Studio `http://127.0.0.1:54323`) | `pnpm supabase:status` |
| Réappliquer migrations et seed | `pnpm supabase:reset` |
| Tests RLS et fonctions SQL (Supabase démarré) | `pnpm supabase:test` |
| Régénérer les types TypeScript de la base | `pnpm supabase:types` |
| Charger le référentiel modifié dans la base (nouvelle migration `*_skills.sql`) | `pnpm curriculum:sql` |
| Créer une migration | `pnpm exec supabase migration new <nom>` |
| Régénérer le moteur embarqué dans l'Edge Function `award-session` (après un changement du moteur) | `pnpm functions:bundle` |
| Suivre les journaux de l'Edge Function en local | `pnpm exec supabase functions serve award-session` |
| Relier le dépôt au projet Supabase en ligne | `pnpm exec supabase login`, puis `pnpm exec supabase link --project-ref <ref>` |
| Envoyer migrations et configuration Auth au projet en ligne | `pnpm exec supabase db push`, puis `pnpm exec supabase config push` |
| Déployer la recorrection serveur sur le projet en ligne | `pnpm exec supabase functions deploy award-session` |
| Créer le projet EAS (identifiant requis pour les notifications push) | `cd apps/mobile && npx eas-cli init` |

La CI (`.github/workflows/ci.yml`) lance format, lint, typecheck, tests et le bundle des trois plateformes sur chaque pull request, et un job base de données : tests RLS, lint SQL et types générés à jour.
