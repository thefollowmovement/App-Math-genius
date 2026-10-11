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

## Façon de travailler

- Une phase = une branche. Ne code rien au-delà de la phase demandée.
- Termine chaque phase en listant ce qui manque par rapport à son critère de validation dans `docs/specs.md`.
- Mets à jour la section Commandes ci-dessous dès qu'une commande est ajoutée.

## Commandes

À compléter en phase 0 (installation, lancement iOS / Android / web, tests, Supabase local).
