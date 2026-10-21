import type { BadgeCode, ProgrammePosition, SkillDomain, Verdict } from '@math-genius/shared';

import {
  NBSP,
  count,
  dayList,
  duration,
  integer,
  joinAnd,
  longDay,
  monthName,
  monthYear,
  nextMonth,
  ofMonth,
  percent,
  period,
  shortDay,
  weekdayName,
} from './format';

/**
 * Texts of the recaps' emails and PDF, written on the server (the app is closed when they are
 * read), like the notifications. French only for now: textsFor falls back to it. Badge titles
 * repeat the app's (strings.badges.items in apps/mobile/src/i18n/fr.ts).
 */

const rate = (verdict: Verdict) => (verdict.success === null ? null : percent(verdict.success));

const BADGES: Record<BadgeCode, string> = {
  'streak-3': 'Bien parti',
  'streak-7': 'Une semaine de feu',
  'streak-14': 'Deux semaines d’affilée',
  'streak-30': 'Un mois de feu',
  'streak-50': 'Inarrêtable',
  'streak-100': 'Cent jours',
  'streak-365': 'Une année de feu',
  'sessions-1': 'Première mission',
  'sessions-10': 'Dix missions',
  'sessions-25': 'Vingt-cinq missions',
  'sessions-50': 'Cinquante missions',
  'sessions-100': 'Cent missions',
  weekend: 'Même le week-end',
  comeback: 'Le grand retour',
  'mastery-1': 'Première compétence',
  'mastery-5': 'Cinq compétences',
  'mastery-10': 'Dix compétences',
  'mastery-25': 'Vingt-cinq compétences',
  tables: 'As des tables',
  'mental-math': 'Calcul éclair',
  'all-domains': 'Touche-à-tout',
  'combo-10': 'Combo ×10',
  'combo-25': 'Combo ×25',
  'perfect-5': 'Cinq sans-faute',
  'perfect-20': 'Vingt sans-faute',
  'answers-100': '100 bonnes réponses',
  'answers-1000': '1 000 bonnes réponses',
  'answers-5000': '5 000 bonnes réponses',
  'perfect-1': 'Premier sans-faute',
  'bonus-1': 'Encore plus !',
  'rare-chest': 'Coffre rare',
  'explorer-10': 'Exploration',
  'explorer-25': 'Grande exploration',
  'gems-100': 'Petit trésor',
  'level-5': 'Niveau 5',
  'level-10': 'Niveau 10',
  'level-20': 'Niveau 20',
  'island-1': 'Première île',
  'island-2': 'Deux îles',
  'island-4': 'Tour des îles',
  'boss-perfect': 'Boss sans faute',
  'challenge-1': 'Premier défi',
  'challenge-5': 'Cinq défis',
  'first-exercise': 'Premier exercice',
};

const DOMAINS: Record<SkillDomain, string> = {
  numbers: 'Nombres et calcul',
  measures: 'Grandeurs et mesures',
  geometry: 'Espace et géométrie',
  data: 'Données et problèmes',
};

/** Everyday life ideas for the domain to strengthen (the standard tips). */
const EVERYDAY: Record<SkillDomain, string> = {
  numbers: 'comparez des prix au supermarché ou doublez les quantités d’une recette',
  measures: 'mesurez des objets de la maison ou calculez la durée d’un trajet',
  geometry: 'cherchez des formes et des angles droits autour de vous',
  data: 'lisez ensemble un tableau ou un graphique, les horaires d’un bus par exemple',
};

export const fr = {
  brand: 'Math Genius',
  badge: (code: string) => (code in BADGES ? BADGES[code as BadgeCode] : code),
  domain: (domain: SkillDomain) => DOMAINS[domain],

  verdict: {
    title: {
      good: 'Ça va bien',
      watch: 'À surveiller',
      alert: 'À reprendre en main',
      none: 'Pas encore de séance',
    },
    sentence(name: string, verdict: Verdict, scope: 'week' | 'month'): string {
      const success = rate(verdict);
      const sessions = (done: number) => count(done, 'séance', 'séances');
      const when = scope === 'week' ? 'cette semaine' : 'ce mois-ci';
      if (verdict.level === 'none') return `Pas encore de séance pour ${name} ${when}.`;
      if (verdict.planned > 0 && verdict.active === 0) {
        return `${name} n’a fait aucune des ${verdict.planned} séances prévues ${when} : un petit coup de pouce aidera à reprendre.`;
      }
      const regular =
        verdict.planned === 0
          ? `${count(verdict.active, 'jour', 'jours')} d’exercices`
          : scope === 'week'
            ? `${sessions(verdict.done)} sur ${verdict.planned} prévue${verdict.planned > 1 ? 's' : ''}`
            : `${count(verdict.done, 'jour fait', 'jours faits')} sur ${verdict.planned} prévu${verdict.planned > 1 ? 's' : ''}`;
      if (verdict.irregular && verdict.struggling) {
        return `Des séances manquées (${regular}) et une réussite en baisse (${success}) : c’est le moment d’en parler ensemble.`;
      }
      if (verdict.irregular) {
        const missed =
          verdict.level === 'alert' ? 'Beaucoup de séances manquées' : 'Quelques séances manquées';
        return success
          ? `${missed} : ${regular}. Quand ${name} joue, la réussite est bonne (${success}).`
          : `${missed} : ${regular}.`;
      }
      if (verdict.struggling) {
        return `La régularité est là (${regular}), mais la réussite baisse : ${success}. Les points de blocage disent où aider.`;
      }
      return success
        ? `${name} a fait ${regular}, avec ${success} de bonnes réponses.`
        : `${name} a fait ${regular}.`;
    },
  },

  programme(name: string, programme: ProgrammePosition): string | null {
    if (programme.position === null) return null;
    const met = `la classe a abordé environ ${count(programme.expected, 'compétence', 'compétences')} sur ${programme.total}`;
    const own = `${name} en maîtrise ${programme.mastered} et en travaille ${programme.working}`;
    const gaps =
      programme.gaps > 0
        ? ` ${count(programme.gaps, 'notion', 'notions')} des années précédentes à consolider${programme.gapTitles.length > 0 ? ` (${joinAnd(programme.gapTitles.map((title) => `«\u00a0${title}\u00a0»`))})` : ''}.`
        : '';
    const lead = {
      ahead: `En avance sur le programme de ${programme.grade}`,
      on_track: `Dans le rythme du programme de ${programme.grade}`,
      behind: `Un peu en retard sur le programme de ${programme.grade}`,
    }[programme.position];
    return `${lead} : ${met} ; ${own}.${gaps}`;
  },
  programmeNote: 'Estimation : le programme de l’année est réparti de septembre à juin.',

  stats: {
    sessions: 'Séances',
    days: 'Jours faits',
    planned: (planned: number) => `sur ${planned} prévue${planned > 1 ? 's' : ''}`,
    plannedDays: (planned: number) => `sur ${planned} prévu${planned > 1 ? 's' : ''}`,
    played: 'jours d’exercices',
    streak: 'Série',
    streakValue: (days: number) => count(days, 'jour', 'jours'),
    time: 'Temps',
    success: 'Réussite',
    xp: 'XP gagnés',
    none: '—',
  },
  duration,
  integer,
  percent,

  weekly: {
    subject: (name: string, from: string, to: string) =>
      `Récap de la semaine de ${name} (${period(from, to)})`,
    heading: 'Récap de la semaine',
    title: (name: string) => `La semaine de ${name}`,
    period,
    week: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    learned: 'Compétence acquise',
    learnedNone:
      'Pas de nouvelle compétence acquise cette semaine : les progrès se construisent séance après séance.',
    learnedMore: (more: number) => `et ${count(more, 'autre', 'autres')}`,
    toWork: 'Point à travailler',
    toWorkNone: 'Rien de particulier cette semaine.',
    mastery: (value: number) => `maîtrise ${value}${NBSP}%`,
  },

  monthly: {
    subject: (name: string, from: string) => `Récap ${ofMonth(from)} de ${name}`,
    heading: (from: string) => `Récap ${ofMonth(from)}`,
    title: (name: string) => `Le mois de ${name}`,
    month: monthYear,
    regularity: 'Régularité',
    doneDates: (dates: readonly string[]) => `Jours faits : ${dayList(dates)}.`,
    skippedDates: (dates: readonly { date: string; started: boolean }[]) =>
      `Jours sautés : ${joinAnd(
        dates.map(({ date, started }) => `${shortDay(date)}${started ? ' (commencée)' : ''}`),
      )}.`,
    noSkipped: 'Aucun jour sauté.',
    offDays: (off: number, vacation: number) =>
      [
        off > 0 && `${count(off, 'jour off', 'jours off')}`,
        vacation > 0 && `${count(vacation, 'jour de vacances', 'jours de vacances')}`,
      ]
        .filter(Boolean)
        .join(' et ')
        .replace(/.+/, (line) => `${line}.`) || null,
    mastery: 'Maîtrise par domaine',
    masteryLine: (domain: SkillDomain, start: number, end: number) =>
      `${DOMAINS[domain]} : de ${start}${NBSP}% à ${end}${NBSP}%`,
    masteryNote: 'Part du programme de la classe maîtrisée, au début et à la fin du mois.',
    learned: 'Appris ce mois-ci',
    learnedNone: 'Pas de nouvelle compétence maîtrisée ce mois-ci.',
    badges: 'Badges gagnés',
    badgesNone: 'Aucun badge ce mois-ci.',
    rewards: 'Récompenses débloquées',
    rewardsNone: 'Aucune récompense débloquée ce mois-ci.',
    blocking: 'Points de blocage',
    blockingNone: 'Pas de point de blocage ce mois-ci.',
    errors: (errors: number, answered: number) =>
      `${count(errors, 'erreur', 'erreurs')} sur ${count(answered, 'réponse', 'réponses')}`,
    programme: 'Comparaison au programme',
    advice: (from: string) => `3 conseils pour ${monthName(nextMonth(from))}`,
    adviceSource: {
      ai: 'Conseils rédigés par le coach à partir du bilan.',
      standard: 'Conseils tirés du bilan du mois.',
    },
    pdf: (from: string) =>
      `Le récap complet ${ofMonth(from)} est joint en PDF et reste téléchargeable dans l’app.`,
    generated: (date: string) => `Récap établi le ${longDay(date)}`,
    page: (page: number, pages: number) => `${page} / ${pages}`,
  },

  example: {
    prompt: 'Énoncé',
    given: 'Réponse',
    expected: 'Bonne réponse',
    mistake: 'Erreur repérée',
  },

  legend: {
    done: 'fait',
    started: 'commencé',
    missed: 'manqué',
    off: 'off ou vacances',
    pending: 'à venir',
  },

  cta: 'Voir les progrès dans l’app',
  openApp: 'Le détail est dans l’app, page Progrès.',
  footer: {
    why: (kind: 'weekly' | 'monthly') =>
      `Vous recevez cet email parce que le récap ${kind === 'weekly' ? 'hebdomadaire' : 'mensuel'} est activé pour votre compte parent.`,
    unsubscribe: (kind: 'weekly' | 'monthly') =>
      `Ne plus recevoir le récap ${kind === 'weekly' ? 'hebdomadaire' : 'mensuel'} par email`,
    unsubscribeAll: 'Ne plus recevoir aucun récap par email',
    settings: 'Les réglages sont aussi dans l’app : Récaps, depuis l’accueil parent.',
  },

  unsubscribed: {
    weekly:
      'C’est noté : vous ne recevrez plus le récap hebdomadaire par email. Vous pouvez le réactiver dans l’app, page Récaps.',
    monthly:
      'C’est noté : vous ne recevrez plus le récap mensuel par email. Vous pouvez le réactiver dans l’app, page Récaps.',
    all: 'C’est noté : vous ne recevrez plus aucun récap par email. Vous pouvez les réactiver dans l’app, page Récaps.',
    unknown:
      'Ce lien de désinscription n’est plus valable. Les réglages des récaps sont dans l’app, page Récaps.',
  },

  advice: {
    regularWeekday: (weekday: number) =>
      `Les ${weekdayName(weekday)}s sont souvent sautés : fixez ce jour-là un moment précis pour la séance, par exemple juste après le goûter.`,
    keepRhythm:
      'Gardez ce bon rythme : une séance courte chaque jour prévu vaut mieux qu’une longue de temps en temps.',
    setRhythm:
      'Installez un moment fixe pour la séance du jour, toujours à la même heure : l’habitude fait la moitié du travail.',
    mistake: (title: string, label: string) =>
      `Sur «\u00a0${title}\u00a0», votre enfant ${label} : refaites un exemple ensemble à voix haute, puis laissez-le en inventer un.`,
    hardest: (title: string) =>
      `Revoyez ensemble «\u00a0${title}\u00a0» : c’est la notion qui a demandé le plus d’efforts ce mois-ci.`,
    explain: (title: string) =>
      `Demandez à votre enfant de vous expliquer «\u00a0${title}\u00a0» : expliquer, c’est retenir.`,
    showMethod:
      'Demandez à votre enfant de vous montrer un exercice réussi et de vous expliquer sa méthode.',
    gaps: (title: string) =>
      `Quelques bases de l’an dernier sont à revoir, comme «\u00a0${title}\u00a0» : l’app les propose en révision, encouragez votre enfant à ne pas les sauter.`,
    everyday: (domain: SkillDomain) =>
      `Côté ${DOMAINS[domain].toLowerCase()}, profitez du quotidien : ${EVERYDAY[domain]}.`,
    celebrate: 'Fêtez les progrès du mois avec votre enfant : la fierté donne envie de continuer.',
  },

  facts: {
    regularity: (done: number, planned: number, weekday: number | null) =>
      planned > 0
        ? `Régularité : ${done} jours faits sur ${planned} prévus${weekday ? ` ; jour le plus souvent sauté : le ${weekdayName(weekday)}` : ''}`
        : `Régularité : ${done} jours d’exercices, sans routine`,
    success: (success: number | null, minutes: number) =>
      `Réussite : ${success === null ? 'trop peu de réponses pour juger' : `${Math.round(success * 100)} % de bonnes réponses`} ; temps total : ${minutes} minutes`,
    learned: (titles: readonly string[]) =>
      titles.length > 0
        ? `Compétences maîtrisées ce mois-ci : ${titles.join(' ; ')}`
        : 'Aucune nouvelle compétence maîtrisée ce mois-ci',
    blocking: (title: string, errors: number, label: string | null) =>
      `Point de blocage : «\u00a0${title}\u00a0» (${errors} erreurs${label ? ` ; erreur typique : ${label}` : ''})`,
    domain: (domain: SkillDomain, start: number, end: number) =>
      `${DOMAINS[domain]} : maîtrise de ${start} % à ${end} %`,
    programme: (programme: ProgrammePosition) =>
      `Programme : ${{ ahead: 'en avance', on_track: 'dans le rythme', behind: 'un peu en retard' }[programme.position ?? 'on_track']}${programme.gaps > 0 ? ` ; ${programme.gaps} notions des années précédentes à consolider` : ''}`,
    streak: (streak: number) => `Série en cours : ${streak} jours`,
  },
};

export type RecapTexts = typeof fr;

/** The texts in the family's language; French until others exist. */
export const textsFor = (language: string): RecapTexts => (language === 'fr' ? fr : fr);
