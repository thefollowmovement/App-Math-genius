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
- Couleurs et rayons uniquement via les classes sémantiques : `bg-background`, `bg-surface`, `bg-primary`, `bg-secondary`, `border-border`, `text-foreground`, `text-muted`, `text-on-primary`, `text-on-secondary`, `rounded-sm|md|lg`. La palette Tailwind par défaut est supprimée dans `apps/mobile/src/global.css`. Les espacements suivent l'échelle Tailwind (multiples de 4 px).
- Typographie : `ThemedText` avec les variantes `display`, `title`, `headline`, `body` et `caption`. Les interlignes du `@theme` sont des ratios sans unité (`calc(2.75 / 2.25)`) : en `px` ou `rem`, NativeWind les multiplie par la taille de police sur natif.
- `apps/mobile/src/screens/welcome.styles.test.tsx` rend l'écran d'accueil avec les styles natifs réels (Tailwind puis le compilateur NativeWind, mêmes options que Metro via `native-css.config.js`). Pour un nouvel écran, ajoute le même type de test.
- Un thème = un fichier de tokens dans `packages/ui/src/theme/themes/`, enregistré dans `themes/index.ts`. `ThemeProvider` injecte ses valeurs en variables CSS `--theme-*` ; `useTheme()` sert seulement aux API qui n'acceptent pas de classe (barre d'état, navigation, Skia). Les tests vérifient le contraste WCAG AA de chaque thème.
- `packages/shared`, `packages/curriculum` et `packages/exercise-engine` n'importent ni React, ni React Native, ni Expo (règle ESLint).
- Ajouter une dépendance à l'app : `pnpm --filter @math-genius/mobile exec expo install <paquet>` pour garder des versions compatibles avec le SDK.
- `lightningcss` est figé en 1.30.1 : NativeWind v5 (`react-native-css`) casse sur `var()` avec les versions suivantes. Ne le mets pas à jour sans vérifier `pnpm --filter @math-genius/mobile export`.

## Façon de travailler

- Une phase = une branche. Ne code rien au-delà de la phase demandée.
- Termine chaque phase en listant ce qui manque par rapport à son critère de validation dans `docs/specs.md`.
- Mets à jour la section Commandes ci-dessous dès qu'une commande est ajoutée.

## Commandes

Prérequis : Node 22 (`.nvmrc`), pnpm 10 (`corepack enable`), Docker pour Supabase local.

| Besoin | Commande |
| --- | --- |
| Installer les dépendances | `pnpm install` |
| Lancer l'app (menu Expo : `i` iOS, `a` Android, `w` web) | `pnpm mobile` |
| Ouvrir directement sur iOS / Android / navigateur | `pnpm ios` / `pnpm android` / `pnpm web` |
| Tester sur un vrai téléphone | app Expo Go, puis scanner le QR code affiché par `pnpm mobile` |
| Lint, types, tests, format | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm format:check` (`pnpm format` corrige) |
| Tests d'un seul paquet | `pnpm --filter @math-genius/ui test` |
| Bundle iOS + Android + web (comme la CI) | `pnpm --filter @math-genius/mobile export` |
| Démarrer / arrêter Supabase local | `pnpm supabase:start` / `pnpm supabase:stop` |
| URL et clés locales (API `http://127.0.0.1:54321`, Studio `http://127.0.0.1:54323`) | `pnpm supabase:status` |
| Réappliquer migrations et seed | `pnpm supabase:reset` |
| Créer une migration | `pnpm exec supabase migration new <nom>` |

La CI (`.github/workflows/ci.yml`) lance format, lint, typecheck, tests et le bundle des trois plateformes sur chaque pull request.
