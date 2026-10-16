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
- Tests de l'app : `jest/setup.ts` simule AsyncStorage, NetInfo et Gesture Handler ; Reanimated tourne grâce au resolver de `react-native-worklets`. `fetch` est simulé par `jest-expo` : les tests ne joignent jamais Supabase, d'où le transport injectable de `sync-engine.ts`.

## Suivi parent (phase 4)

- Séances du jour côté parent : `apps/mobile/src/data/family-sessions.ts` (requêtes et abonnement Realtime) et `data/session-report.ts` (état du jour par enfant, état d'une séance, lecture des réponses stockées). La table `sessions` est publiée dans Supabase Realtime (migration `*_parent_live_sessions.sql`) ; Realtime applique ses politiques RLS, donc un parent ne reçoit que les séances de ses enfants. Un seul abonnement, ouvert dans `app/parent/_layout.tsx`, rafraîchit toutes les pages parent ; il recharge aussi les séances dès qu'il est actif, pour ne rien manquer de ce qui précède.
- Le texte des exercices n'est jamais stocké : le détail d'une séance les reconstruit avec le moteur (générateur, difficulté, graine). Un générateur retiré d'une version de l'app s'affiche comme « exercice indisponible ».

## Façon de travailler

- Une phase = une branche. Ne code rien au-delà de la phase demandée.
- Termine chaque phase en listant ce qui manque par rapport à son critère de validation dans `docs/specs.md`.
- Mets à jour la section Commandes ci-dessous dès qu'une commande est ajoutée.

## Commandes

Prérequis : Node 22 (`.nvmrc`), pnpm 10 (`corepack enable`), Docker Desktop installé et lancé pour Supabase local.

Sur un téléphone (Expo Go), `127.0.0.1` désigne le téléphone lui-même. En développement, l'app remplace donc l'hôte d'une URL Supabase locale par l'adresse IP du Mac sur le réseau, déduite de l'hôte Metro (`Constants.expoConfig.hostUri`, voir `apps/mobile/src/lib/dev-host.ts`) : rien à modifier dans `.env.local`. Il faut que le téléphone et le Mac soient sur le même Wi-Fi, que Docker Desktop tourne avec `pnpm supabase:start` (l'API écoute sur toutes les interfaces, port 54321) et, si le pare-feu de macOS est actif, qu'il accepte les connexions entrantes vers Docker. En mode tunnel (`--tunnel`), seul Metro passe : Supabase local n'est alors pas joignable.

**Supabase en ligne** (tests sur de vrais téléphones sans Mac allumé, ou hors du Wi-Fi local). Créer un projet sur supabase.com (région Europe), puis depuis la racine du dépôt :

1. `pnpm exec supabase login`, puis `pnpm exec supabase link --project-ref <ref>` (le `ref` est dans l'URL du projet ; le mot de passe demandé est celui de la base).
2. `pnpm exec supabase db push` : applique toutes les migrations de `supabase/migrations`, y compris les `*_skills.sql` générées depuis le référentiel. À relancer après chaque nouvelle migration. `seed.sql` n'est pas envoyé.
3. `pnpm exec supabase config push` : envoie la configuration Auth de `supabase/config.toml` (connexions anonymes activées, mot de passe de 8 caractères minimum). Attention, elle envoie aussi les réglages de développement : `site_url` en `localhost` et emails non confirmés. Très bien pour un projet de test, à revoir avant la production.
4. Dans le tableau de bord, Authentication → Sign In / Providers : vérifier que « Allow anonymous sign-ins » est activé. Sans cette option, un téléphone enfant ne peut pas être appairé.
5. Dans `apps/mobile/.env.local` : `EXPO_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co` et `EXPO_PUBLIC_SUPABASE_KEY=` la clé publishable (Project Settings → API Keys, `sb_publishable_…`). Jamais la clé secrète ni `service_role`. Relancer `pnpm mobile`, car les variables `EXPO_PUBLIC_` sont figées au démarrage de Metro. Une URL en ligne n'est jamais réécrite par `dev-host.ts`.

Les types TypeScript restent générés depuis la base locale (`pnpm supabase:types`) : appliquer les mêmes migrations aux deux bases.

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
| Démarrer / arrêter Supabase local | `pnpm supabase:start` / `pnpm supabase:stop` |
| URL et clés locales (API `http://127.0.0.1:54321`, Studio `http://127.0.0.1:54323`) | `pnpm supabase:status` |
| Réappliquer migrations et seed | `pnpm supabase:reset` |
| Tests RLS et fonctions SQL (Supabase démarré) | `pnpm supabase:test` |
| Régénérer les types TypeScript de la base | `pnpm supabase:types` |
| Charger le référentiel modifié dans la base (nouvelle migration `*_skills.sql`) | `pnpm curriculum:sql` |
| Créer une migration | `pnpm exec supabase migration new <nom>` |
| Relier le dépôt au projet Supabase en ligne | `pnpm exec supabase login`, puis `pnpm exec supabase link --project-ref <ref>` |
| Envoyer migrations et configuration Auth au projet en ligne | `pnpm exec supabase db push`, puis `pnpm exec supabase config push` |

La CI (`.github/workflows/ci.yml`) lance format, lint, typecheck, tests et le bundle des trois plateformes sur chaque pull request, et un job base de données : tests RLS, lint SQL et types générés à jour.
