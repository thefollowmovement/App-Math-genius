import type {
  BadgeCode,
  ChallengeCode,
  CompanionId,
  CosmeticSlot,
  EarnedCosmeticId,
  HeroId,
  OutfitId,
  ParentRewardGoal,
  Rarity,
  ShopItemCode,
} from '@math-genius/shared';
import type { ThemeId } from '@math-genius/ui';

/** What a companion says in a session (strings.companions.talk). */
type CompanionLines = { ask: readonly string[]; hint: string; encourage: readonly string[] };
export type CompanionTalk = CompanionLines & {
  /** In its specialty, instead of the lines above. */
  special?: Partial<CompanionLines>;
  /** On fire: a right answer with 3 or more in a row. */
  fire?: readonly string[];
};

export const fr = {
  common: {
    loading: 'Chargement…',
    back: 'Retour',
  },
  welcome: {
    title: 'Bienvenue\u00a0!',
    subtitle: 'Qui utilise l’app aujourd’hui\u00a0?',
    parent: 'Je suis un parent',
    child: 'Je suis un enfant',
  },
  signUp: {
    title: 'Créer mon compte parent',
    intro:
      'Votre enfant n’aura ni email ni mot de passe\u00a0: c’est vous qui créez et gérez son profil.',
    displayName: 'Votre prénom',
    email: 'Email',
    password: 'Mot de passe (8 caractères minimum)',
    consent:
      'J’accepte la politique de confidentialité et je consens au traitement des données de mes enfants (pseudo, classe, résultats).',
    submit: 'Créer mon compte',
    hasAccount: 'J’ai déjà un compte',
    errors: {
      displayName: 'Indiquez votre prénom.',
      email: 'Cet email n’est pas valide.',
      password: 'Le mot de passe doit faire au moins 8 caractères.',
      acceptsPrivacyPolicy: 'Votre consentement est nécessaire pour créer le compte.',
    },
  },
  signIn: {
    title: 'Espace parent',
    email: 'Email',
    password: 'Mot de passe',
    submit: 'Me connecter',
    noAccount: 'Créer un compte',
    errors: {
      email: 'Cet email n’est pas valide.',
      password: 'Saisissez votre mot de passe.',
    },
  },
  parentHome: {
    title: 'Mes enfants',
    greeting: (name: string) => `Bonjour ${name}\u00a0!`,
    empty: 'Ajoutez le profil de votre enfant pour commencer.',
    addChild: 'Ajouter un enfant',
    childMode: 'Passer en mode enfant',
    signOut: 'Me déconnecter',
    today: {
      not_started: 'Pas encore de séance aujourd’hui',
      in_progress: 'Séance en cours',
      done: 'Séance du jour faite',
      missed: 'Séance manquée aujourd’hui',
      off: 'Pas de séance prévue aujourd’hui',
      vacation: 'En vacances',
    },
    todayScore: (score: number, answered: number, minutes: number) =>
      `${score}/${answered} · ${minutes}\u00a0min`,
    startsAt: (time: string) => `prévue à ${time}`,
    todayLine: (status: string, detail: string | null) =>
      detail ? `${status} · ${detail}` : status,
  },
  todaySessions: {
    title: 'Aujourd’hui',
    empty: 'Aucune séance aujourd’hui pour l’instant.',
    kinds: {
      daily: 'Séance du jour',
      bonus: 'Entraînement bonus',
      placement: 'Test de départ',
      boss: 'Défi de fin d’île',
      game: 'Mini-jeu',
    },
    states: {
      in_progress: 'En cours',
      validated: 'Validée',
      not_validated: 'Terminée, non validée',
      // A placement test: no goal to meet.
      finished: 'Terminé',
    },
    startedAt: (time: string) => `Commencée à ${time}`,
    score: (score: number, answered: number) =>
      answered === 0
        ? 'Pas encore de réponse'
        : `${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''} sur ${answered}`,
    duration: (minutes: number) => (minutes < 1 ? 'Moins d’1\u00a0min' : `${minutes}\u00a0min`),
    summary: (scoreText: string, durationText: string) => `${scoreText} · ${durationText}`,
    flagged: 'Beaucoup de réponses très rapides\u00a0: peut-être tapées au hasard.',
    open: 'Voir les questions',
  },
  sessionDetail: {
    title: 'Détail de la séance',
    question: (position: number, skill: string) => `Question ${position} · ${skill}`,
    answer: (text: string) => `Réponse\u00a0: ${text}`,
    skipped: '«\u00a0Je ne sais pas\u00a0»',
    rightAnswer: (text: string) => `Bonne réponse\u00a0: ${text}`,
    meta: (correct: boolean, seconds: number, hintUsed: boolean) =>
      [
        correct ? 'Juste' : 'Erreur',
        `${seconds}\u00a0s`,
        ...(hintUsed ? ['avec indice'] : []),
      ].join(' · '),
    unavailable: 'Cet exercice n’existe plus dans cette version de l’app.',
    empty: 'Aucune réponse pour l’instant.',
  },
  childForm: {
    title: 'Ajouter un enfant',
    displayName: 'Prénom ou pseudo',
    displayNameHint: 'Pas de nom de famille\u00a0: un prénom ou un pseudo suffit.',
    gender: 'Fille ou garçon',
    genderHint: 'Sert à proposer un thème et un avatar de départ, modifiables ensuite.',
    grade: 'Classe',
    birthYear: 'Année de naissance (facultatif)',
    choose: 'Choisir…',
    notProvided: 'Non renseignée',
    submit: 'Ajouter',
    errors: {
      displayName: 'Indiquez un prénom ou un pseudo (30 caractères maximum).',
      gender: 'Choisissez fille ou garçon.',
      grade: 'Choisissez la classe.',
    },
  },
  childDetail: {
    pairTitle: 'Relier le téléphone de l’enfant',
    pairSteps:
      'Sur le téléphone de l’enfant, ouvrez l’app, touchez « Je suis un enfant » puis scannez ce QR code ou tapez le code.',
    createCode: 'Afficher un code',
    newCode: 'Nouveau code',
    codeLabel: 'Code',
    expiresIn: (minutes: number) =>
      minutes > 1 ? `Valable encore ${minutes}\u00a0minutes` : 'Valable encore 1 minute',
    expired: 'Ce code a expiré.',
    paired: 'Appareil relié\u00a0!',
    devicesTitle: 'Appareils reliés',
    noDevices: 'Aucun appareil relié pour l’instant.',
    pairedOn: (date: string) => `Relié depuis le ${date}`,
    revoke: 'Retirer',
    profile: {
      title: 'Profil d’apprentissage et univers',
      consent: {
        intro: (name: string) =>
          `Avec votre accord, l’app apprend comment ${name} apprend et ce qui lui plaît, pour adapter ses explications.`,
        points: [
          'Un court questionnaire « Ton univers » sur ses jeux, sports, musiques… facultatif.',
          'Un profil recalculé chaque nuit à partir de ses réponses : forces, points à travailler, façon d’apprendre.',
          'Le coach ne reçoit qu’un résumé, sans prénom ni rien qui permette de reconnaître votre enfant.',
          'Aucune publicité, aucune revente. Vous pouvez tout modifier ou tout désactiver : tout est alors supprimé.',
        ],
        enable: 'Activer la personnalisation',
        off: 'Sans personnalisation, les explications prennent des exemples de la vie courante.',
      },
      updatedOn: (date: string) => `Profil mis à jour le ${date}`,
      pending: 'Le profil sera calculé après sa prochaine séance.',
      strengths: 'Ses forces',
      noStrength: 'Ses forces apparaîtront après quelques séances.',
      weaknesses: 'Points à travailler',
      noWeakness: 'Rien de particulier pour l’instant.',
      style: 'Sa façon d’apprendre',
      noStyle: 'Encore à observer : il faut quelques séances.',
      strength: {
        ahead: (strand: string) => `En avance en ${strand}`,
        solid: (strand: string, mastered: number) =>
          `À l’aise en ${strand} : ${mastered} compétences de l’année déjà maîtrisées`,
        best: (strand: string) => `Son point fort du moment : ${strand}`,
        mentalSpeed: (seconds: string, percent: number) =>
          `Calcul mental rapide : ${seconds} s par calcul, ${percent} % de réussite`,
        flawless: (run: number) => `Jusqu’à ${run} bonnes réponses d’affilée`,
      },
      weakness: {
        error: (label: string, count: number) => `${label} (${count} fois en 30 jours)`,
        behind: (strand: string) => `À consolider en ${strand}`,
        fading: (skill: string) => `À revoir : ${skill}`,
        stuck: (skill: string) => `Bloque sur : ${skill}`,
      },
      styleLine: {
        steady: (minutes: number) => `Garde sa concentration toute la séance (${minutes} min)`,
        drops: (minutes: number) => `Perd sa concentration après ${minutes} minutes environ`,
        bestTime: {
          morning: 'Plus efficace le matin',
          afternoon: 'Plus efficace l’après-midi',
          evening: 'Plus efficace en fin de journée',
        },
        afterError: {
          perseveres: 'Persévère après une erreur',
          gives_up: 'Abandonne parfois la séance après une erreur',
          guesses: 'Répond vite au hasard après une erreur',
        },
        twins: (percent: number) =>
          `Réussit ${percent} % des exercices jumeaux, après une correction`,
      },
      universe: 'Son univers',
      noUniverse: 'Pas encore de réponse au questionnaire « Ton univers ».',
      other: (answer: string) => `Autre : ${answer}`,
      otherStatus: {
        pending: 'en attente de relecture',
        approved: 'relu',
        rejected: 'écarté',
      },
      editUniverse: 'Modifier son univers',
      disable: 'Désactiver la personnalisation',
      disableConfirm:
        'Ses centres d’intérêt et son profil d’apprentissage seront supprimés. Vous pourrez réactiver la personnalisation plus tard.',
      confirm: 'Désactiver et supprimer',
      cancel: 'Annuler',
    },
    placement: {
      title: 'Test de départ',
      none: 'Pas encore passé\u00a0: il est proposé à l’enfant sur son accueil.',
      unavailable: 'Le test arrive bientôt pour cette classe.',
      takenOn: (date: string, grade: string) => `Passé le ${date}, en ${grade}`,
      inProgress: 'Test en cours sur l’appareil de l’enfant.',
      levels: {
        ahead: 'En avance',
        on_track: 'Au niveau',
        to_consolidate: 'À consolider',
      },
      untested: 'Pas encore évalué',
      priorities: 'Les 3 priorités',
      noPriority: 'Aucune lacune repérée\u00a0: les prochaines séances suivent le programme.',
      recheck: 'Un nouveau test est proposé tous les 3 mois et à chaque rentrée.',
      gradeChanged: (grade: string) =>
        `Résultat établi en ${grade}\u00a0: le prochain test tiendra compte de la nouvelle classe.`,
    },
    push: {
      enabled: 'Notifications activées.',
      denied:
        'Notifications refusées sur cet appareil\u00a0: autorisez-les dans les réglages du téléphone pour qu’il reçoive les rappels.',
      unsupported:
        'Cet appareil ne peut pas recevoir de notifications (navigateur, ou version de test de l’app comme Expo Go sur Android)\u00a0: rappels et messages ne lui parviennent pas.',
      unknown: 'Notifications\u00a0: état pas encore connu, ouvrez l’app sur cet appareil.',
    },
  },
  routine: {
    title: 'Routine',
    none: 'Pas encore de routine\u00a0: la séance dure 15\u00a0minutes et aucun rappel n’est envoyé.',
    set: 'Régler la routine',
    edit: 'Modifier la routine',
    everyDay: 'Tous les jours',
    weekdays: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
    shortWeekdays: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    daysLine: (days: string) => `Séance\u00a0: ${days}`,
    startLine: (time: string, others: string[]) => [`Début à ${time}`, ...others].join(', '),
    wednesdayAt: (time: string) => `${time} le mercredi`,
    weekendAt: (time: string) => `${time} le week-end`,
    deadlineLine: (time: string) => `Heure limite\u00a0: ${time}`,
    goalLine: (goal: string) => `Objectif\u00a0: ${goal}`,
    goals: {
      duration: (minutes: number) => `${minutes}\u00a0minutes`,
      count: (count: number) => `${count}\u00a0exercices`,
    },
    vacationLine: (from: string, to: string) => `Vacances du ${from} au ${to}`,
    form: {
      days: 'Jours de séance',
      startTime: 'Heure de début',
      wednesday: 'Autre horaire le mercredi',
      wednesdayStartTime: 'Début le mercredi',
      weekend: 'Autre horaire le week-end',
      weekendStartTime: 'Début le week-end',
      deadlineTime: 'Heure limite',
      deadlineHint: 'Au-delà, la séance du jour est comptée comme manquée.',
      goal: 'Objectif de la séance',
      submit: 'Enregistrer la routine',
      saved: 'Routine enregistrée.',
      errors: {
        days: 'Choisissez au moins un jour.',
        deadlineTime: 'L’heure limite doit venir après chaque heure de début.',
      },
    },
    vacations: {
      title: 'Vacances',
      intro:
        'Pendant les vacances, la routine est suspendue\u00a0: pas de séance prévue ni de rappel.',
      empty: 'Aucune période de vacances prévue.',
      from: 'Premier jour',
      to: 'Dernier jour',
      add: 'Ajouter ces vacances',
      remove: 'Supprimer',
      removeLabel: (period: string) => `Supprimer les vacances du ${period}`,
      period: (from: string, to: string) => `Du ${from} au ${to}`,
    },
  },
  nudge: {
    title: (name: string) => `Envoyer un message à ${name}`,
    intro: 'Il s’affiche sur son appareil, même app fermée.',
    suggestions: [
      'C’est l’heure de ta séance de maths\u00a0!',
      'Tu fais ta mission du jour maintenant\u00a0?',
      'Je compte sur toi pour ta séance.',
    ],
    message: 'Message',
    send: 'Envoyer',
    sent: 'Message envoyé.',
    noDevice: (name: string) =>
      `Message non reçu\u00a0: aucun appareil de ${name} ne reçoit les notifications (voir « Appareils reliés »).`,
    unreachable: (name: string) =>
      `Aucun appareil de ${name} ne reçoit les notifications pour l’instant\u00a0: les rappels et ce message ne lui parviendront pas.`,
    errors: {
      message: 'Écrivez un message (120 caractères maximum).',
    },
  },
  notifications: {
    channel: 'Rappels de séance',
  },
  pairDevice: {
    title: 'Relie ton appareil',
    intro: 'Demande à ton parent d’afficher le code dans son app.',
    scan: 'Scanne le QR code',
    allowCamera: 'Autoriser la caméra',
    cameraDenied: 'La caméra n’est pas autorisée\u00a0: tape le code à la place.',
    orType: 'ou tape le code',
    code: 'Code à 6 caractères',
    submit: 'Valider',
    parentSession:
      'Cet appareil est connecté avec un compte parent\u00a0: choisis directement ton profil.',
    errors: {
      code: 'Le code fait 6 lettres ou chiffres.',
    },
  },
  profiles: {
    title: 'Qui joue aujourd’hui\u00a0?',
    empty: 'Aucun profil sur cet appareil.',
    pairAnother: 'Ajouter un profil',
  },
  childHome: {
    switchProfile: 'Changer de profil',
    ready: 'Ta mission du jour t’attend.',
    readyGoal: (goal: string) => `Ta mission du jour t’attend\u00a0: ${goal}.`,
    dayOff: 'Pas de séance prévue aujourd’hui. Tu peux t’entraîner quand même\u00a0!',
    vacation: 'C’est les vacances\u00a0! Tu peux t’entraîner si tu en as envie.',
    todayDone: 'Séance du jour terminée, bravo\u00a0!',
    notAvailable: 'Les exercices de ta classe arrivent bientôt.',
    offline: 'Pas de réseau\u00a0: tes réponses restent sur l’appareil et partiront plus tard.',
    syncing: 'Envoi de tes réponses…',
    level: (level: number) => `Niv.\u00a0${level}`,
    levelLabel: (level: number, title: string) => `Niveau ${level}, ${title}`,
    xp: (inLevel: number, toNext: number) => `${inLevel} / ${toNext}\u00a0XP`,
    xpLabel: 'XP du niveau',
    xpValue: (inLevel: number, toNext: number) => `${inLevel}\u00a0XP sur ${toNext}`,
    stats: { streak: 'Jours', gems: 'Gemmes', badges: 'Badges' },
    badgesLabel: (count: number) =>
      `${count} badge${count > 1 ? 's' : ''} gagné${count > 1 ? 's' : ''}`,
    mission: {
      daily: 'Mission du jour',
      off: 'Jour de repos',
      vacation: 'Vacances',
      done: 'Mission accomplie',
      free: 'Entraînement libre',
      before: (time: string) => `À finir avant ${time}`,
      progress: 'Mission du jour',
      details: (goal: string, skill: string) => `${goal} · ${skill}`,
    },
    // Short labels for the big buttons, in capitals in the arcade font.
    start: 'Jouer',
    resume: 'Continuer',
    resumeLabel: (percent: number) => `Reprendre ma séance (${percent}\u00a0%)`,
    train: 'M’entraîner',
    bonus: 'Entraînement bonus',
    nav: {
      label: 'Mes pages',
      map: 'Carte',
      shop: 'Boutique',
      badges: 'Badges',
      look: 'Mon héros',
      games: 'Jeux',
    },
  },
  games: {
    room: {
      title: 'Salle de jeux',
      intro: (companion: string) => `${companion} t’attend pour jouer\u00a0!`,
      playtime: (played: number, limit: number) =>
        `Temps de jeu aujourd’hui\u00a0: ${played}\u00a0min sur ${limit}`,
      gems: (earned: number, cap: number) =>
        `Gemmes des jeux aujourd’hui\u00a0: ${earned} sur ${cap}`,
      gemsFull:
        'Tu as gagné toutes les gemmes des jeux du jour. Les jeux rapportent encore de l’XP.',
      limitReached: 'C’est tout pour aujourd’hui\u00a0! Reviens demain pour jouer encore.',
      off: 'Les jeux sont en pause. Tes parents peuvent les rallumer.',
      record: (score: number) => `Record\u00a0: ${score}`,
      noRecord: 'Pas encore de record',
      stars: (count: number) => `${count} étoile${count > 1 ? 's' : ''} sur 3`,
      play: (name: string) => `Jouer à ${name}`,
      soon: 'Bientôt',
      open: 'Salle de jeux',
      openHint: 'Joue avec ton compagnon aux jeux de maths.',
    },
    items: {
      'peche-eclair': {
        name: 'Pêche éclair',
        pitch: 'Pêche le poisson qui porte la bonne réponse.',
        howTo:
          'Quand le bouchon plonge, appuie vite sur PÊCHER\u00a0! Ne garde que le poisson qui porte la bonne réponse.',
        hint: 'Attends que le bouchon plonge…',
      },
      'pluie-de-gemmes': {
        name: 'Pluie de gemmes',
        pitch: 'Attrape la gemme de la bonne réponse, évite les bombes.',
        howTo:
          'Glisse ton doigt pour bouger ton compagnon. La bonne gemme rapporte gros, une mauvaise se change en bombe. Les croquettes donnent des petits points.',
        hint: 'Glisse ton doigt pour bouger',
      },
      'vol-du-chaton': {
        name: 'Vol du Chaton',
        pitch: 'Vole entre les nuages et passe par la bonne bulle.',
        howTo:
          'Touche l’écran pour battre des ailes. Tous les 3 piliers, deux passages\u00a0: passe par celui de la bonne réponse.',
        hint: 'Touche l’écran pour voler',
      },
      'bulles-magiques': {
        name: 'Bulles magiques',
        pitch: 'Touche les bulles qui font le nombre cible.',
        howTo:
          'Des bulles montent avec des nombres. Touche deux bulles qui, ensemble, font le nombre cible.',
        hint: 'Touche deux bulles',
      },
      'memory-du-compagnon': {
        name: 'Memory du compagnon',
        pitch: 'Retrouve chaque calcul et son résultat.',
        howTo: 'Retourne deux cartes\u00a0: un calcul et son résultat forment une paire.',
        hint: 'Retourne deux cartes',
      },
      'course-des-croquettes': {
        name: 'Course des croquettes',
        pitch: 'Cours dans le couloir de la bonne réponse.',
        howTo:
          'Glisse à gauche ou à droite pour changer de couloir. Passe la porte de la bonne réponse et ramasse les croquettes.',
        hint: 'Glisse pour changer de couloir',
      },
    },
    play: {
      loading: 'Le jeu se prépare…',
      start: 'JOUER',
      ready: 'Prêt\u00a0?',
      pause: 'Pause',
      paused: 'Pause',
      resume: 'Reprendre',
      quit: 'Arrêter la partie',
      sound: 'Sons',
      vibration: 'Vibrations',
      fish: 'PÊCHER\u00a0!',
      fishHint: 'Pêcher le poisson qui mord',
      scoreLabel: (score: number) => `Score\u00a0: ${score}`,
      timeLabel: (seconds: number) => `Encore ${seconds}\u00a0secondes`,
      hearts: (count: number) => `${count} cœur${count > 1 ? 's' : ''}`,
      question: 'Question',
      target: (target: string) => `Fais ${target}`,
      noQuestion: 'Pas de question qui convienne à ce jeu pour l’instant.',
      sceneLabel: (name: string) => `Jeu ${name}`,
    },
    end: {
      titles: [
        'Joli essai\u00a0!',
        'Bien joué\u00a0!',
        'Super partie\u00a0!',
        'Incroyable\u00a0!',
      ] as const,
      record: 'Nouveau record\u00a0!',
      right: (right: number, answered: number) =>
        `${right} bonne${right > 1 ? 's' : ''} réponse${right > 1 ? 's' : ''} sur ${answered}`,
      score: 'Score',
      xp: 'XP',
      gems: 'Gemmes',
      gemsFull: 'Gemmes des jeux au maximum pour aujourd’hui',
      tile: (label: string, value: string) => `${label}\u00a0: ${value}`,
      pending: 'en cours de calcul',
      saved:
        'Partie enregistrée sur l’appareil\u00a0: tes récompenses arrivent dès qu’elle est envoyée.',
      again: 'REJOUER',
      room: 'Salle de jeux',
      limitReached: 'C’est tout pour les jeux aujourd’hui. À demain\u00a0!',
      cheer: (companion: string) => `${companion} a adoré jouer avec toi\u00a0!`,
    },
  },
  practice: {
    pause: 'Pause',
    pauseLabel: 'Mettre la séance en pause',
    progress: (percent: number) => `Séance faite à ${percent}\u00a0%`,
    counter: {
      count: (done: number, total: number) => `${done}/${total}`,
      minutes: (done: number, total: number) => `${done}/${total}\u00a0min`,
      countLabel: (done: number, total: number) =>
        `${done} exercice${done > 1 ? 's' : ''} sur ${total}`,
      minutesLabel: (done: number, total: number) =>
        `${done}\u00a0minute${done > 1 ? 's' : ''} sur ${total}`,
    },
    combo: (count: number) => `Combo x${count}`,
    comboLabel: (count: number) => `${count} bonnes réponses d’affilée\u00a0!`,
    slots: {
      current: 'Je découvre',
      review: 'Je révise',
      automatism: 'Calcul éclair',
      challenge: 'Défi',
    },
    twin: 'Une autre chance',
    boss: (island: string) => `🐉 Boss · ${island}`,
    reminder: 'Petit rappel',
    hint: 'Un indice\u00a0?',
    hintAsk: 'Besoin d’un coup de main\u00a0? Touche-moi pour un indice.',
    hintTitle: 'Indice',
    submit: 'Valider',
    continue: 'Continuer',
    finish: 'Voir mon bilan',
    correct: ['Bravo\u00a0!', 'Exact\u00a0!', 'Super\u00a0!', 'Bien joué\u00a0!'],
    fast: 'Rapide comme l’éclair\u00a0!',
    wrong: 'Pas tout à fait…',
    rightAnswer: 'La bonne réponse',
    explanation: 'Comment faire',
    // The coach's explanation after a wrong answer, presented by the child's hero.
    coach: {
      title: (hero: string) => `${hero} t’explique`,
      thinking: 'Attends, je cherche comment t’expliquer…',
      what: 'Ce qui s’est passé',
      image: 'Imagine',
      tip: 'L’astuce',
      understood: 'J’ai compris',
      again: 'Explique autrement',
      noOther: 'C’est ma meilleure explication pour l’instant.',
    },
    unreadable: 'Je n’arrive pas à lire ta réponse\u00a0: vérifie-la.',
    notIrreducible: 'C’est juste, mais simplifie ta fraction.',
    forms: {
      fraction: 'C’est la bonne valeur\u00a0: écris-la sous forme de fraction.',
      decimal: 'C’est la bonne valeur\u00a0: écris-la avec une virgule.',
      integer: 'C’est la bonne valeur\u00a0: écris-la sous forme de nombre entier.',
    },
    trueLabel: 'Vrai',
    falseLabel: 'Faux',
    keypad: {
      answer: 'Ta réponse',
      delete: 'Effacer',
      minus: 'Moins',
      comma: 'Virgule',
      fraction: 'Barre de fraction',
    },
    numberLine: {
      line: 'Droite graduée',
      cursor: (position: number, count: number) => `Curseur, graduation ${position} sur ${count}`,
      left: 'Vers la gauche',
      right: 'Vers la droite',
      answer: 'La bonne place',
    },
    order: {
      yours: 'Ton rangement',
      help: 'Touche les étiquettes dans l’ordre. Touche-les encore pour les enlever.',
      remove: (item: string) => `Enlever ${item}`,
    },
    match: {
      help: 'Touche une étiquette à gauche, puis celle qui va avec à droite.',
      pair: (label: string, pair: number) => `${label}, paire ${pair}`,
    },
    shade: {
      help: 'Touche les parts pour les colorier.',
      part: (position: number, shaded: boolean) =>
        shaded ? `Part ${position}, coloriée` : `Part ${position}`,
      answer: (count: number, parts: number) => `${count} parts coloriées sur ${parts}`,
    },
  },
  /** The placement test (docs/specs.md, Test de positionnement): no score, no timer. */
  placement: {
    strands: {
      numeration: 'Nombres',
      calcul: 'Calcul',
      fractions: 'Fractions',
      mesures: 'Mesures',
      geometrie: 'Géométrie',
      problemes: 'Problèmes et données',
    },
    intro: {
      first: {
        label: 'Aventure de départ',
        title: (name: string) => `En route pour l’aventure, ${name}\u00a0!`,
        text: 'Quelques questions pour savoir par où commencer ton voyage sur la carte du monde.',
      },
      recheck: {
        label: 'Point d’étape',
        title: (name: string) => `On fait le point, ${name}\u00a0?`,
        text: 'Quelques questions pour voir tout le chemin que tu as parcouru.',
      },
      points: [
        'Ce n’est pas une interro\u00a0: pas de note, pas de chrono.',
        'Prends ton temps et fais de ton mieux.',
        'Tu ne sais pas\u00a0? Touche «\u00a0Je ne sais pas\u00a0», c’est permis\u00a0!',
      ],
      start: 'C’est parti',
      later: 'Plus tard',
    },
    card: {
      firstText: 'Réponds à quelques questions pour découvrir ta carte du monde.',
      recheckText: 'Quelques questions pour faire le point sur tes progrès.',
      resumeText: 'Ton aventure t’attend\u00a0: reprends où tu en étais.',
      start: 'Commencer',
      resume: 'Reprendre',
    },
    test: {
      label: 'Aventure de départ',
      labelRecheck: 'Point d’étape',
      progress: (percent: number) => `Aventure faite à ${percent}\u00a0%`,
      pauseLabel: 'Faire une pause\u00a0: l’aventure t’attendra',
      submit: 'Valider',
      skip: 'Je ne sais pas',
      cheers: [
        'Prends ton temps, je suis là.',
        'Fais de ton mieux, c’est tout ce qui compte.',
        'Chaque réponse m’aide à préparer ta carte.',
        'On avance bien\u00a0!',
        'Pas de stress\u00a0: il n’y a pas de note.',
        'Tu ne connais pas encore\u00a0? Pas grave, on l’apprendra ensemble.',
      ],
    },
    result: {
      label: 'Ta carte du monde',
      title: 'Ton aventure commence\u00a0!',
      hero: 'Aventure terminée, bravo\u00a0! Voici ta carte\u00a0: ta première mission t’attend.',
      islands: 'Tes îles',
      soon: 'Bientôt',
      opened: (open: number, playable: number) =>
        `${open} étape${open > 1 ? 's' : ''} ouverte${open > 1 ? 's' : ''} sur ${playable}`,
      mission: 'Ta première mission',
      allDone:
        'Tu as déjà tout franchi sur la carte de ta classe\u00a0: entraîne-toi pour garder ton niveau\u00a0!',
      play: 'Jouer',
      map: 'Voir ma carte',
      close: 'Retour à l’accueil',
    },
  },
  universe: {
    // The questions and the names of the universes come from the catalogue (database).
    intro: {
      first: {
        label: 'Ton univers',
        title: (name: string) => `Dis-moi ce que tu aimes, ${name} !`,
        text: 'Tes jeux, ton sport, ta musique… Je m’en servirai pour t’expliquer les maths avec des exemples qui te parlent.',
      },
      again: {
        label: 'Ton univers',
        title: (name: string) => `Tes goûts ont changé, ${name} ?`,
        text: 'Dis-moi ce que tu aimes en ce moment : mes exemples suivront.',
      },
      points: [
        'Choisis autant de réponses que tu veux.',
        'Rien ne te plaît ? Passe à la question suivante.',
        'Tu pourras tout changer quand tu veux, dans « Mon héros ».',
      ],
      start: 'C’est parti',
      later: 'Plus tard',
    },
    step: (index: number, total: number) => `Question ${index} sur ${total}`,
    progress: 'Avancement du questionnaire',
    pickMany: 'Choisis tout ce que tu aimes.',
    other: 'Autre chose ? Écris-le',
    otherHint: 'Quelqu’un de l’équipe le lira avant qu’il serve d’exemple.',
    next: 'Suivant',
    finish: 'Terminer',
    back: 'Question précédente',
    close: 'Fermer',
    saved: {
      label: 'Ton univers',
      title: 'C’est noté !',
      hero: 'Super ! Je vais m’en servir pour mes exemples.',
      continue: 'Continuer',
    },
    card: {
      firstText: 'Dis-moi ce que tu aimes pour des exemples à ton image.',
      againText: 'Tes goûts ont changé ? Mets ton univers à jour.',
      answer: 'Répondre',
      update: 'Mettre à jour',
    },
    look: {
      title: 'Ton univers',
      empty: 'Pas encore choisi : dis-moi ce que tu aimes.',
      edit: 'Modifier mon univers',
    },
  },
  superPower: {
    label: 'Ton super-pouvoir',
    mental_speed: { title: 'As du calcul mental', text: 'Tes calculs fusent !' },
    flawless: { title: 'As du sans-faute', text: 'Les bonnes réponses s’enchaînent.' },
    strands: {
      numeration: 'As des nombres',
      calcul: 'As du calcul',
      fractions: 'As des fractions',
      mesures: 'As des mesures',
      geometrie: 'As de la géométrie',
      problemes: 'As des problèmes',
    },
    how: {
      ahead: 'Tu es en avance !',
      solid: 'Tu maîtrises déjà plein de choses.',
      best: 'C’est là que tu brilles en ce moment.',
    },
  },
  summary: {
    // A validated mission takes the theme's line (themes.*.goalMet).
    bossOver: 'Combat terminé\u00a0!',
    finished: 'Séance terminée\u00a0!',
    notValidated:
      'Pour valider une mission, il faut au moins 6 bonnes réponses sur 10. Tu y arriveras la prochaine fois\u00a0!',
    score: (correct: number, answered: number) =>
      `${correct} bonne${correct > 1 ? 's' : ''} réponse${correct > 1 ? 's' : ''} sur ${answered}`,
    duration: (minutes: number) => `${minutes}\u00a0min d’entraînement`,
    progressed: 'Tu as progressé en\u00a0:',
    mastery: (title: string, value: number) => `${title}\u00a0: ${value}\u00a0/\u00a0100`,
    saved: 'Séance enregistrée.',
    savedOffline: 'Séance gardée sur l’appareil\u00a0: elle partira dès que le réseau revient.',
    bonus: 'Entraînement bonus',
    home: 'Retour à l’accueil',
    homeShort: 'Accueil',
    stars: (count: number) => `${count} étoile${count > 1 ? 's' : ''} sur 3`,
    tiles: { score: 'Score', streak: 'Série', xp: 'XP gagnés', gems: 'Gemmes' },
    scoreValue: (correct: number, answered: number) => `${correct}/${answered}`,
    streakValue: (days: number) => `${days}\u00a0jour${days > 1 ? 's' : ''}`,
    plus: (count: number) => `+${count}`,
    pending: '…',
    xpLabel: (xp: number) => `${xp}\u00a0XP gagnés`,
    gemsLabel: (gems: number) =>
      `${gems}\u00a0gemme${gems > 1 ? 's' : ''} gagnée${gems > 1 ? 's' : ''}`,
    rare: 'Rare\u00a0!',
    chest: 'Ton coffre',
    rareChest: 'Ton coffre rare',
    openChest: 'Ouvrir le coffre',
  },
  rewards: {
    gem: '💎',
    streak: (days: number) => `${days}`,
    streakLabel: (days: number) => `Série de ${days} jour${days > 1 ? 's' : ''}`,
    gems: (count: number) => `${count}`,
    gemsLabel: (count: number) => `${count} gemme${count > 1 ? 's' : ''}`,
    /** Titles by level, from the first level each one starts at. */
    titles: [
      [1, 'Petite graine'],
      [3, 'Pousse futée'],
      [5, 'Esprit vif'],
      [8, 'As du calcul'],
      [12, 'Génie en herbe'],
      [17, 'Légende des maths'],
    ] as const,
    chestsWaiting: (count: number) =>
      count > 1 ? `${count} coffres t’attendent\u00a0!` : 'Un coffre t’attend\u00a0!',
    openChest: 'Ouvrir mon coffre',
    open: 'Ouvrir',
    parentLine: (streak: number, best: number, level: number, gems: number, badges: number) =>
      [
        `Série\u00a0: ${streak} jour${streak > 1 ? 's' : ''}${best > streak ? ` (record\u00a0: ${best})` : ''}`,
        `niveau ${level}`,
        `${gems} gemme${gems > 1 ? 's' : ''}`,
        `${badges} badge${badges > 1 ? 's' : ''}`,
      ].join(' · '),
  },
  award: {
    waiting: 'Tes récompenses arriveront dès que ta séance sera envoyée.',
    computing: 'Calcul de tes récompenses…',
    streakUp: 'Ta série continue\u00a0!',
    levelUp: (level: number) => `Niveau ${level} atteint\u00a0!`,
    newBadges: (count: number) => (count > 1 ? 'Nouveaux badges\u00a0!' : 'Nouveau badge\u00a0!'),
    seeBadges: 'Voir mes badges',
    parentReward: (title: string) =>
      `🎁 Récompense débloquée\u00a0: ${title}\u00a0! Demande-la à ton parent.`,
    challengeDone: (gems: number) => `🏅 Défi de la semaine réussi\u00a0! +${gems}\u00a0gemmes`,
    bossWon: 'Boss vaincu\u00a0!',
    islandDone: (island: string) => `Tu as terminé ${island}\u00a0!`,
    bossWonAgain: 'Tu l’as encore battu, bravo\u00a0!',
    bossLost: (needed: number) =>
      `Le boss résiste… Il faut ${needed}\u00a0bonnes réponses pour le vaincre. Retente ta chance\u00a0!`,
  },
  chest: {
    common: 'Coffre',
    rare: 'Coffre rare',
    hint: 'Touche le coffre pour l’ouvrir.',
    open: 'Ouvrir le coffre',
    found: (gems: number) => `+${gems}\u00a0gemmes\u00a0!`,
    total: (total: number) => `Tu as maintenant ${total}\u00a0gemme${total > 1 ? 's' : ''}.`,
    done: 'Super\u00a0!',
    gone: 'Ce coffre est déjà ouvert.',
  },
  parentRewards: {
    title: 'Récompenses',
    intro:
      'Fixez une vraie récompense et l’objectif qui la débloque\u00a0: votre enfant voit sa progression.',
    empty: 'Aucune récompense pour l’instant.',
    goals: { streak: 'Jours de série', xp: 'Points d’expérience (XP)', islands: 'Îles terminées' },
    goalText: {
      streak: (target: number) => `${target}\u00a0jour${target > 1 ? 's' : ''} de série`,
      xp: (target: number) => `${target.toLocaleString('fr-FR')}\u00a0XP`,
      islands: (target: number) =>
        `${target}\u00a0île${target > 1 ? 's' : ''} terminée${target > 1 ? 's' : ''}`,
    },
    form: {
      title: 'Récompense',
      titleHint: 'Par exemple\u00a0: une sortie au cinéma.',
      goal: 'Objectif',
      target: 'À atteindre',
      add: 'Ajouter la récompense',
    },
    errors: { title: 'Indiquez la récompense (60 caractères maximum).' },
    status: {
      locked: 'À débloquer',
      unlocked: 'Débloquée\u00a0: à remettre',
      given: 'Remise',
    },
    progress: (value: number, target: number) =>
      `${value.toLocaleString('fr-FR')} / ${target.toLocaleString('fr-FR')}`,
    give: 'Je l’ai remise',
    giveLabel: (title: string) => `Marquer « ${title} » comme remise`,
    remove: 'Supprimer',
    removeLabel: (title: string) => `Supprimer la récompense « ${title} »`,
    child: {
      title: 'Ta prochaine récompense',
      label: 'Récompense',
      icon: '🎁',
      remaining: {
        streak: (left: number) => `Encore ${left}\u00a0jour${left > 1 ? 's' : ''}`,
        xp: (left: number) => `Encore ${left.toLocaleString('fr-FR')}\u00a0XP`,
        islands: (left: number) => `Encore ${left}\u00a0île${left > 1 ? 's' : ''}`,
      } satisfies Record<ParentRewardGoal, (left: number) => string>,
      unlocked: 'Débloquée\u00a0! Demande-la à ton parent.',
      progressLabel: (value: number, target: number) => `Récompense\u00a0: ${value} sur ${target}`,
    },
  },
  challenge: {
    title: 'Défi de la semaine',
    icon: '🏅',
    /** Short names, for the home's card; `items` says the whole rule. */
    names: {
      'daily-5': '5 missions du jour',
      'correct-150': '150 bonnes réponses',
      'combo-10': 'Combo de 10',
      'skills-6': '6 compétences',
      'perfect-1': 'Une séance sans faute',
      'minutes-60': '60 minutes d’entraînement',
    } satisfies Record<ChallengeCode, string>,
    /** One per code of packages/shared/src/challenges.ts. */
    items: {
      'daily-5': 'Réussis 5 missions du jour cette semaine.',
      'correct-150': 'Donne 150 bonnes réponses cette semaine.',
      'combo-10': 'Enchaîne 10 bonnes réponses d’affilée.',
      'skills-6': 'Réussis des exercices dans 6 compétences différentes.',
      'perfect-1': 'Fais une séance d’au moins 10 exercices sans aucune erreur.',
      'minutes-60': 'Entraîne-toi 60 minutes cette semaine.',
    } satisfies Record<ChallengeCode, string>,
    progress: (value: number, threshold: number) => `${value} / ${threshold}`,
    progressLabel: (value: number, threshold: number) =>
      `Défi avancé\u00a0: ${value} sur ${threshold}`,
    done: 'Défi réussi\u00a0! Un nouveau défi arrive lundi.',
    doneShort: 'Réussi\u00a0!',
    cardLabel: (rule: string, value: number, threshold: number, gems: number) =>
      `Défi de la semaine\u00a0: ${rule} ${value} sur ${threshold}. À gagner\u00a0: ${gems}\u00a0gemmes.`,
  },
  shop: {
    title: 'Boutique',
    open: 'Boutique',
    balance: (gems: number) => `Tu as ${gems}\u00a0gemme${gems > 1 ? 's' : ''}`,
    intro: 'Tout s’achète avec les gemmes gagnées en t’entraînant.',
    kinds: {
      companion: 'Compagnons',
      outfit: 'Tenues',
      accessory: 'Accessoires',
      effect: 'Effets de victoire',
    },
    kindHints: {
      companion: 'Il t’accompagne dans tes missions et t’aide quand tu bloques.',
      outfit: 'Ton héros la porte partout\u00a0: accueil, missions, carte.',
      accessory: 'Il décore le portrait de ton héros.',
      effect: 'Il fête la fin de tes séances.',
    },
    freezes: {
      title: 'Gels de série',
      icon: '🧊',
      hint: 'Un gel protège ta série si tu manques un jour. Un gel est offert chaque lundi.',
      count: (count: number, max: number) => `${count} sur ${max}`,
      buy: (price: number) => `Acheter un gel (${price}\u00a0💎)`,
      full: 'Tu as déjà le maximum de gels.',
    },
    price: (gems: number) => `${gems}\u00a0💎`,
    missing: (gems: number) => `Encore ${gems}\u00a0gemme${gems > 1 ? 's' : ''}`,
    buy: 'Acheter',
    buyLabel: (name: string, price: number) => `Acheter ${name} pour ${price}\u00a0gemmes`,
    wear: 'Porter',
    takeOff: 'Retirer',
    worn: 'Porté',
    wearLabel: (name: string) => `Porter ${name}`,
    takeOffLabel: (name: string) => `Retirer ${name}`,
    owned: 'À toi',
    /** One per code of packages/shared/src/shop.ts; companions are named by strings.companions. */
    items: {
      bow: { icon: '🎀', name: 'Nœud' },
      cap: { icon: '🧢', name: 'Casquette' },
      sunglasses: { icon: '🕶️', name: 'Lunettes de soleil' },
      'top-hat': { icon: '🎩', name: 'Chapeau haut-de-forme' },
      crown: { icon: '👑', name: 'Couronne' },
      confetti: { icon: '🎉', name: 'Confettis' },
      sparkles: { icon: '✨', name: 'Étincelles' },
      rainbow: { icon: '🌈', name: 'Arc-en-ciel' },
      fireworks: { icon: '🎆', name: 'Feu d’artifice' },
    } satisfies Record<
      Exclude<ShopItemCode, CompanionId | OutfitId>,
      { icon: string; name: string }
    >,
  },
  map: {
    title: 'Carte du monde',
    open: 'Carte du monde',
    islands: {
      numbers: { icon: '🏝️', name: 'Île des Nombres', the: 'l’île des Nombres' },
      measures: { icon: '⛰️', name: 'Île des Mesures', the: 'l’île des Mesures' },
      geometry: { icon: '🔷', name: 'Île des Formes', the: 'l’île des Formes' },
      data: { icon: '📊', name: 'Île des Données', the: 'l’île des Données' },
    },
    progress: (mastered: number, playable: number) =>
      `${mastered} compétence${mastered > 1 ? 's' : ''} maîtrisée${mastered > 1 ? 's' : ''} sur ${playable}`,
    soon: 'Île en construction\u00a0: ses exercices arrivent bientôt.',
    status: {
      to_discover: 'À découvrir',
      in_progress: 'En cours',
      mastered: 'Maîtrisée',
      to_review: 'À réviser',
      locked: 'Pas encore ouverte',
      coming_soon: 'Bientôt',
    },
    node: (title: string, status: string, mastery: number | null) =>
      mastery === null
        ? `${title}\u00a0: ${status}`
        : `${title}\u00a0: ${status}, ${mastery}\u00a0/\u00a0100`,
    island: (index: number, grade: string) => `Île ${index} · ${grade}`,
    previous: 'Île précédente',
    next: 'Île suivante',
    counter: (mastered: number, playable: number) => `${mastered}/${playable}`,
    here: 'C’est ici\u00a0!',
    hereLabel: 'Tu es ici',
    masteryLine: (status: string, mastery: number | null) =>
      mastery === null ? status : `Maîtrise ${mastery}\u00a0% · ${status}`,
    pathLabel: (island: string) => `Le chemin de ${island}`,
    boss: {
      icon: '🐉',
      name: 'Le boss de l’île',
      title: 'Boss · Le Glitch',
      short: {
        locked: 'Maîtrise l’île',
        ready: 'Il t’attend\u00a0!',
        defeated: 'Vaincu\u00a0!',
      },
      locked: 'Maîtrise toutes les compétences de l’île pour l’affronter.',
      ready: 'Le boss t’attend\u00a0!',
      defeated: 'Boss vaincu\u00a0! Tu peux l’affronter de nouveau.',
      fight: 'Affronter le boss',
      busy: 'Termine d’abord ta séance en cours.',
    },
  },
  badges: {
    title: 'Mes badges',
    open: (earned: number) => (earned > 0 ? `Mes badges (${earned})` : 'Mes badges'),
    count: (earned: number, total: number) =>
      `${earned} badge${earned > 1 ? 's' : ''} sur ${total}`,
    loading: 'Chargement de tes badges…',
    earned: 'Gagné\u00a0!',
    progress: (value: number, threshold: number) => `${value} / ${threshold}`,
    earnedLabel: (title: string, description: string) => `${title}, gagné\u00a0: ${description}`,
    lockedLabel: (title: string, description: string, value: number, threshold: number) =>
      `${title}, pas encore gagné\u00a0: ${description} (${value} sur ${threshold})`,
    locked: '🔒',
    categories: {
      regularity: 'Régularité',
      mastery: 'Maîtrise',
      discovery: 'Découverte',
      progression: 'Progression',
    },
    /** One per code of packages/shared/src/badges.ts. */
    items: {
      'streak-3': { icon: '🔥', title: 'Bien parti', description: '3 jours de série' },
      'streak-7': { icon: '🔥', title: 'Une semaine de feu', description: '7 jours de série' },
      'streak-14': {
        icon: '⚡',
        title: 'Deux semaines d’affilée',
        description: '14 jours de série',
      },
      'streak-30': { icon: '🌟', title: 'Un mois de feu', description: '30 jours de série' },
      'streak-50': { icon: '💪', title: 'Inarrêtable', description: '50 jours de série' },
      'streak-100': { icon: '🏆', title: 'Cent jours', description: '100 jours de série' },
      'streak-365': { icon: '👑', title: 'Une année de feu', description: '365 jours de série' },
      'sessions-1': {
        icon: '🎯',
        title: 'Première mission',
        description: 'Réussir ta première mission du jour',
      },
      'sessions-10': {
        icon: '🎯',
        title: 'Dix missions',
        description: '10 missions du jour réussies',
      },
      'sessions-25': {
        icon: '🚀',
        title: 'Vingt-cinq missions',
        description: '25 missions du jour réussies',
      },
      'sessions-50': {
        icon: '🛰️',
        title: 'Cinquante missions',
        description: '50 missions du jour réussies',
      },
      'sessions-100': {
        icon: '🌍',
        title: 'Cent missions',
        description: '100 missions du jour réussies',
      },
      weekend: {
        icon: '🌞',
        title: 'Même le week-end',
        description: 'Une séance un samedi ou un dimanche',
      },
      comeback: {
        icon: '🌈',
        title: 'Le grand retour',
        description: 'Reprendre ta série après une pause',
      },
      'mastery-1': {
        icon: '🌱',
        title: 'Première compétence',
        description: 'Maîtriser une compétence',
      },
      'mastery-5': {
        icon: '🌿',
        title: 'Cinq compétences',
        description: 'Maîtriser 5 compétences',
      },
      'mastery-10': {
        icon: '🌳',
        title: 'Dix compétences',
        description: 'Maîtriser 10 compétences',
      },
      'mastery-25': {
        icon: '🏔️',
        title: 'Vingt-cinq compétences',
        description: 'Maîtriser 25 compétences',
      },
      tables: {
        icon: '✖️',
        title: 'As des tables',
        description: 'Maîtriser les tables de multiplication',
      },
      'mental-math': {
        icon: '⚡',
        title: 'Calcul éclair',
        description: 'Maîtriser 3 compétences de calcul mental',
      },
      'all-domains': {
        icon: '🧭',
        title: 'Touche-à-tout',
        description: 'Maîtriser une compétence en nombres, mesures, géométrie et données',
      },
      'combo-10': { icon: '💥', title: 'Combo ×10', description: '10 bonnes réponses d’affilée' },
      'combo-25': { icon: '🌪️', title: 'Combo ×25', description: '25 bonnes réponses d’affilée' },
      'perfect-5': {
        icon: '✨',
        title: 'Cinq sans-faute',
        description: '5 séances sans aucune erreur',
      },
      'perfect-20': {
        icon: '🎖️',
        title: 'Vingt sans-faute',
        description: '20 séances sans aucune erreur',
      },
      'answers-100': {
        icon: '✅',
        title: '100 bonnes réponses',
        description: '100 bonnes réponses',
      },
      'answers-1000': {
        icon: '🧠',
        title: '1\u00a0000 bonnes réponses',
        description: '1\u00a0000 bonnes réponses',
      },
      'answers-5000': {
        icon: '🎓',
        title: '5\u00a0000 bonnes réponses',
        description: '5\u00a0000 bonnes réponses',
      },
      'perfect-1': {
        icon: '⭐',
        title: 'Premier sans-faute',
        description: 'Une séance d’au moins 10 exercices sans erreur',
      },
      'bonus-1': { icon: '➕', title: 'Encore plus\u00a0!', description: 'Faire une séance bonus' },
      'rare-chest': { icon: '🗝️', title: 'Coffre rare', description: 'Gagner un coffre rare' },
      'explorer-10': {
        icon: '🔭',
        title: 'Exploration',
        description: 'Réussir des exercices dans 10 compétences',
      },
      'explorer-25': {
        icon: '🗺️',
        title: 'Grande exploration',
        description: 'Réussir des exercices dans 25 compétences',
      },
      'gems-100': { icon: '💰', title: 'Petit trésor', description: 'Gagner 100 gemmes' },
      'level-5': { icon: '🥉', title: 'Niveau 5', description: 'Atteindre le niveau 5' },
      'level-10': { icon: '🥈', title: 'Niveau 10', description: 'Atteindre le niveau 10' },
      'level-20': { icon: '🥇', title: 'Niveau 20', description: 'Atteindre le niveau 20' },
      'island-1': { icon: '🏝️', title: 'Première île', description: 'Vaincre le boss d’une île' },
      'island-2': { icon: '⛵', title: 'Deux îles', description: 'Vaincre les boss de 2 îles' },
      'island-4': { icon: '🧭', title: 'Tour des îles', description: 'Vaincre les boss de 4 îles' },
      'boss-perfect': {
        icon: '🐉',
        title: 'Boss sans faute',
        description: 'Vaincre un boss sans aucune erreur',
      },
      'challenge-1': {
        icon: '🏅',
        title: 'Premier défi',
        description: 'Réussir un défi de la semaine',
      },
      'challenge-5': {
        icon: '🎖️',
        title: 'Cinq défis',
        description: 'Réussir 5 défis de la semaine',
      },
      'first-exercise': {
        icon: '✏️',
        title: 'Premier exercice',
        description: 'Terminer son tout premier exercice',
      },
    } satisfies Record<BadgeCode, { icon: string; title: string; description: string }>,
  },
  /** The six heroes (packages/shared/src/heroes.ts, docs/design/personnages.md). */
  heroes: {
    items: {
      nova: { name: 'Nova', role: 'Étoile du rythme' },
      juno: { name: 'Juno', role: 'Reine des combos' },
      mika: { name: 'Mika', role: 'Fée des étoiles' },
      kai: { name: 'Kai', role: 'Maître du beat' },
      taro: { name: 'Taro', role: 'Roi des défis' },
      leo: { name: 'Leo', role: 'Héros de la scène' },
    } satisfies Record<HeroId, { name: string; role: string }>,
    label: (name: string, role: string) => `${name}, ${role}`,
    portrait: (name: string, wearing: string[] = [], outfit?: string) =>
      [`Ton héros, ${name}`, outfit, wearing.length > 0 ? `avec ${wearing.join(' et ')}` : null]
        .filter((part) => part)
        .join(', '),
    // What the child's hero says. Never a reproach: the firm reminders go to the parent.
    encourage: [
      'Pas grave\u00a0! C’est en se trompant qu’on apprend.',
      'Regarde bien la correction, la prochaine est pour toi\u00a0!',
      'Courage, tu progresses à chaque essai\u00a0!',
      'Tout le monde se trompe. On continue ensemble\u00a0?',
    ],
    cheer: [
      'Super séance aujourd’hui\u00a0!',
      'Quelle mission\u00a0! Tu m’impressionnes.',
      'Bravo, ton cerveau a bien travaillé\u00a0!',
    ],
    proud: 'Tu as bien travaillé. On réessaie demain\u00a0?',
    hint: 'Réfléchissons ensemble…',
  },
  /** The heroes' outfits (packages/shared/src/outfits.ts, docs/design/tenues). */
  outfits: {
    /** The outfit every hero wears until it chooses another. */
    stage: {
      name: 'Tenue de scène',
      short: 'Scène',
      worn: 'en tenue de scène',
      description: 'La tenue de star de ton héros, toujours à toi.',
    },
    items: {
      sport: {
        name: 'Tenue de sport',
        short: 'Sport',
        worn: 'en tenue de sport',
        description: 'Un survêtement néon rose et cyan, parfait pour les défis chrono.',
      },
      astronaute: {
        name: 'Tenue d’astronaute',
        short: 'Astronaute',
        worn: 'en tenue d’astronaute',
        description: 'Une combinaison spatiale blanche et lilas, pour partir explorer les îles.',
      },
      magie: {
        name: 'Tenue de magie',
        short: 'Magie',
        worn: 'en tenue de magie',
        description:
          'Une cape étoilée et une baguette dorée\u00a0: abracadabra, les calculs\u00a0!',
      },
    } satisfies Record<
      OutfitId,
      { name: string; short: string; worn: string; description: string }
    >,
    preview: 'Aperçu',
    previewLabel: (hero: string, outfit: string) => `${hero} ${outfit}`,
    worn: 'C’est la tenue de ton héros.',
    toSave: 'Enregistre pour la garder.',
  },
  /** The companions beside the hero (packages/shared/src/companions.ts, docs/design/compagnons.md). */
  companions: {
    items: {
      hibou: {
        name: 'Chouette Galactique',
        fullName: 'Chouette Galactique des Théorèmes',
        description:
          'Une petite chouette au plumage étoilé, avec des lunettes dorées marquées du symbole ∞ et une boussole magique qui flotte près d’elle.',
        specialty: 'Les indices et les explications. C’est elle qui te guide au début.',
      },
      lapin: {
        name: 'Lapin Street',
        fullName: 'Lapin Streetwear',
        description:
          'Un lapin blanc magique, avec ses lunettes de scène jaune fluo et sa chaîne dorée.',
        specialty: 'Le calcul rapide et les défis chrono.',
      },
      dragon: {
        name: 'Draco',
        fullName: 'Draco Géomètre',
        description:
          'Un bébé dragon bleu néon qui tient un cristal géométrique lumineux à douze faces.',
        specialty: 'Les indices de géométrie.',
      },
      licorne: {
        name: 'Licorne de Cristal',
        fullName: 'Poulain Licorne-Pégase de Cristal',
        description:
          'Une petite créature ailée à la crinière menthe et rose, avec une corne prismatique qui brille de toutes les couleurs.',
        specialty: 'Les fractions et les formes.',
      },
      tigre: {
        name: 'Baekho',
        fullName: 'Tigreau Blanc Streetwear (Baekho)',
        description:
          'Inspiré du tigre blanc des légendes coréennes\u00a0: rayures violettes lumineuses, sweat jaune et collier à pampille traditionnelle (norigae).',
        specialty: 'Le courage et la régularité, jour après jour.',
      },
      renard: {
        name: 'Kitsune',
        fullName: 'Kitsune Pastel',
        description:
          'Un petit renard à neuf queues violet pastel, avec un micro-casque d’idol doré.',
        specialty: 'Les encouragements dignes d’une star de la scène.',
      },
      chat: {
        name: 'Chaton Cosmique',
        fullName: 'Chaton Cosmique',
        description: 'Un chaton étoilé aux ailes de fée roses lumineuses.',
        specialty: 'Les encouragements tout doux.',
      },
      phenix: {
        name: 'Phénix',
        fullName: 'Bébé Phénix Idol',
        description:
          'Un oiseau de feu magenta, cyan et or, avec une mini-couronne dorée et un micro-casque étoilé.',
        specialty:
          'Les séries de bonnes réponses\u00a0: avec lui, tu passes en mode «\u00a0en feu\u00a0».',
      },
    } satisfies Record<
      CompanionId,
      { name: string; fullName: string; description: string; specialty: string }
    >,
    rarities: {
      common: 'Commun',
      rare: 'Rare',
      epic: 'Épique',
      legendary: 'Légendaire',
    } satisfies Record<Rarity, string>,
    rarityLabel: (rarity: string) => `Rareté\u00a0: ${rarity}`,
    specialty: 'Sa spécialité',
    cardLabel: (name: string, rarity: string) => `${name}, ${rarity}`,
    unlocked: (name: string) => `Nouveau compagnon\u00a0: ${name}\u00a0!`,
    /**
     * What each companion says during a session: it offers the hint (`ask`), gives it (`hint`,
     * before the hint's text) and encourages after a wrong answer. `special` replaces them when
     * the exercise is its specialty (Draco on geometry, the Licorne on fractions, Lapin Street on a
     * timed calculation); Phénix catches fire (`fire`) from 3 right answers in a row. Never a
     * reproach.
     */
    talk: {
      hibou: {
        ask: [
          'Hou hou\u00a0! Un indice\u00a0?',
          'Tu veux que je t’explique\u00a0? Un indice\u00a0?',
        ],
        hint: 'Hou hou, écoute bien',
        encourage: [
          'Hou hou\u00a0! Lis la correction avec moi, c’est comme ça qu’on comprend.',
          'Une erreur, c’est une piste. On regarde la correction ensemble\u00a0?',
        ],
      },
      lapin: {
        ask: ['Un indice\u00a0? Je fais vite\u00a0!', 'Coincé\u00a0? Un indice, hop\u00a0!'],
        hint: 'Astuce express',
        encourage: [
          'Pas grave\u00a0! Même les plus rapides trébuchent.',
          'Hop, on repart\u00a0! Le prochain, tu le files.',
        ],
        special: {
          ask: ['Un indice éclair\u00a0?'],
          hint: 'Astuce chrono',
          encourage: ['Trop vite\u00a0? Respire, le prochain chrono est pour toi\u00a0!'],
        },
      },
      dragon: {
        ask: ['Un indice\u00a0? Je veille sur toi.', 'Grr… un petit indice\u00a0?'],
        hint: 'Mon conseil de dragon',
        encourage: [
          'Pas grave\u00a0! Même les dragons se trompent.',
          'On souffle un bon coup et on recommence\u00a0!',
        ],
        special: {
          ask: ['Un indice de géomètre\u00a0?', 'Mon cristal a vu la forme… un indice\u00a0?'],
          hint: 'Regarde bien la figure',
          encourage: ['Les formes, ça s’apprivoise. Regarde bien la correction\u00a0!'],
        },
      },
      licorne: {
        ask: ['Un indice magique\u00a0?', 'Je fais briller un indice\u00a0?'],
        hint: 'Un peu de magie',
        encourage: [
          'Pas grave, ma magie est avec toi\u00a0!',
          'On regarde la correction, et ça va briller\u00a0!',
        ],
        special: {
          ask: ['Un indice de cristal sur les fractions\u00a0?'],
          hint: 'Pense aux parts égales',
          encourage: ['Les fractions, ce sont des parts\u00a0: regarde bien la correction\u00a0!'],
        },
      },
      tigre: {
        ask: ['Un indice\u00a0? Les tigres aussi demandent de l’aide.'],
        hint: 'Conseil de tigre',
        encourage: [
          'Un vrai tigre ne lâche rien\u00a0! On continue.',
          'Chaque jour tu deviens plus fort. Courage\u00a0!',
        ],
      },
      renard: {
        ask: ['Un indice\u00a0? Je te souffle la réplique\u00a0!'],
        hint: 'Je te souffle',
        encourage: [
          'Sur scène aussi on rate une note\u00a0: on reprend le refrain\u00a0!',
          'Le public est avec toi\u00a0! À la prochaine, tu brilles.',
        ],
      },
      chat: {
        ask: ['Miaou… un petit indice\u00a0?'],
        hint: 'Tout doux',
        encourage: [
          'Ce n’est rien, tu fais de ton mieux. Je suis là.',
          'Doucement, on regarde ensemble. Tu vas y arriver.',
        ],
      },
      phenix: {
        ask: ['Un indice\u00a0? Ça va chauffer\u00a0!'],
        hint: 'Une étincelle',
        encourage: [
          'Un phénix renaît toujours\u00a0: on rallume la série\u00a0!',
          'La flamme est toujours là. On repart\u00a0!',
        ],
        special: { ask: ['Même en feu, un petit indice\u00a0?'] },
        fire: [
          'Tu es en feu\u00a0! 🔥',
          'Série brûlante, continue\u00a0!',
          'Rien ne t’arrête, tu flambes\u00a0!',
        ],
      },
    } satisfies Record<CompanionId, CompanionTalk>,
  },
  /** The child's first time on a device: they choose their hero, who explains the app. */
  intro: {
    progress: (step: number, count: number) => `Étape ${step} sur ${count}`,
    choose: {
      crew: 'Ta crew néon',
      title: 'Choisis ton héros',
      text: 'Des stars de la scène qui chassent les monstres de calcul.',
      later: 'Il t’accompagne dans toutes tes missions. Tu pourras en changer quand tu veux.',
      confirm: 'C’est moi\u00a0!',
      confirmLabel: (name: string) => `Je choisis ${name}\u00a0!`,
    },
    steps: [
      {
        title: (name: string) => `Salut ${name}\u00a0!`,
        text: (hero: string) =>
          `Moi, c’est ${hero}. Ensemble, on va chasser les monstres de calcul\u00a0!`,
      },
      {
        title: () => 'Une mission par jour',
        text: () =>
          'Chaque jour, quelques minutes d’exercices, à ton rythme. Se tromper, c’est comme ça qu’on apprend\u00a0!',
      },
      {
        title: () => 'Des trésors à gagner',
        text: () =>
          'Gagne des gemmes et des badges pour débloquer des auras, des cadres et des compagnons.',
      },
    ],
    next: 'Suivant',
    start: 'C’est parti\u00a0!',
    customize: 'Personnaliser mon héros',
  },
  /** One per theme of packages/ui/src/theme/themes. */
  themes: {
    neon: {
      icon: '🎤',
      name: 'Neon Stage',
      description: 'La scène de concert\u00a0: néons, projecteurs et paillettes.',
      goalMet: 'Mission accomplie\u00a0!',
    },
    kawaii: {
      icon: '🌸',
      name: 'Kawaii',
      description: 'Des couleurs douces, des formes rondes et de petits animaux.',
      goalMet: 'Youpi, mission accomplie\u00a0!',
    },
    manga: {
      icon: '⚡',
      name: 'Manga',
      description: 'Des couleurs vives, des effets de vitesse et des onomatopées.',
      goalMet: 'BOUM\u00a0! Mission accomplie\u00a0!',
    },
    space: {
      icon: '🚀',
      name: 'Espace',
      description: 'Le bleu de la nuit, des planètes et des étoiles.',
      goalMet: 'Mission réussie, astronaute\u00a0!',
    },
  } satisfies Record<ThemeId, { icon: string; name: string; description: string; goalMet: string }>,
  look: {
    title: 'Personnaliser',
    open: 'Personnaliser',
    intro:
      'Choisis ton héros, ce qui l’entoure et ton thème\u00a0: tu vois le résultat avant d’enregistrer.',
    hero: 'Ton héros',
    style: 'Sa tenue et son style',
    themes: 'Ton thème',
    slots: {
      outfit: 'Tenue',
      aura: 'Aura',
      frame: 'Cadre',
      companion: 'Compagnon',
      accessory: 'Accessoire',
      head: 'Tête',
      top: 'Haut',
      bottom: 'Bas',
      shoes: 'Chaussures',
    } satisfies Record<CosmeticSlot, string>,
    none: 'Aucun',
    noneLabel: (slot: string) => `${slot}\u00a0: aucun`,
    /** Names of the cosmetics that are not shop items (shop.items names the others). */
    cosmetics: {
      'aura-pink': 'Aura rose néon',
      'aura-cyan': 'Aura cyan',
      'aura-gold': 'Aura dorée',
      'aura-green': 'Aura verte',
      'aura-rainbow': 'Aura arc-en-ciel',
      'frame-neon': 'Cadre néon',
      'frame-stars': 'Cadre étoilé',
      'frame-crown': 'Cadre couronne',
      'frame-lightning': 'Cadre éclair',
      'frame-gold': 'Cadre en or',
      'golden-mic': 'Micro doré',
    } satisfies Record<EarnedCosmeticId, string>,
    lockedLabel: (item: string) => `${item}, pas encore débloqué`,
    lockedBadge: (item: string, badge: string) =>
      `🔒 ${item}\u00a0: se débloque avec le badge «\u00a0${badge}\u00a0».`,
    lockedShop: (item: string, price: number) =>
      `🛍️ ${item}\u00a0: à acheter dans la boutique (${price}\u00a0💎).`,
    lock: '🔒',
    chosen: 'Choisi',
    themeLabel: (name: string, description: string) => `Thème ${name}. ${description}`,
    save: 'Enregistrer',
  },
  genders: {
    girl: 'Fille',
    boy: 'Garçon',
  },
  grades: {
    CP: 'CP',
    CE1: 'CE1',
    CE2: 'CE2',
    CM1: 'CM1',
    CM2: 'CM2',
    '6e': '6e',
    '5e': '5e',
    '4e': '4e',
    '3e': '3e',
  },
  platforms: {
    ios: 'iPhone ou iPad',
    android: 'Android',
    web: 'Navigateur',
  },
  errors: {
    invalidCredentials: 'Email ou mot de passe incorrect.',
    emailTaken: 'Un compte existe déjà avec cet email.',
    invalidPairingCode: 'Ce code ne marche pas. Vérifie-le ou demande un nouveau code.',
    deviceInOtherFamily: 'Cet appareil est déjà relié à une autre famille.',
    tooManyMessages:
      'Vous venez d’envoyer un message\u00a0: attendez 2\u00a0minutes avant le suivant.',
    notEnoughGems: 'Il manque des gemmes pour cet achat.',
    alreadyOwned: 'Cet objet est déjà acheté.',
    tooManyFreezes: 'Le stock de gels est déjà plein.',
    avatarLocked: 'Cet objet n’est pas encore débloqué.',
    personalizationOff: 'La personnalisation n’est pas activée pour ce profil.',
    network: 'Pas de connexion. Vérifiez le réseau et réessayez.',
    unknown: 'Une erreur est survenue. Réessayez.',
  },
} as const;
