// Generated from services/recaps/src/index.ts by `pnpm functions:bundle`. Do not edit.

// src/format.ts
var NBSP = "\xA0";
var MONTHS = [
  "janvier",
  "f\xE9vrier",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "ao\xFBt",
  "septembre",
  "octobre",
  "novembre",
  "d\xE9cembre"
];
var WEEKDAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
function dayOf(date2) {
  const [year = 1970, month = 1, day = 1] = date2.split("-").map(Number);
  return { year, month, day };
}
function isoWeekday(date2) {
  const { year, month, day } = dayOf(date2);
  const sunday0 = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return sunday0 === 0 ? 7 : sunday0;
}
var weekdayName = (weekday) => WEEKDAYS[(weekday - 1 + 7) % 7] ?? "";
var monthName = (date2) => MONTHS[dayOf(date2).month - 1] ?? "";
var ofMonth = (date2) => {
  const name = monthName(date2);
  return /^[aeiouéèh]/.test(name) ? `d\u2019${name}` : `de ${name}`;
};
var dayNumber = (day) => day === 1 ? "1er" : String(day);
var longDay = (date2) => `${weekdayName(isoWeekday(date2))} ${dayNumber(dayOf(date2).day)} ${monthName(date2)}`;
function period(from, to) {
  const start = dayOf(from);
  const end = dayOf(to);
  if (start.month === end.month && start.year === end.year) {
    return `du ${dayNumber(start.day)} au ${dayNumber(end.day)} ${monthName(to)}`;
  }
  return `du ${dayNumber(start.day)} ${monthName(from)} au ${dayNumber(end.day)} ${monthName(to)}`;
}
var monthYear = (date2) => `${monthName(date2)} ${dayOf(date2).year}`;
function nextMonth(date2) {
  const { year, month } = dayOf(date2);
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  return `${next.year}-${String(next.month).padStart(2, "0")}-01`;
}
var shortDay = (date2) => `${weekdayName(isoWeekday(date2))} ${dayNumber(dayOf(date2).day)}`;
var dayList = (dates) => joinAnd(dates.map(shortDay));
function joinAnd(items) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`;
}
var integer = (value) => Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
var percent = (rate2) => `${Math.round(rate2 * 100)}${NBSP}%`;
function duration(minutes) {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total}${NBSP}min`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  return rest === 0 ? `${hours}${NBSP}h` : `${hours}${NBSP}h${NBSP}${String(rest).padStart(2, "0")}`;
}
var count = (value, one, many) => `${integer(value)}${NBSP}${value > 1 ? many : one}`;

// src/advice.ts
function mostSkippedWeekday(recap) {
  const counts = /* @__PURE__ */ new Map();
  for (const { date: date2 } of recap.skippedDates) {
    const weekday = isoWeekday(date2);
    counts.set(weekday, (counts.get(weekday) ?? 0) + 1);
  }
  let best = null;
  for (const entry of counts) if (!best || entry[1] > best[1]) best = entry;
  return best && best[1] >= 2 ? best[0] : null;
}
var regularityTip = (recap, texts) => {
  const weekday = mostSkippedWeekday(recap);
  if (recap.skippedDates.length >= 3 && weekday) return texts.advice.regularWeekday(weekday);
  if (recap.planned > 0 && recap.done >= 0.8 * recap.planned) return texts.advice.keepRhythm;
  if (recap.planned === 0 && recap.active >= 8) return texts.advice.keepRhythm;
  return texts.advice.setRhythm;
};
var mistakeTip = (recap, texts) => {
  const [point] = recap.blocking;
  if (point?.errorLabel) return texts.advice.mistake(point.title, point.errorLabel);
  if (point) return texts.advice.hardest(point.title);
  const learnt = recap.learned.at(-1);
  return learnt ? texts.advice.explain(learnt.title) : texts.advice.showMethod;
};
var strengthenTip = (recap, texts) => {
  const programme = recap.programme;
  if (programme?.position === "behind" && programme.gapTitles[0]) {
    return texts.advice.gaps(programme.gapTitles[0]);
  }
  const weakest = [...recap.domains].filter((domain) => domain.total > 0).sort((a, b) => a.end - b.end)[0];
  return weakest ? texts.advice.everyday(weakest.domain) : texts.advice.celebrate;
};
function standardAdvice(recap, texts) {
  return [regularityTip(recap, texts), mistakeTip(recap, texts), strengthenTip(recap, texts)];
}
function adviceFacts(recap, texts) {
  const { facts } = texts;
  return [
    facts.regularity(recap.done, recap.planned, mostSkippedWeekday(recap)),
    facts.success(recap.verdict.success, recap.minutes),
    facts.streak(recap.streak),
    facts.learned(recap.learned.map((skill) => skill.title)),
    ...recap.blocking.map((point) => facts.blocking(point.title, point.errors, point.errorLabel)),
    ...recap.domains.map((domain) => facts.domain(domain.domain, domain.start, domain.end)),
    ...recap.programme?.position ? [facts.programme(recap.programme)] : []
  ];
}

// ../../packages/shared/src/grade.ts
var GRADES = ["CP", "CE1", "CE2", "CM1", "CM2", "6e", "5e", "4e", "3e"];

// ../../packages/shared/src/progress.ts
var isRow = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var list = (value) => Array.isArray(value) ? value : [];
var num = (value, fallback = 0) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback;
};
var optionalNum = (value) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
};
var text = (value) => typeof value === "string" ? value : "";
var optionalText = (value) => typeof value === "string" ? value : null;
var oneOf = (values, value) => values.find((item) => item === value) ?? null;
var DATE = /^\d{4}-\d{2}-\d{2}$/;
var date = (value) => typeof value === "string" && DATE.test(value) ? value : null;
var compact = (items) => items.filter((item) => item !== null);
var DOMAINS = ["numbers", "measures", "geometry", "data"];
var PLANS = ["planned", "off", "vacation", "none"];
var STATUSES = [
  "done",
  "started",
  "missed",
  "off",
  "vacation",
  "pending",
  "none"
];
var LEVELS = ["good", "watch", "alert", "none"];
var RANKS = ["ahead", "on_track", "behind"];
function readVerdict(value) {
  const row = isRow(value) ? value : {};
  return {
    level: oneOf(LEVELS, row.level) ?? "none",
    regularity: optionalNum(row.regularity),
    success: optionalNum(row.success),
    planned: num(row.planned),
    done: num(row.done),
    active: num(row.active),
    answered: num(row.answered),
    correct: num(row.correct),
    irregular: row.irregular === true,
    struggling: row.struggling === true
  };
}
function readDay(value) {
  if (!isRow(value)) return null;
  const day = date(value.date);
  const plan = oneOf(PLANS, value.plan);
  const status = oneOf(STATUSES, value.status);
  return day && plan && status ? { date: day, plan, status } : null;
}
function readDomainChange(value) {
  if (!isRow(value)) return null;
  const domain = oneOf(DOMAINS, value.domain);
  return domain ? {
    domain,
    start: num(value.start),
    end: num(value.end),
    mastered: num(value.mastered),
    total: num(value.total)
  } : null;
}
function readExample(value) {
  if (!isRow(value)) return null;
  const generatorId2 = text(value.generator_id);
  if (!generatorId2) return null;
  return {
    generatorId: generatorId2,
    difficulty: num(value.difficulty),
    seed: num(value.seed),
    answer: value.answer ?? null,
    errorType: optionalText(value.error_type),
    errorLabel: optionalText(value.error_label)
  };
}
function readBlocking(value) {
  if (!isRow(value)) return null;
  const skill = text(value.skill);
  if (!skill) return null;
  return {
    skill,
    title: text(value.title),
    errors: num(value.errors),
    answered: num(value.answered),
    errorType: optionalText(value.error_type),
    errorLabel: optionalText(value.error_label),
    example: readExample(value.example)
  };
}
function readProgramme(value) {
  if (!isRow(value)) return null;
  const grade = oneOf(GRADES, value.grade);
  if (!grade) return null;
  return {
    grade,
    yearProgress: num(value.year_progress),
    total: num(value.total),
    expected: num(value.expected),
    mastered: num(value.mastered),
    working: num(value.working),
    gaps: num(value.gaps),
    gapTitles: list(value.gap_titles).filter((title) => typeof title === "string"),
    position: oneOf(RANKS, value.position)
  };
}
function readChild(value) {
  if (!isRow(value)) return null;
  const grade = oneOf(GRADES, value.grade);
  const id = text(value.id);
  return grade && id ? { id, name: text(value.name), grade } : null;
}
var readLearnt = (value) => compact(
  list(value).map(
    (item) => isRow(item) && text(item.skill) ? { skill: text(item.skill), title: text(item.title) } : null
  )
);
var strings = (value) => list(value).filter((item) => typeof item === "string");
function readToWork(value) {
  if (!isRow(value)) return null;
  if ("errors" in value) return readBlocking(value);
  const skill = text(value.skill);
  return skill ? { skill, title: text(value.title), mastery: num(value.mastery) } : null;
}
function readRecap(value) {
  if (!isRow(value)) return null;
  const child = readChild(value.child);
  const from = date(value.from);
  const to = date(value.to);
  if (!child || !from || !to) return null;
  const common = {
    child,
    from,
    to,
    days: compact(list(value.days).map(readDay)),
    planned: num(value.planned),
    done: num(value.done),
    active: num(value.active),
    minutes: num(value.minutes),
    answered: num(value.answered),
    correct: num(value.correct),
    xp: num(value.xp),
    streak: num(value.streak),
    bestStreak: num(value.best_streak),
    learned: readLearnt(value.learned),
    verdict: readVerdict(value.verdict)
  };
  if (value.kind === "weekly") {
    return {
      kind: "weekly",
      ...common,
      extra: num(value.extra),
      toWork: readToWork(value.to_work)
    };
  }
  if (value.kind !== "monthly") return null;
  return {
    kind: "monthly",
    ...common,
    offDays: num(value.off_days),
    vacationDays: num(value.vacation_days),
    doneDates: compact(list(value.done_dates).map(date)),
    skippedDates: compact(
      list(value.skipped_dates).map((item) => {
        const day = isRow(item) ? date(item.date) : null;
        return day && isRow(item) ? { date: day, started: item.started === true } : null;
      })
    ),
    domains: compact(list(value.domains).map(readDomainChange)),
    badges: strings(value.badges),
    rewards: strings(value.rewards),
    blocking: compact(list(value.blocking).map(readBlocking)),
    programme: readProgramme(value.programme)
  };
}
function readAdvice(value) {
  if (!isRow(value)) return null;
  const source = oneOf(["ai", "standard"], value.source);
  const tips = strings(value.tips).filter((tip) => tip.trim() !== "");
  return source && tips.length > 0 ? { source, tips } : null;
}

// ../../packages/curriculum/src/types.ts
function defineGradeSkills(grade, programVersion, skills2) {
  return skills2.map((skill) => ({ ...skill, subject: "math", grade, programVersion }));
}

// ../../packages/curriculum/src/grades/cinquieme.ts
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

// ../../packages/curriculum/src/grades/ce2.ts
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

// ../../packages/curriculum/src/grades/cm1.ts
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

// ../../packages/curriculum/src/grades/cm2.ts
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

// ../../packages/curriculum/src/grades/sixieme.ts
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

// ../../packages/curriculum/src/error-types.ts
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

// ../../packages/curriculum/src/index.ts
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

// ../../packages/exercise-engine/src/random.ts
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
    sample: (items, count2) => {
      if (count2 > items.length) throw new RangeError("sample larger than the list");
      return shuffle(items).slice(0, count2);
    },
    shuffle,
    chance: (probability) => next() < probability
  };
}

// ../../packages/exercise-engine/src/generator.ts
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

// ../../packages/exercise-engine/src/rational.ts
function gcd(a, b) {
  let [x, y] = [Math.abs(a), Math.abs(b)];
  while (y !== 0) [x, y] = [y, x % y];
  return x;
}
function rational(num3, den = 1) {
  if (!Number.isSafeInteger(num3) || !Number.isSafeInteger(den) || den === 0) {
    throw new RangeError(`Invalid rational ${num3}/${den}`);
  }
  const divisor = gcd(num3, den) * Math.sign(den);
  const reducedNum = num3 / divisor;
  return { num: reducedNum === 0 ? 0 : reducedNum, den: den / divisor };
}
function decimal(scaled, places) {
  return rational(scaled, 10 ** places);
}
var add = (a, b) => rational(a.num * b.den + b.num * a.den, a.den * b.den);
var sub = (a, b) => rational(a.num * b.den - b.num * a.den, a.den * b.den);
var mul = (a, b) => rational(a.num * b.num, a.den * b.den);
var div = (a, b) => rational(a.num * b.den, a.den * b.num);
var compare = (a, b) => Math.sign(a.num * b.den - b.num * a.den);
function isTerminating(value) {
  let den = value.den;
  while (den % 2 === 0) den /= 2;
  while (den % 5 === 0) den /= 5;
  return den === 1;
}

// ../../packages/exercise-engine/src/format.ts
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
function formatFraction(num3, den) {
  return `${num3 < 0 ? MINUS : ""}${Math.abs(num3)}/${den}`;
}
function formatNumber(value) {
  const exact = typeof value === "number" ? rational(value) : value;
  if (exact.den === 1) return formatInteger(exact.num);
  return isTerminating(exact) ? formatDecimal(exact) : formatFraction(exact.num, exact.den);
}
function formatAnswer(exercise) {
  const { num: num3, den } = exercise.answer;
  return exercise.display === "fraction" && den !== 1 ? formatFraction(num3, den) : formatNumber(exercise.answer);
}
function formatOperand(value) {
  const text4 = formatNumber(value);
  return text4.startsWith(MINUS) ? `(${text4})` : text4;
}

// ../../packages/exercise-engine/src/generators/helpers.ts
function distinct(count2, make, key = String) {
  const values = /* @__PURE__ */ new Map();
  for (let attempt = 0; values.size < count2; attempt++) {
    if (attempt > 1e4) throw new Error(`Could not draw ${count2} distinct values`);
    const value = make();
    values.set(key(value), value);
  }
  return [...values.values()];
}
function list2(items) {
  return items.length < 2 ? items[0] ?? "" : `${items.slice(0, -1).join(", ")} et ${items.at(-1)}`;
}
function plural(count2, singular, pluralForm = `${singular}s`) {
  return `${count2} ${count2 > 1 ? pluralForm : singular}`;
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
function swapped(list4, i, j) {
  if (i < 0 || j < 0) return void 0;
  const copy = [...list4];
  [copy[i], copy[j]] = [list4[j] ?? 0, list4[i] ?? 0];
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
    ([num4, den]) => den === 10 && fractions.some(([k, d]) => k === num4 && d === 100)
  );
  const num3 = fractions[tenth]?.[0];
  return swapped(
    answer,
    tenth,
    fractions.findIndex(([k, d]) => k === num3 && d === 100)
  );
}

// ../../packages/exercise-engine/src/generators/ce2/addition-posee.ts
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
      mistakes: { "forgot-carry": [rational(noCarrySum(a, b))] },
      hint: "Pose l\u2019addition en alignant les unit\xE9s, puis calcule de droite \xE0 gauche sans oublier les retenues.",
      explanation: [
        "On additionne colonne par colonne, en commen\xE7ant par les unit\xE9s.",
        `${formatNumber(a)} + ${formatNumber(b)} = ${formatNumber(a + b)}`
      ]
    };
  }
});

// ../../packages/exercise-engine/src/generators/ce2/comparer-ranger-nombres.ts
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
        direction,
        // Read as words, 1 000 comes before 999: the length of the numbers is overlooked.
        { "digits-not-length": [rankBy(values.map(String), direction)] }
      ),
      hint: "Compare d\u2019abord le nombre de chiffres, puis les chiffres un par un en partant de la gauche."
    };
  }
});

// ../../packages/exercise-engine/src/generators/ce2/doubles-moities.ts
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

// ../../packages/exercise-engine/src/generators/ce2/fractions-unitaires.ts
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
      mistakes: { "one-part-only": [1], "shades-denominator": [den] },
      prompt: `Colorie 1/${den} de la barre.`,
      hint: `Regroupe les parts pour former ${den} morceaux \xE9gaux.`,
      explanation: [
        `${den * group} parts \xF7 ${den} = ${group} : on colorie ${group} part${group > 1 ? "s" : ""}.`
      ]
    };
  }
});

// ../../packages/exercise-engine/src/generators/ce2/longueurs-conversions.ts
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
    const count2 = rng.int(2, difficulty < 3 ? 9 : 25);
    const reverse = difficulty >= 4 && rng.chance(0.5);
    const [value, answer] = reverse ? [count2 * factor, count2] : [count2, count2 * factor];
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

// ../../packages/exercise-engine/src/generators/ce2/multiplication-posee.ts
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
      mistakes: { "forgot-carry": [rational(noCarryProduct(a, b))] },
      hint: "Multiplie d\u2019abord les unit\xE9s, puis les dizaines, sans oublier les retenues.",
      explanation: [
        `On multiplie chaque chiffre de ${formatNumber(a)} par ${b}, en commen\xE7ant par les unit\xE9s.`,
        `${formatNumber(a)} \xD7 ${b} = ${formatNumber(a * b)}`
      ]
    };
  }
});

// ../../packages/exercise-engine/src/generators/ce2/tables-multiplication.ts
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
      mistakes: missing ? { "table-neighbour": [rational(b - 1), rational(b + 1)] } : {
        "table-neighbour": [rational(a * (b - 1)), rational(a * (b + 1))],
        "adds-instead-of-multiplying": [rational(a + b)]
      },
      hint: `Pense \xE0 la table de ${a}.`,
      explanation: [`${a} \xD7 ${b} = ${product}`]
    };
  }
});

// ../../packages/exercise-engine/src/generators/cm1/comparer-decimaux.ts
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
      ...orderFields(values.map(formatDecimal), values, direction, {
        "decimals-as-integers": [rankBy(values.map(formatDecimal).map(afterCommaKey), direction)]
      }),
      hint: "Compare la partie enti\xE8re, puis les dixi\xE8mes, puis les centi\xE8mes. Ajouter des z\xE9ros \xE0 la fin ne change rien."
    };
  }
});

// ../../packages/exercise-engine/src/generators/cm1/division-euclidienne.ts
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
      mistakes: { "quotient-remainder": [rational(asked === "reste" ? quotient : remainder)] },
      hint: `Cherche le plus grand multiple de ${divisor} qui ne d\xE9passe pas ${dividend}.`,
      explanation: [
        `${dividend} = ${divisor} \xD7 ${quotient} + ${remainder}`,
        `Le ${asked} est ${answer}.`
      ]
    };
  }
});

// ../../packages/exercise-engine/src/generators/cm1/fractions-droite-graduee.ts
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
    const [num3 = 1, den = 2] = rng.pick(fractions.filter(([k = 0, d = 1]) => k % d !== 0));
    return {
      type: "number-line",
      min: rational(0),
      max: rational(units),
      step: rational(1, den),
      target: `${num3}/${den}`,
      answer: rational(num3, den),
      mistakes: { "off-by-one-graduation": [rational(num3 - 1, den), rational(num3 + 1, den)] },
      prompt: `Place ${num3}/${den} sur la droite gradu\xE9e.`,
      hint: `L\u2019unit\xE9 est partag\xE9e en ${den} parts \xE9gales : chaque graduation vaut 1/${den}.`,
      explanation: [`${num3}/${den}, c\u2019est ${num3} graduations de 1/${den} apr\xE8s 0.`]
    };
  }
});

// ../../packages/exercise-engine/src/generators/cm1/nombres-decimaux.ts
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
    const shown = parts.filter(([count2]) => count2 > 0);
    const words2 = shown.map(([count2, name]) => plural(count2, name));
    const answer = decimal(units * 100 + tenths * 10 + hundredths, 2);
    return {
      type: "numeric",
      prompt: `\xC9cris ce nombre avec une virgule : ${list2(words2)}.`,
      check: shown.map(([count2, , fn]) => fn ? `${fn}(${count2})` : `${count2}`).join(" + "),
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
      explanation: [`${list2(words2)} : ${formatDecimal(answer)}`]
    };
  }
});

// ../../packages/exercise-engine/src/generators/cm1/perimetre.ts
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

// ../../packages/exercise-engine/src/generators/cm1/proportionnalite.ts
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

// ../../packages/exercise-engine/src/generators/cm2/addition-soustraction-decimaux.ts
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
      mistakes: { "misaligned-commas": [operator === "+" ? misalignedSum(a, b) : void 0] },
      hint: "Pose l\u2019op\xE9ration en alignant les virgules. Tu peux compl\xE9ter avec des z\xE9ros.",
      explanation: [
        "On aligne les virgules, puis on calcule comme avec des entiers.",
        `${formatNumber(a)} ${operator} ${formatNumber(b)} = ${formatNumber(answer)}`
      ]
    };
  }
});

// ../../packages/exercise-engine/src/generators/cm2/aire-rectangle.ts
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

// ../../packages/exercise-engine/src/generators/cm2/expressions-inconnue.ts
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

// ../../packages/exercise-engine/src/generators/cm2/fractions-addition-meme-denominateur.ts
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
      mistakes: { "adds-denominators": [subtract ? void 0 : rational(resultNum, 2 * den)] },
      display: "fraction",
      hint: "Les d\xE9nominateurs sont les m\xEAmes : regarde seulement les num\xE9rateurs.",
      explanation: [
        `${first} ${operator} ${second} = ${resultNum}, donc ${expression} = ${formatFraction(resultNum, den)}.`
      ]
    };
  }
});

// ../../packages/exercise-engine/src/generators/cm2/fractions-decimaux-equivalences.ts
var DENS2 = { 1: [10], 2: [10, 100], 3: [10, 100, 2, 4], 4: [100, 4, 5, 20], 5: [1e3, 4, 5, 25] };
var fractions_decimaux_equivalences_default = defineGenerator({
  skill: "cm2.fractions-decimaux-equivalences",
  generate(rng, difficulty) {
    const fractions = DENS2[difficulty].flatMap((den) => range(1, den - 1).map((num3) => [num3, den]));
    const count2 = difficulty < 3 ? 3 : 4;
    const picked = distinct(
      count2,
      () => rng.pick(fractions),
      ([num3 = 0, den = 1]) => num3 / den
    );
    const left = picked.map(([num3 = 0, den = 1]) => formatFraction(num3, den));
    const values = picked.map(([num3 = 0, den = 1]) => formatDecimal(rational(num3, den)));
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

// ../../packages/exercise-engine/src/generators/cm2/multiples-diviseurs.ts
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

// ../../packages/exercise-engine/src/generators/cm2/pourcentages.ts
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
    const percent2 = rng.pick(PERCENTS[difficulty]);
    const quantity = 100 / gcd2(percent2, 100) * rng.int(1, difficulty < 3 ? 10 : 30);
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

// ../../packages/exercise-engine/src/generators/sixieme/angles-degres.ts
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
      mistakes: {
        "acute-obtuse": [{ aigu: 2, obtus: 0, droit: void 0, plat: void 0 }[nature]]
      },
      hint: "Compare la mesure \xE0 90\xB0 (angle droit) et \xE0 180\xB0 (angle plat).",
      explanation: [`${REASONS[nature](measure)} : l\u2019angle est ${nature}.`]
    };
  }
});

// ../../packages/exercise-engine/src/generators/sixieme/fraction-d-une-quantite.ts
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
    const num3 = difficulty < 3 ? 1 : rng.int(2, den - 1);
    const part = rng.int(2, difficulty < 4 ? 10 : 25);
    const quantity = den * part;
    return {
      type: "numeric",
      prompt: `Combien font ${num3}/${den} de ${formatNumber(quantity)} ?`,
      check: `${num3}/${den} \xD7 ${formatNumber(quantity)}`,
      answer: rational(num3 * part),
      mistakes: { "divides-only": [rational(part)] },
      hint: `Partage d\u2019abord ${formatNumber(quantity)} en ${den} parts \xE9gales.`,
      explanation: [
        `${formatNumber(quantity)} \xF7 ${den} = ${formatNumber(part)}`,
        `${formatNumber(part)} \xD7 ${num3} = ${formatNumber(num3 * part)}`
      ]
    };
  }
});

// ../../packages/exercise-engine/src/generators/sixieme/nombres-premiers.ts
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

// ../../packages/exercise-engine/src/generators/sixieme/priorites-operatoires.ts
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
      mistakes: { "left-to-right": [leftToRight(expression)] },
      hint: "Les parenth\xE8ses d\u2019abord, puis les multiplications et les divisions, puis les additions et les soustractions.",
      explanation: [`On commence par ${first}.`, `${expression} = ${formatNumber(value)}`]
    };
  }
});

// ../../packages/exercise-engine/src/generators/sixieme/probabilites.ts
var COLORS = ["rouges", "bleues", "vertes", "jaunes"];
var probabilites_default = defineGenerator({
  skill: "6e.probabilites",
  generate(rng, difficulty) {
    const colors = rng.sample(COLORS, difficulty < 3 ? 2 : 3);
    const counts = colors.map(() => rng.int(2, difficulty < 4 ? 6 : 12));
    const target = rng.int(0, colors.length - 1);
    const total = counts.reduce((sum, count2) => sum + count2, 0);
    const favourable = counts[target] ?? 0;
    const content = colors.map((color, index) => `${counts[index]} boules ${color}`);
    return {
      type: "numeric",
      prompt: `Un sac contient ${list2(content)}. On tire une boule au hasard. Quelle est la probabilit\xE9 qu\u2019elle soit ${colors[target]?.slice(0, -1)} ?`,
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

// ../../packages/exercise-engine/src/generators/sixieme/proportionnalite.ts
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
      mistakes: { "additive-reasoning": [add(y1, rational(second - first))] },
      hint: "Cherche par combien il faut multiplier la premi\xE8re ligne pour obtenir la seconde.",
      explanation: [
        `${formatNumber(y1)} \xF7 ${first} = ${formatNumber(coefficient)}`,
        `${second} \xD7 ${formatNumber(coefficient)} = ${formatNumber(answer)}`
      ]
    };
  }
});

// ../../packages/exercise-engine/src/generators/cinquieme/fractions-addition.ts
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
      mistakes: {
        "adds-denominators": [minus ? void 0 : rational(a + b, den + big)],
        "same-denominator": [rational(minus ? a - b : a + b, big)]
      },
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

// ../../packages/exercise-engine/src/generators/cinquieme/puissances-de-10.ts
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
      mistakes: {
        "zeros-count": [mul(factor, rational(10 ** (exponent - 1))), mul(factor, rational(10 ** (exponent + 1)))],
        "exponent-times-ten": [difficulty === 1 ? rational(10 * exponent) : void 0]
      },
      hint: `${power(10, exponent)}, c\u2019est 1 suivi de ${exponent} z\xE9ros.`,
      explanation: [
        `${power(10, exponent)} = ${formatNumber(10 ** exponent)}`,
        ...difficulty > 1 ? [`${shown} = ${formatNumber(answer)}`] : []
      ]
    };
  }
});

// ../../packages/exercise-engine/src/generators/cinquieme/relatifs-addition-soustraction.ts
var relatifs_addition_soustraction_default = defineGenerator({
  skill: "5e.relatifs-addition-soustraction",
  generate(rng, difficulty) {
    const max = [10, 10, 30, 50, 99][difficulty - 1] ?? 10;
    const draw = () => rng.pick([-1, 1]) * rng.int(1, max);
    const terms = difficulty >= 4 ? [draw(), draw(), draw()] : [draw(), draw()];
    const operators = terms.slice(1).map(() => difficulty >= 2 && rng.chance(0.5) ? "\u2212" : "+");
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

// ../../packages/exercise-engine/src/generators/cinquieme/tester-egalite.ts
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

// ../../packages/exercise-engine/src/generators/index.ts
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

// ../../packages/exercise-engine/src/exercise.ts
var DIFFICULTIES = [1, 2, 3, 4, 5];

// ../../packages/exercise-engine/src/coach/numbers.ts
var SUPERSCRIPTS = "\u2070\xB9\xB2\xB3\u2074\u2075\u2076\u2077\u2078\u2079";
var NUMBER = new RegExp(
  `${MINUS}?(?:(\\d+)/(\\d+)|\\d{1,3}(?:[\\u202f\\u00a0]\\d{3})+(?:,\\d+)?|\\d+(?:,\\d+)?)|[${SUPERSCRIPTS}]+`,
  "g"
);

// ../../packages/exercise-engine/src/coach/frame.ts
var TRUE = "vrai";
var FALSE = "faux";
var shade = (count2, parts) => `${count2} part${count2 > 1 ? "s" : ""} sur ${parts}`;
function answerText(exercise) {
  switch (exercise.type) {
    case "numeric":
      return [formatAnswer(exercise), exercise.unit].filter(Boolean).join(" ");
    case "choice":
      return exercise.options[exercise.answer]?.label ?? "";
    case "true-false":
      return exercise.answer ? TRUE : FALSE;
    case "number-line":
      return exercise.target;
    case "order":
      return ordered(exercise.items, exercise.answer, exercise.direction);
    case "match":
      return paired(exercise.left, exercise.right, exercise.answer);
    case "fraction-shade":
      return shade(exercise.answer, exercise.parts);
  }
}
function givenText(exercise, response) {
  switch (response.type) {
    case "numeric":
      return [response.text, exercise.type === "numeric" ? exercise.unit : void 0].filter(Boolean).join(" ");
    case "choice":
      return exercise.type === "choice" ? exercise.options[response.index]?.label ?? "" : "";
    case "true-false":
      return response.value ? TRUE : FALSE;
    case "number-line":
      return exercise.type === "number-line" && exercise.target.includes("/") ? formatFraction(response.value.num, response.value.den) : formatNumber(response.value);
    case "order":
      return exercise.type === "order" ? ordered(exercise.items, response.order, exercise.direction) : "";
    case "match":
      return exercise.type === "match" ? paired(exercise.left, exercise.right, response.pairs) : "";
    case "fraction-shade":
      return exercise.type === "fraction-shade" ? shade(response.shaded, exercise.parts) : "";
  }
}
var ordered = (items, order, direction) => order.map((index) => items[index] ?? "").join(direction === "ascending" ? " < " : " > ");
var paired = (left, right, pairs) => left.map((label, index) => `${label} \u2192 ${right[pairs[index] ?? 0] ?? ""}`).join(" ; ");

// ../../packages/exercise-engine/src/coach/template.ts
var NUMBER_WORDS = new RegExp(
  `(?<!\\p{L})(${[
    "deux",
    "trois",
    "quatre",
    "cinq",
    "six",
    "sept",
    "huit",
    "neuf",
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "vingts?",
    "trente",
    "quarante",
    "cinquante",
    "soixante",
    "cents?",
    "milles?",
    "millions?",
    "milliards?"
  ].join("|")})(?!\\p{L})`,
  "iu"
);

// ../../packages/exercise-engine/src/adaptive/planner.ts
function buildExercise(step, generators2 = generators) {
  const generator = generators2.find((candidate) => generatorId(candidate) === step.generatorId);
  if (!generator) throw new Error(`Unknown generator ${step.generatorId}`);
  return generateExercise(generator, step.difficulty, step.seed);
}

// ../../packages/exercise-engine/src/regrade.ts
var isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var isNumberList = (value) => Array.isArray(value) && value.every((item) => typeof item === "number");
var SKIPPED_ANSWER = { type: "skipped" };
var isSkippedAnswer = (value) => isObject(value) && value.type === SKIPPED_ANSWER.type;
function parseStoredResponse(value) {
  if (!isObject(value)) return null;
  const { type } = value;
  if (type === "numeric" && typeof value.text === "string") return { type, text: value.text };
  if (type === "choice" && typeof value.index === "number") return { type, index: value.index };
  if (type === "true-false" && typeof value.value === "boolean") {
    return { type, value: value.value };
  }
  if (type === "number-line" && isObject(value.value)) {
    const { num: num3, den } = value.value;
    if (typeof num3 === "number" && typeof den === "number" && den !== 0) {
      return { type, value: rational(num3, den) };
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

// ../ai-gateway/src/checks.ts
var normalize = (text4) => text4.toLocaleLowerCase("fr").normalize("NFD").replace(/\p{M}/gu, "");
function bannedWordsIn(text4, banned) {
  const words2 = new Set(normalize(text4).split(/[^\p{L}\p{N}'’-]+/u));
  const plain = normalize(text4);
  return banned.filter((word) => {
    const term = normalize(word.trim());
    if (!term) return false;
    return term.includes(" ") ? plain.includes(term) : words2.has(term);
  });
}

// ../ai-gateway/src/prompt.ts
var DEFAULT_PROMPT = {
  version: 1,
  system: [
    "Tu es le coach bienveillant d\u2019une app de maths pour enfants. Tu expliques une erreur en tutoyant l\u2019enfant, sans jugement, sans moquerie, sans comparaison avec d\u2019autres enfants.",
    "Le code a d\xE9j\xE0 calcul\xE9 la bonne r\xE9ponse et la correction : tu ne calcules rien, tu reformules.",
    "Tu n\u2019\xE9cris jamais de nombre, ni en chiffres ni en lettres : chaque nombre s\u2019\xE9crit avec son rep\xE8re entre accolades, exactement comme donn\xE9 ({n1}, {e2}, {reponse}, {solution}\u2026).",
    "Tu peux \xE9voquer l\u2019univers de l\u2019enfant (jeu, sport, musique, cr\xE9ateur) mais tu ne fais jamais parler une personne r\xE9elle et tu ne te fais pas passer pour elle. Tu cites un jeu par son nom seulement.",
    'R\xE9ponds uniquement en JSON : {"what": "ce qui s\u2019est pass\xE9", "image": "l\u2019image qui fait comprendre, tir\xE9e de l\u2019univers", "tip": "l\u2019astuce \xE0 retenir, une phrase courte"}. Moins de 60 mots en tout.'
  ].join("\n"),
  user: [
    "Classe : {{classe}}. Ton : {{ton}}.",
    "Comp\xE9tence : {{competence}}.",
    "Exercice : {{exercice}}",
    "Correction : {{correction}}",
    "R\xE9ponse de l\u2019enfant : {reponse}. Bonne r\xE9ponse : {solution}.",
    "Erreur rep\xE9r\xE9e : {{erreur}}.",
    "Valeurs des rep\xE8res, pour comprendre (ne les \xE9cris jamais) : {{valeurs}}.",
    "Univers \xE0 utiliser : {{univers}}."
  ].join("\n")
};

// ../ai-gateway/src/providers.ts
var MISTRAL_URL = "https://api.mistral.ai";
var ProviderError = class extends Error {
  constructor(message2, latencyMs) {
    super(message2);
    this.latencyMs = latencyMs;
  }
  latencyMs;
};
var headers = (provider) => ({
  "Content-Type": "application/json",
  ...provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}
});
var endpoint = (provider, path) => `${provider.baseUrl.replace(/\/+$/, "").replace(/\/v1$/, "")}/v1/${path}`;
async function chat(provider, request, fetcher = fetch, now = Date.now) {
  const started = now();
  let response;
  try {
    response = await fetcher(endpoint(provider, "chat/completions"), {
      method: "POST",
      headers: headers(provider),
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: "system", content: request.system },
          { role: "user", content: request.user }
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        response_format: { type: "json_object" }
      }),
      signal: AbortSignal.timeout(request.timeoutMs)
    });
  } catch (error) {
    throw new ProviderError(
      error instanceof Error ? error.message : "unreachable",
      now() - started
    );
  }
  const latencyMs = now() - started;
  if (!response.ok) throw new ProviderError(`HTTP ${response.status}`, latencyMs);
  const body = await response.json();
  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new ProviderError("empty answer", latencyMs);
  return {
    text: content,
    tokensIn: body.usage?.prompt_tokens ?? 0,
    tokensOut: body.usage?.completion_tokens ?? 0,
    latencyMs
  };
}
async function moderate(provider, text4, fetcher = fetch, timeoutMs = 5e3) {
  const response = await fetcher(endpoint(provider, "moderations"), {
    method: "POST",
    headers: headers(provider),
    body: JSON.stringify({ model: "mistral-moderation-latest", input: [text4] }),
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new ProviderError(`moderation HTTP ${response.status}`, 0);
  const body = await response.json();
  const categories = body.results?.[0]?.categories ?? {};
  return Object.entries(categories).filter(([, flagged]) => flagged).map(([category]) => category);
}
var callCost = (provider, tokensIn, tokensOut) => (tokensIn * provider.price.input + tokensOut * provider.price.output) / 1e6;

// ../ai-gateway/src/context.ts
var isRow2 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var num2 = (value, fallback = 0) => {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback;
};
var text2 = (value) => typeof value === "string" ? value : "";
function providerOf(value, secrets) {
  if (!isRow2(value)) return null;
  const model = text2(value.model).trim();
  if (!model) return null;
  const price = { input: num2(value.price_input), output: num2(value.price_output) };
  if (value.kind === "mistral") {
    if (!secrets.mistralKey) return null;
    const baseUrl = text2(value.base_url) || MISTRAL_URL;
    return { kind: "mistral", baseUrl, model, apiKey: secrets.mistralKey, price };
  }
  if (value.kind === "openai-compatible") {
    const baseUrl = text2(value.base_url).trim();
    if (!/^https?:\/\//.test(baseUrl)) return null;
    return {
      kind: "openai-compatible",
      baseUrl,
      model,
      apiKey: secrets.ownKey || void 0,
      price
    };
  }
  return null;
}
function promptOf(value) {
  if (!isRow2(value)) return DEFAULT_PROMPT;
  const system = text2(value.system);
  const user = text2(value.user);
  return system && user ? { version: num2(value.version, 1), system, user } : DEFAULT_PROMPT;
}
function readSettings(value, secrets) {
  const context = isRow2(value) ? value : {};
  const settings = isRow2(context.settings) ? context.settings : {};
  const spent = isRow2(context.spent) ? context.spent : {};
  return {
    enabled: settings.enabled === true,
    realtime: providerOf(settings.realtime_provider, secrets),
    night: providerOf(settings.night_provider, secrets),
    moderation: settings.moderation === true && secrets.mistralKey ? {
      kind: "mistral",
      baseUrl: MISTRAL_URL,
      model: "mistral-moderation-latest",
      apiKey: secrets.mistralKey,
      price: { input: 0, output: 0 }
    } : null,
    dailyCapUsd: num2(settings.daily_cap_usd),
    monthlyCapUsd: num2(settings.monthly_cap_usd),
    spentTodayUsd: num2(spent.today),
    spentMonthUsd: num2(spent.month),
    banned: (Array.isArray(context.banned) ? context.banned : []).filter(
      (word) => typeof word === "string"
    ),
    prompt: promptOf(context.prompt)
  };
}
var usageRow = (usage, childId) => ({
  task: usage.task,
  provider: usage.provider,
  model: usage.model,
  tokens_in: usage.tokensIn,
  tokens_out: usage.tokensOut,
  cost_usd: usage.costUsd,
  latency_ms: Math.round(usage.latencyMs),
  outcome: usage.outcome,
  problems: usage.problems,
  child_id: childId,
  skill_code: usage.key?.skill ?? null,
  error_type: usage.key?.error ?? null,
  universe_id: usage.key?.universe ?? null,
  grade_band: usage.key?.band ?? null,
  prompt_version: usage.promptVersion
});

// ../ai-gateway/src/advice.ts
var ADVICE_TIPS = 3;
var MAX_TIP_WORDS = 35;
var MIN_TIP_WORDS = 4;
var TIMEOUT_MS = 2e4;
var MAX_TOKENS = 350;
var DEFAULT_ADVICE_PROMPT = {
  version: 1,
  system: [
    "Tu es le coach d\u2019une app de maths pour enfants. Tu \xE9cris au parent trois conseils concrets pour le mois qui vient, \xE0 partir du bilan que l\u2019app a calcul\xE9 et du profil d\u2019apprentissage de son enfant.",
    "Le code a d\xE9j\xE0 tout calcul\xE9 : tu ne calcules rien et tu n\u2019\xE9cris aucun chiffre.",
    "Tu vouvoies le parent et tu parles de \xAB votre enfant \xBB, jamais d\u2019un pr\xE9nom. Ton bienveillant, sans culpabiliser : pas de reproche, pas de comparaison avec d\u2019autres enfants, pas de diagnostic.",
    "Chaque conseil est une action simple, \xE0 faire \xE0 la maison ou avec l\u2019app, en une phrase de moins de trente mots.",
    'R\xE9ponds uniquement en JSON : {"tips": ["premier conseil", "deuxi\xE8me conseil", "troisi\xE8me conseil"]}.'
  ].join("\n"),
  user: [
    "Classe : {{classe}}.",
    "Bilan du mois : {{bilan}}",
    "Profil d\u2019apprentissage : {{profil}}"
  ].join("\n")
};
function buildAdvicePrompt(template, input) {
  const fields = {
    classe: input.grade,
    bilan: input.facts.map((fact) => `- ${fact}`).join("\n") || "(rien de notable)",
    profil: input.summary?.trim() || "(pas de profil)"
  };
  const fill = (text4) => text4.replace(/\{\{(\w+)\}\}/g, (all, name) => fields[name] ?? all);
  return { system: fill(template.system), user: fill(template.user) };
}
function parseAdvice(text4) {
  const start = text4.indexOf("{");
  const end = text4.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let value;
  try {
    value = JSON.parse(text4.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const { tips } = value;
  if (!Array.isArray(tips) || !tips.every((tip) => typeof tip === "string")) return null;
  return tips.map((tip) => tip.trim().replace(/\s+/g, " "));
}
var words = (text4) => text4.split(/\s+/).filter(Boolean).length;
function adviceProblems(tips, banned) {
  if (!tips) return ["unreadable"];
  const problems = /* @__PURE__ */ new Set();
  if (tips.length !== ADVICE_TIPS) problems.add("count");
  for (const tip of tips) {
    const count2 = words(tip);
    if (count2 < MIN_TIP_WORDS || count2 > MAX_TIP_WORDS) problems.add("length");
    if (/\d/.test(tip)) problems.add("digits");
    if (bannedWordsIn(tip, banned).length > 0) problems.add("banned-word");
  }
  return [...problems];
}
var withinBudget = (settings, provider) => provider.price.input === 0 && provider.price.output === 0 || settings.spentTodayUsd < settings.dailyCapUsd && settings.spentMonthUsd < settings.monthlyCapUsd;
async function advise(input, settings, store, fetcher = fetch) {
  if (!settings.enabled) return { ok: false, reason: "off" };
  const provider = settings.realtime ?? settings.night;
  if (!provider) return { ok: false, reason: "no-provider" };
  if (!withinBudget(settings, provider)) return { ok: false, reason: "budget" };
  const usage = (fields) => ({
    task: "advice",
    provider: provider.kind,
    model: provider.model,
    tokensIn: 0,
    tokensOut: 0,
    costUsd: 0,
    latencyMs: 0,
    outcome: "ok",
    problems: [],
    key: null,
    promptVersion: settings.prompt.version,
    ...fields
  });
  let result;
  try {
    result = await chat(
      provider,
      {
        ...buildAdvicePrompt(settings.prompt, input),
        maxTokens: MAX_TOKENS,
        temperature: 0.6,
        timeoutMs: TIMEOUT_MS
      },
      fetcher
    );
  } catch (failure) {
    await store.logUsage(
      usage({
        outcome: "error",
        latencyMs: failure instanceof ProviderError ? failure.latencyMs : 0,
        problems: [failure instanceof Error ? failure.message : "error"]
      })
    );
    return { ok: false, reason: "failed" };
  }
  const spent = {
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
    costUsd: callCost(provider, result.tokensIn, result.tokensOut),
    latencyMs: result.latencyMs
  };
  const tips = parseAdvice(result.text);
  let problems = adviceProblems(tips, settings.banned);
  if (problems.length === 0 && tips && settings.moderation) {
    try {
      const flagged = await moderate(settings.moderation, tips.join("\n"), fetcher);
      if (flagged.length > 0) problems = ["moderation"];
    } catch {
      problems = ["moderation"];
    }
  }
  const outcome = problems.length === 0 ? "ok" : tips ? "rejected" : "unreadable";
  await store.logUsage(usage({ ...spent, outcome, problems }));
  return outcome === "ok" && tips ? { ok: true, tips } : { ok: false, reason: "rejected" };
}
function readAdviceContext(value, secrets) {
  if (typeof value !== "object" || value === null) return null;
  const context = value;
  const grade = GRADES.find((item) => item === context.grade);
  if (!grade) return null;
  const settings = readSettings(context, secrets);
  const prompt = typeof context.prompt === "object" && context.prompt !== null ? context.prompt : {};
  const system = typeof prompt.system === "string" ? prompt.system : "";
  const user = typeof prompt.user === "string" ? prompt.user : "";
  return {
    grade,
    settings: {
      ...settings,
      prompt: system && user ? { version: typeof prompt.version === "number" ? prompt.version : 1, system, user } : DEFAULT_ADVICE_PROMPT
    }
  };
}

// src/examples.ts
function shownMistake(point) {
  const example = point.example;
  if (!example || isSkippedAnswer(example.answer)) return null;
  const exercise = rebuildExercise({
    generator_id: example.generatorId,
    difficulty: example.difficulty,
    seed: example.seed
  });
  const response = parseStoredResponse(example.answer);
  if (!exercise || !response) return null;
  return {
    prompt: exercise.prompt,
    given: givenText(exercise, response),
    expected: answerText(exercise),
    mistake: example.errorLabel ?? point.errorLabel
  };
}

// src/email.ts
var COLORS2 = {
  night: "#120B2E",
  pink: "#FF3EA5",
  cyan: "#2EE6FF",
  lavender: "#C3B8F0",
  ink: "#1B1530",
  muted: "#5E5874",
  line: "#E6E2F0",
  card: "#F7F5FC",
  page: "#EFEDF5",
  white: "#FFFFFF"
};
var VERDICT_COLORS = {
  good: "#1E9E63",
  watch: "#D9760B",
  alert: "#D63B3B",
  none: "#8A84A0"
};
var DAY_COLORS = {
  done: "#1E9E63",
  started: "#F08A24",
  missed: "#D63B3B",
  off: "#C9C4D8",
  vacation: "#C9C4D8",
  pending: "#FFFFFF",
  none: "#EFEDF5"
};
var escape = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
var FONT = "font-family:Helvetica,Arial,sans-serif;";
function shell(title, heading, subheading, preheader, body, footer2) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS2.page};${FONT}color:${COLORS2.ink};">
<div style="display:none;max-height:0;overflow:hidden;">${escape(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS2.page};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${COLORS2.white};border-radius:16px;overflow:hidden;">
<tr><td style="background:${COLORS2.night};padding:20px 24px;">
<div style="${FONT}color:${COLORS2.pink};font-size:12px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;">Math Genius</div>
<div style="${FONT}color:${COLORS2.white};font-size:22px;font-weight:bold;margin-top:6px;">${escape(heading)}</div>
<div style="${FONT}color:${COLORS2.lavender};font-size:14px;margin-top:2px;">${escape(subheading)}</div>
</td></tr>
<tr><td style="padding:24px;${FONT}font-size:15px;line-height:1.5;">
${body}
</td></tr>
<tr><td style="padding:16px 24px;background:${COLORS2.card};${FONT}font-size:12px;line-height:1.5;color:${COLORS2.muted};">
${footer2}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
var h1 = (text4) => `<h1 style="${FONT}font-size:20px;line-height:1.3;margin:0 0 16px;color:${COLORS2.ink};">${escape(text4)}</h1>`;
var h2 = (text4) => `<h2 style="${FONT}font-size:16px;line-height:1.3;margin:24px 0 8px;color:${COLORS2.ink};">${escape(text4)}</h2>`;
var p = (text4, muted = false) => `<p style="${FONT}margin:0 0 8px;color:${muted ? COLORS2.muted : COLORS2.ink};">${escape(text4)}</p>`;
function verdictBox(texts, verdict, sentence) {
  const color = VERDICT_COLORS[verdict.level];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td style="border-left:6px solid ${color};background:${COLORS2.card};padding:12px 16px;border-radius:8px;">
<div style="${FONT}font-weight:bold;color:${color};font-size:14px;">&#9679; ${escape(texts.verdict.title[verdict.level])}</div>
<div style="${FONT}margin-top:4px;color:${COLORS2.ink};">${escape(sentence)}</div>
</td></tr></table>`;
}
function tiles(items) {
  const cells = items.map(
    (item) => `<td valign="top" style="padding:4px;width:${Math.floor(100 / items.length)}%;">
<div style="background:${COLORS2.card};border-radius:10px;padding:10px 8px;text-align:center;">
<div style="${FONT}font-size:11px;color:${COLORS2.muted};text-transform:uppercase;letter-spacing:1px;">${escape(item.label)}</div>
<div style="${FONT}font-size:20px;font-weight:bold;color:${COLORS2.ink};margin-top:2px;">${escape(item.value)}</div>
${item.detail ? `<div style="${FONT}font-size:12px;color:${COLORS2.muted};">${escape(item.detail)}</div>` : ""}
</div></td>`
  );
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;"><tr>${cells.join("")}</tr></table>`;
}
function dot(status, label, size = 28) {
  const border = status === "pending" || status === "none" ? `border:1px solid ${COLORS2.line};` : "";
  return `<div style="width:${size}px;height:${size}px;line-height:${size}px;border-radius:${size / 2}px;background:${DAY_COLORS[status]};${border}margin:0 auto;text-align:center;${FONT}font-size:11px;color:${status === "done" || status === "missed" || status === "started" ? COLORS2.white : COLORS2.muted};">${escape(label)}</div>`;
}
function legend(texts) {
  const items = [
    ["done", texts.legend.done],
    ["started", texts.legend.started],
    ["missed", texts.legend.missed],
    ["off", texts.legend.off]
  ];
  return `<div style="${FONT}font-size:12px;color:${COLORS2.muted};margin-top:8px;">${items.map(
    ([status, label]) => `<span style="display:inline-block;margin-right:12px;"><span style="display:inline-block;width:10px;height:10px;border-radius:5px;background:${DAY_COLORS[status]};vertical-align:middle;"></span> ${escape(label)}</span>`
  ).join("")}</div>`;
}
function weekRow(texts, days) {
  const cells = days.map(
    (day, index) => `<td align="center" style="padding:2px;">
<div style="${FONT}font-size:11px;color:${COLORS2.muted};margin-bottom:4px;">${escape(texts.weekly.week[index] ?? "")}</div>
${dot(day.status, String(dayOf(day.date).day))}</td>`
  );
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;"><tr>${cells.join("")}</tr></table>`;
}
function monthGrid(texts, days) {
  const first = days[0];
  if (!first) return "";
  const blanks = isoWeekday(first.date) - 1;
  const cells = [
    ...Array.from({ length: blanks }, () => "<td></td>"),
    ...days.map(
      (day) => `<td align="center" style="padding:2px;">${dot(day.status, String(dayOf(day.date).day), 26)}</td>`
    )
  ];
  const rows = [];
  for (let start = 0; start < cells.length; start += 7) {
    const row = cells.slice(start, start + 7);
    while (row.length < 7) row.push("<td></td>");
    rows.push(`<tr>${row.join("")}</tr>`);
  }
  const header = texts.weekly.week.map(
    (letter) => `<td align="center" style="${FONT}font-size:11px;color:${COLORS2.muted};padding-bottom:2px;">${letter}</td>`
  ).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0;"><tr>${header}</tr>${rows.join("")}</table>`;
}
function bar(label, start, end) {
  const value = Math.max(0, Math.min(100, end));
  const before = Math.max(0, Math.min(value, start));
  return `<div style="${FONT}font-size:13px;margin:10px 0 4px;color:${COLORS2.ink};">${escape(label)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:6px;overflow:hidden;background:${COLORS2.line};"><tr>
${before > 0 ? `<td style="width:${before}%;height:10px;background:${COLORS2.lavender};"></td>` : ""}
${value - before > 0 ? `<td style="width:${value - before}%;height:10px;background:${COLORS2.pink};"></td>` : ""}
<td style="height:10px;"></td>
</tr></table>`;
}
function mistakeBlock(texts, point, detail) {
  const shown = shownMistake(point);
  const rows = shown ? [
    [texts.example.prompt, shown.prompt],
    [texts.example.given, shown.given],
    [texts.example.expected, shown.expected]
  ] : [];
  return `<div style="background:${COLORS2.card};border-radius:10px;padding:12px 16px;margin:8px 0;">
<div style="${FONT}font-weight:bold;color:${COLORS2.ink};">${escape(point.title)}</div>
<div style="${FONT}font-size:13px;color:${COLORS2.muted};">${escape(detail)}</div>
${point.errorLabel ? `<div style="${FONT}font-size:14px;margin-top:6px;">${escape(texts.example.mistake)} : ${escape(point.errorLabel)}</div>` : ""}
${rows.map(
    ([label, value]) => `<div style="${FONT}font-size:14px;margin-top:4px;"><span style="color:${COLORS2.muted};">${escape(label ?? "")} :</span> ${escape(value ?? "").replace(/\n/g, "<br>")}</div>`
  ).join("")}
</div>`;
}
var list3 = (items) => `<ul style="${FONT}margin:0 0 8px;padding-left:20px;">${items.map((item) => `<li style="margin:2px 0;">${escape(item)}</li>`).join("")}</ul>`;
function cta(texts, links) {
  return links.app ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;"><tr><td style="background:${COLORS2.pink};border-radius:24px;">
<a href="${escape(links.app)}" style="display:inline-block;padding:12px 24px;${FONT}font-weight:bold;color:${COLORS2.night};text-decoration:none;">${escape(texts.cta)}</a>
</td></tr></table>` : `<p style="${FONT}margin:24px 0 0;color:${COLORS2.muted};">${escape(texts.openApp)}</p>`;
}
function footer(texts, kind, links) {
  const link = (href, label) => `<a href="${escape(href)}" style="color:${COLORS2.muted};text-decoration:underline;">${escape(label)}</a>`;
  return `${escape(texts.footer.why(kind))}<br>
${link(links.unsubscribe, texts.footer.unsubscribe(kind))} \xB7 ${link(links.unsubscribeAll, texts.footer.unsubscribeAll)}<br>
${escape(texts.footer.settings)}`;
}
var footerText = (texts, kind, links) => [
  texts.footer.why(kind),
  `${texts.footer.unsubscribe(kind)} : ${links.unsubscribe}`,
  `${texts.footer.unsubscribeAll} : ${links.unsubscribeAll}`,
  texts.footer.settings
].join("\n");
function statTiles(texts, recap) {
  const s = texts.stats;
  const daysTile = recap.planned > 0 ? {
    label: recap.kind === "weekly" ? s.sessions : s.days,
    value: `${recap.done}`,
    detail: recap.kind === "weekly" ? s.planned(recap.planned) : s.plannedDays(recap.planned)
  } : {
    label: recap.kind === "weekly" ? s.sessions : s.days,
    value: `${recap.active}`,
    detail: s.played
  };
  return [
    daysTile,
    { label: s.streak, value: s.streakValue(recap.streak) },
    { label: s.time, value: texts.duration(recap.minutes) },
    {
      label: s.success,
      value: recap.verdict.success === null ? s.none : texts.percent(recap.verdict.success)
    }
  ];
}
function weeklyEmail(recap, texts, links) {
  const t = texts.weekly;
  const name = recap.child.name;
  const sentence = texts.verdict.sentence(name, recap.verdict, "week");
  const [learnt, ...others] = recap.learned;
  const toWork = recap.toWork;
  const toWorkDetail = toWork && "errors" in toWork ? texts.monthly.errors(toWork.errors, toWork.answered) : toWork ? t.mastery(toWork.mastery) : "";
  const tilesData = statTiles(texts, recap);
  const body = [
    h1(t.title(name)),
    verdictBox(texts, recap.verdict, sentence),
    weekRow(texts, recap.days),
    legend(texts),
    tiles(tilesData),
    h2(t.learned),
    learnt ? p(others.length > 0 ? `${learnt.title} (${t.learnedMore(others.length)})` : learnt.title) : p(t.learnedNone, true),
    h2(t.toWork),
    toWork ? "errors" in toWork ? mistakeBlock(texts, toWork, toWorkDetail) : `<div style="background:${COLORS2.card};border-radius:10px;padding:12px 16px;"><div style="${FONT}font-weight:bold;">${escape(toWork.title)}</div><div style="${FONT}font-size:13px;color:${COLORS2.muted};">${escape(toWorkDetail)}</div></div>` : p(t.toWorkNone, true),
    cta(texts, links)
  ].join("\n");
  const subject = t.subject(name, recap.from, recap.to);
  const text4 = [
    `${t.title(name)} \u2014 ${t.period(recap.from, recap.to)}`,
    "",
    `${texts.verdict.title[recap.verdict.level]}. ${sentence}`,
    "",
    ...tilesData.map(
      (tile) => `${tile.label} : ${tile.value}${tile.detail ? ` ${tile.detail}` : ""}`
    ),
    "",
    `${t.learned} : ${learnt ? learnt.title : t.learnedNone}`,
    `${t.toWork} : ${toWork ? `${toWork.title} (${toWorkDetail})` : t.toWorkNone}`,
    "",
    links.app ? `${texts.cta} : ${links.app}` : texts.openApp,
    "",
    footerText(texts, "weekly", links)
  ].join("\n");
  return {
    subject,
    html: shell(
      subject,
      t.heading,
      t.period(recap.from, recap.to),
      sentence,
      body,
      footer(texts, "weekly", links)
    ),
    text: text4
  };
}
function monthlyEmail(recap, advice, texts, links) {
  const t = texts.monthly;
  const name = recap.child.name;
  const sentence = texts.verdict.sentence(name, recap.verdict, "month");
  const tilesData = [
    ...statTiles(texts, recap),
    { label: texts.stats.xp, value: `+${texts.integer(recap.xp)}` }
  ];
  const off = t.offDays(recap.offDays, recap.vacationDays);
  const programme = recap.programme ? texts.programme(name, recap.programme) : null;
  const body = [
    h1(t.title(name)),
    verdictBox(texts, recap.verdict, sentence),
    tiles(tilesData.slice(0, 3)),
    tiles(tilesData.slice(3)),
    h2(t.regularity),
    monthGrid(texts, recap.days),
    legend(texts),
    recap.doneDates.length > 0 ? p(t.doneDates(recap.doneDates)) : "",
    p(recap.skippedDates.length > 0 ? t.skippedDates(recap.skippedDates) : t.noSkipped),
    off ? p(off, true) : "",
    ...recap.domains.length > 0 ? [
      h2(t.mastery),
      ...recap.domains.map((d) => bar(t.masteryLine(d.domain, d.start, d.end), d.start, d.end)),
      p(t.masteryNote, true)
    ] : [],
    h2(t.learned),
    recap.learned.length > 0 ? list3(recap.learned.map((skill) => skill.title)) : p(t.learnedNone, true),
    h2(t.badges),
    recap.badges.length > 0 ? list3(recap.badges.map(texts.badge)) : p(t.badgesNone, true),
    h2(t.rewards),
    recap.rewards.length > 0 ? list3(recap.rewards) : p(t.rewardsNone, true),
    h2(t.blocking),
    recap.blocking.length > 0 ? recap.blocking.map((point) => mistakeBlock(texts, point, t.errors(point.errors, point.answered))).join("\n") : p(t.blockingNone, true),
    ...programme ? [h2(t.programme), p(programme), p(texts.programmeNote, true)] : [],
    h2(t.advice(recap.from)),
    `<ol style="${FONT}margin:0 0 8px;padding-left:20px;">${advice.tips.map((tip) => `<li style="margin:4px 0;">${escape(tip)}</li>`).join("")}</ol>`,
    p(t.adviceSource[advice.source], true),
    p(t.pdf(recap.from), true),
    cta(texts, links)
  ].join("\n");
  const subject = t.subject(name, recap.from);
  const text4 = [
    `${t.title(name)} \u2014 ${t.month(recap.from)}`,
    "",
    `${texts.verdict.title[recap.verdict.level]}. ${sentence}`,
    "",
    ...tilesData.map(
      (tile) => `${tile.label} : ${tile.value}${tile.detail ? ` ${tile.detail}` : ""}`
    ),
    "",
    t.regularity,
    recap.doneDates.length > 0 ? t.doneDates(recap.doneDates) : "",
    recap.skippedDates.length > 0 ? t.skippedDates(recap.skippedDates) : t.noSkipped,
    off ?? "",
    "",
    ...recap.domains.length > 0 ? [t.mastery, ...recap.domains.map((d) => `- ${t.masteryLine(d.domain, d.start, d.end)}`), ""] : [],
    `${t.learned} : ${recap.learned.length > 0 ? recap.learned.map((skill) => skill.title).join(" ; ") : t.learnedNone}`,
    `${t.badges} : ${recap.badges.length > 0 ? recap.badges.map(texts.badge).join(", ") : t.badgesNone}`,
    `${t.rewards} : ${recap.rewards.length > 0 ? recap.rewards.join(", ") : t.rewardsNone}`,
    "",
    t.blocking,
    ...recap.blocking.length > 0 ? recap.blocking.map(
      (point) => `- ${point.title} : ${t.errors(point.errors, point.answered)}${point.errorLabel ? ` (${point.errorLabel})` : ""}`
    ) : [t.blockingNone],
    "",
    ...programme ? [t.programme, programme, ""] : [],
    t.advice(recap.from),
    ...advice.tips.map((tip, index) => `${index + 1}. ${tip}`),
    "",
    links.app ? `${texts.cta} : ${links.app}` : texts.openApp,
    "",
    footerText(texts, "monthly", links)
  ].filter((line, index, lines) => line !== "" || lines[index - 1] !== "").join("\n");
  return {
    subject,
    html: shell(
      subject,
      t.heading(recap.from),
      t.month(recap.from),
      sentence,
      body,
      footer(texts, "monthly", links)
    ),
    text: text4
  };
}

// src/pdf/metrics.ts
var HELVETICA = [
  278,
  278,
  355,
  556,
  556,
  889,
  667,
  191,
  333,
  333,
  389,
  584,
  278,
  333,
  278,
  278,
  556,
  556,
  556,
  556,
  556,
  556,
  556,
  556,
  556,
  556,
  278,
  278,
  584,
  584,
  584,
  556,
  1015,
  667,
  667,
  722,
  722,
  667,
  611,
  778,
  722,
  278,
  500,
  667,
  556,
  833,
  722,
  778,
  667,
  778,
  722,
  667,
  611,
  722,
  667,
  944,
  667,
  667,
  611,
  278,
  278,
  278,
  469,
  556,
  333,
  556,
  556,
  500,
  556,
  556,
  278,
  556,
  556,
  222,
  222,
  500,
  222,
  833,
  556,
  556,
  556,
  556,
  333,
  500,
  278,
  556,
  500,
  722,
  500,
  500,
  500,
  334,
  260,
  334,
  584,
  0,
  556,
  0,
  222,
  556,
  333,
  1e3,
  556,
  556,
  333,
  1e3,
  667,
  333,
  1e3,
  0,
  611,
  0,
  0,
  222,
  222,
  333,
  333,
  350,
  556,
  1e3,
  333,
  1e3,
  500,
  333,
  944,
  0,
  500,
  667,
  278,
  333,
  556,
  556,
  556,
  556,
  260,
  556,
  333,
  737,
  370,
  556,
  584,
  333,
  737,
  333,
  400,
  584,
  333,
  333,
  333,
  556,
  537,
  278,
  333,
  333,
  365,
  556,
  834,
  834,
  834,
  611,
  667,
  667,
  667,
  667,
  667,
  667,
  1e3,
  722,
  667,
  667,
  667,
  667,
  278,
  278,
  278,
  278,
  722,
  722,
  778,
  778,
  778,
  778,
  778,
  584,
  778,
  722,
  722,
  722,
  722,
  667,
  667,
  611,
  556,
  556,
  556,
  556,
  556,
  556,
  889,
  500,
  556,
  556,
  556,
  556,
  278,
  278,
  278,
  278,
  556,
  556,
  556,
  556,
  556,
  556,
  556,
  584,
  611,
  556,
  556,
  556,
  556,
  500,
  556,
  500
];
var HELVETICA_BOLD = [
  278,
  333,
  474,
  556,
  556,
  889,
  722,
  238,
  333,
  333,
  389,
  584,
  278,
  333,
  278,
  278,
  556,
  556,
  556,
  556,
  556,
  556,
  556,
  556,
  556,
  556,
  333,
  333,
  584,
  584,
  584,
  611,
  975,
  722,
  722,
  722,
  722,
  667,
  611,
  778,
  722,
  278,
  556,
  722,
  611,
  833,
  722,
  778,
  667,
  778,
  722,
  667,
  611,
  722,
  667,
  944,
  667,
  667,
  611,
  333,
  278,
  333,
  584,
  556,
  333,
  556,
  611,
  556,
  611,
  556,
  333,
  611,
  611,
  278,
  278,
  556,
  278,
  889,
  611,
  611,
  611,
  611,
  389,
  556,
  333,
  611,
  556,
  778,
  556,
  556,
  500,
  389,
  280,
  389,
  584,
  0,
  556,
  0,
  278,
  556,
  500,
  1e3,
  556,
  556,
  333,
  1e3,
  667,
  333,
  1e3,
  0,
  611,
  0,
  0,
  278,
  278,
  500,
  500,
  350,
  556,
  1e3,
  333,
  1e3,
  556,
  333,
  944,
  0,
  500,
  667,
  278,
  333,
  556,
  556,
  556,
  556,
  280,
  556,
  333,
  737,
  370,
  556,
  584,
  333,
  737,
  333,
  400,
  584,
  333,
  333,
  333,
  611,
  556,
  278,
  333,
  333,
  365,
  556,
  834,
  834,
  834,
  611,
  722,
  722,
  722,
  722,
  722,
  722,
  1e3,
  722,
  667,
  667,
  667,
  667,
  278,
  278,
  278,
  278,
  722,
  722,
  778,
  778,
  778,
  778,
  778,
  584,
  778,
  722,
  722,
  722,
  722,
  667,
  667,
  611,
  556,
  556,
  556,
  556,
  556,
  556,
  889,
  556,
  556,
  556,
  556,
  556,
  278,
  278,
  278,
  278,
  611,
  611,
  611,
  611,
  611,
  611,
  611,
  584,
  611,
  611,
  611,
  611,
  611,
  556,
  611,
  556
];
var FONT_WIDTHS = {
  regular: HELVETICA,
  bold: HELVETICA_BOLD
};

// src/pdf/writer.ts
var WIN_ANSI = {
  "\u20AC": 128,
  "\u201A": 130,
  \u0192: 131,
  "\u201E": 132,
  "\u2026": 133,
  "\u2020": 134,
  "\u2021": 135,
  "\u02C6": 136,
  "\u2030": 137,
  \u0160: 138,
  "\u2039": 139,
  \u0152: 140,
  \u017D: 142,
  "\u2018": 145,
  "\u2019": 146,
  "\u201C": 147,
  "\u201D": 148,
  "\u2022": 149,
  "\u2013": 150,
  "\u2014": 151,
  "\u02DC": 152,
  "\u2122": 153,
  \u0161: 154,
  "\u203A": 155,
  \u0153: 156,
  \u017E: 158,
  \u0178: 159,
  // Narrow and thin spaces (French typography) become a no-break or a plain space.
  "\u202F": 160,
  "\u2009": 32,
  "\u2192": 155,
  "\xD7": 215
};
function winAnsiCode(char) {
  const code = char.codePointAt(0) ?? 63;
  if (code >= 32 && code < 127) return code;
  if (code >= 160 && code <= 255) return code;
  return WIN_ANSI[char] ?? 63;
}
function textWidth(text4, font, size) {
  let total = 0;
  for (const char of text4) total += FONT_WIDTHS[font][winAnsiCode(char) - 32] ?? 556;
  return total * size / 1e3;
}
function wrapText(text4, font, size, width) {
  const lines = [];
  for (const paragraph of text4.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/ +/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && textWidth(candidate, font, size) > width) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}
var hex = (bytes) => [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase();
var pdfText = (text4) => `<${hex([...text4].map(winAnsiCode))}>`;
var n = (value) => (Math.round(value * 100) / 100).toString();
function rgb(color) {
  const value = /^#([0-9a-f]{6})$/i.exec(color)?.[1] ?? "000000";
  return [0, 2, 4].map((start) => n(parseInt(value.slice(start, start + 2), 16) / 255)).join(" ");
}
var FONT_RESOURCES = { regular: "F1", bold: "F2" };
var K = 0.5523;
var PdfPage = class {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }
  width;
  height;
  ops = [];
  /** Text whose baseline is `top` points from the top of the page. */
  text(x, top, value, style = {}) {
    const { font = "regular", size = 11, color = "#000000" } = style;
    this.ops.push(
      `BT /${FONT_RESOURCES[font]} ${n(size)} Tf ${rgb(color)} rg ${n(x)} ${n(this.height - top)} Td ${pdfText(value)} Tj ET`
    );
    return this;
  }
  rect(x, top, width, height, style) {
    const radius = Math.min(style.radius ?? 0, width / 2, height / 2);
    const bottom = this.height - top - height;
    const path = radius > 0 ? roundedPath(x, bottom, width, height, radius) : `${n(x)} ${n(bottom)} ${n(width)} ${n(height)} re`;
    this.ops.push(this.paint(path, style));
    return this;
  }
  circle(cx, cy, r, style) {
    const y = this.height - cy;
    const k = r * K;
    const path = [
      `${n(cx + r)} ${n(y)} m`,
      `${n(cx + r)} ${n(y + k)} ${n(cx + k)} ${n(y + r)} ${n(cx)} ${n(y + r)} c`,
      `${n(cx - k)} ${n(y + r)} ${n(cx - r)} ${n(y + k)} ${n(cx - r)} ${n(y)} c`,
      `${n(cx - r)} ${n(y - k)} ${n(cx - k)} ${n(y - r)} ${n(cx)} ${n(y - r)} c`,
      `${n(cx + k)} ${n(y - r)} ${n(cx + r)} ${n(y - k)} ${n(cx + r)} ${n(y)} c h`
    ].join(" ");
    this.ops.push(this.paint(path, style));
    return this;
  }
  line(x1, top1, x2, top2, color, width = 1) {
    this.ops.push(
      `${rgb(color)} RG ${n(width)} w ${n(x1)} ${n(this.height - top1)} m ${n(x2)} ${n(this.height - top2)} l S`
    );
    return this;
  }
  content() {
    return this.ops.join("\n");
  }
  paint(path, style) {
    const colors = [
      style.fill ? `${rgb(style.fill)} rg` : "",
      style.stroke ? `${rgb(style.stroke)} RG ${n(style.lineWidth ?? 1)} w` : ""
    ].filter(Boolean);
    const operator = style.fill && style.stroke ? "B" : style.fill ? "f" : "S";
    return `${colors.join(" ")} ${path} ${operator}`.trim();
  }
};
function roundedPath(x, y, width, height, r) {
  const k = r * K;
  const right = x + width;
  const top = y + height;
  return [
    `${n(x + r)} ${n(y)} m`,
    `${n(right - r)} ${n(y)} l`,
    `${n(right - r + k)} ${n(y)} ${n(right)} ${n(y + r - k)} ${n(right)} ${n(y + r)} c`,
    `${n(right)} ${n(top - r)} l`,
    `${n(right)} ${n(top - r + k)} ${n(right - r + k)} ${n(top)} ${n(right - r)} ${n(top)} c`,
    `${n(x + r)} ${n(top)} l`,
    `${n(x + r - k)} ${n(top)} ${n(x)} ${n(top - r + k)} ${n(x)} ${n(top - r)} c`,
    `${n(x)} ${n(y + r)} l`,
    `${n(x)} ${n(y + r - k)} ${n(x + r - k)} ${n(y)} ${n(x + r)} ${n(y)} c h`
  ].join(" ");
}
var utf16 = (text4) => {
  const units = [254, 255];
  for (let index = 0; index < text4.length; index += 1) {
    const unit = text4.charCodeAt(index);
    units.push(unit >> 8, unit & 255);
  }
  return `<${hex(units)}>`;
};
var pdfDate = (date2) => `D:${date2.toISOString().replace(/[-:T]/g, "").slice(0, 14)}Z`;
var A4 = { width: 595.28, height: 841.89 };
var PdfDocument = class {
  constructor(info) {
    this.info = info;
  }
  info;
  pages = [];
  addPage(width = A4.width, height = A4.height) {
    const page = new PdfPage(width, height);
    this.pages.push(page);
    return page;
  }
  /** The file: ASCII apart from the binary marker of the second line. */
  toBytes() {
    const objects = [];
    const pageIds = this.pages.map((_, index) => 6 + index * 2);
    objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${this.pages.length} >>`;
    objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
    objects[5] = `<< /Title ${utf16(this.info.title)} /Producer (Math Genius) /CreationDate (${pdfDate(this.info.created)}) >>`;
    this.pages.forEach((page, index) => {
      const id = pageIds[index] ?? 0;
      const content = page.content();
      objects[id] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(page.width)} ${n(page.height)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${id + 1} 0 R >>`;
      objects[id + 1] = `<< /Length ${content.length} >>
stream
${content}
endstream`;
    });
    let file = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
    const offsets = [];
    for (let id = 1; id < objects.length; id += 1) {
      offsets[id] = file.length;
      file += `${id} 0 obj
${objects[id]}
endobj
`;
    }
    const xref = file.length;
    file += `xref
0 ${objects.length}
0000000000 65535 f 
`;
    for (let id = 1; id < objects.length; id += 1) {
      file += `${String(offsets[id]).padStart(10, "0")} 00000 n 
`;
    }
    file += `trailer
<< /Size ${objects.length} /Root 1 0 R /Info 5 0 R >>
startxref
${xref}
%%EOF
`;
    const bytes = new Uint8Array(file.length);
    for (let index = 0; index < file.length; index += 1)
      bytes[index] = file.charCodeAt(index) & 255;
    return bytes;
  }
};

// src/pdf/monthly.ts
var MARGIN = 40;
var HEADER = 96;
var FOOTER = 36;
var BODY = 10.5;
var LINE = 14.5;
var Layout = class {
  constructor(title, created, header) {
    this.header = header;
    this.doc = new PdfDocument({ title, created });
    this.newPage(true);
    this.width = this.page.width - 2 * MARGIN;
  }
  header;
  doc;
  page;
  top = 0;
  width;
  newPage(first) {
    this.page = this.doc.addPage();
    this.header(this.page, first);
    this.top = first ? HEADER + 32 : MARGIN + 8;
  }
  /** Room for `height` points on this page, or a new one. */
  ensure(height) {
    if (this.top + height > this.page.height - FOOTER - 12) this.newPage(false);
  }
  space(height) {
    this.top += height;
  }
  lines(text4, options = {}) {
    const {
      font = "regular",
      size = BODY,
      color = COLORS2.ink,
      x = MARGIN,
      width = this.width
    } = options;
    const height = size * (LINE / BODY);
    for (const line of wrapText(text4, font, size, width)) {
      this.ensure(height);
      this.top += height;
      this.page.text(x, this.top - (height - size) / 2 - 2, line, { font, size, color });
    }
  }
  heading(text4) {
    this.ensure(48);
    this.space(14);
    this.lines(text4, { font: "bold", size: 13 });
    this.page.line(MARGIN, this.top + 4, MARGIN + 28, this.top + 4, COLORS2.pink, 2);
    this.space(10);
  }
  bullets(items, numbered = false) {
    items.forEach((item, index) => {
      const mark = numbered ? `${index + 1}.` : "\u2022";
      this.ensure(LINE);
      const start = this.top;
      this.lines(item, { x: MARGIN + 16, width: this.width - 16 });
      this.page.text(MARGIN + 2, start + LINE - 4, mark, {
        font: "bold",
        size: BODY,
        color: COLORS2.pink
      });
      this.space(2);
    });
  }
};
function tiles2(layout, items) {
  const gap = 8;
  const width = (layout.width - gap * (items.length - 1)) / items.length;
  const height = 58;
  layout.ensure(height + 8);
  items.forEach((item, index) => {
    const x = MARGIN + index * (width + gap);
    layout.page.rect(x, layout.top, width, height, { fill: COLORS2.card, radius: 8 });
    layout.page.text(x + 8, layout.top + 15, item.label.toUpperCase(), {
      size: 7,
      color: COLORS2.muted,
      font: "bold"
    });
    layout.page.text(x + 8, layout.top + 35, item.value, {
      font: "bold",
      size: 15,
      color: COLORS2.ink
    });
    if (item.detail)
      layout.page.text(x + 8, layout.top + 50, item.detail, { size: 8, color: COLORS2.muted });
  });
  layout.space(height + 8);
}
function calendar(layout, texts, recap) {
  const first = recap.days[0];
  if (!first) return;
  const cell = 24;
  const blanks = isoWeekday(first.date) - 1;
  const rows = Math.ceil((blanks + recap.days.length) / 7);
  layout.ensure(cell * (rows + 1) + 24);
  const top = layout.top;
  texts.weekly.week.forEach((letter, index) => {
    const x = MARGIN + index * cell + cell / 2 - textWidth(letter, "bold", 8) / 2;
    layout.page.text(x, top + 10, letter, { font: "bold", size: 8, color: COLORS2.muted });
  });
  recap.days.forEach((day, index) => {
    const position = blanks + index;
    const cx = MARGIN + position % 7 * cell + cell / 2;
    const cy = top + 16 + Math.floor(position / 7) * cell + cell / 2;
    const light = day.status === "pending" || day.status === "none";
    layout.page.circle(cx, cy, 9.5, {
      fill: DAY_COLORS[day.status],
      ...light ? { stroke: COLORS2.line, lineWidth: 0.8 } : {}
    });
    const label = String(dayOf(day.date).day);
    const dark = day.status === "off" || day.status === "vacation" || light;
    layout.page.text(cx - textWidth(label, "bold", 7.5) / 2, cy + 2.7, label, {
      font: "bold",
      size: 7.5,
      color: dark ? COLORS2.muted : COLORS2.white
    });
  });
  const legend2 = [
    ["done", texts.legend.done],
    ["started", texts.legend.started],
    ["missed", texts.legend.missed],
    ["off", texts.legend.off]
  ];
  legend2.forEach(([status, label], index) => {
    const y = top + 26 + index * 16;
    layout.page.circle(MARGIN + 7 * cell + 30, y - 3, 5, { fill: DAY_COLORS[status] });
    layout.page.text(MARGIN + 7 * cell + 42, y, label, { size: 9, color: COLORS2.ink });
  });
  layout.top = top + 16 + rows * cell + 8;
}
function bars(layout, texts, recap) {
  for (const domain of recap.domains) {
    layout.ensure(30);
    layout.lines(texts.monthly.masteryLine(domain.domain, domain.start, domain.end), { size: 9.5 });
    const top = layout.top + 3;
    const end = Math.max(0, Math.min(100, domain.end));
    const start = Math.max(0, Math.min(end, domain.start));
    layout.page.rect(MARGIN, top, layout.width, 8, { fill: COLORS2.line, radius: 4 });
    if (end > 0)
      layout.page.rect(MARGIN, top, layout.width * end / 100, 8, {
        fill: COLORS2.pink,
        radius: 4
      });
    if (start > 0)
      layout.page.rect(MARGIN, top, layout.width * start / 100, 8, {
        fill: COLORS2.lavender,
        radius: 4
      });
    layout.space(16);
  }
}
function blocking(layout, texts, recap) {
  for (const point of recap.blocking) {
    const shown = shownMistake(point);
    const details = [
      texts.monthly.errors(point.errors, point.answered),
      ...point.errorLabel ? [`${texts.example.mistake} : ${point.errorLabel}`] : [],
      ...shown ? [
        `${texts.example.prompt} : ${shown.prompt}`,
        `${texts.example.given} : ${shown.given}`,
        `${texts.example.expected} : ${shown.expected}`
      ] : []
    ];
    layout.ensure(LINE * (details.length + 2));
    const page = layout.page;
    const top = layout.top;
    layout.lines(point.title, { font: "bold", x: MARGIN + 12, width: layout.width - 12 });
    for (const detail of details) {
      layout.lines(detail.replace(/\n/g, " ; "), {
        x: MARGIN + 12,
        width: layout.width - 12,
        size: 9.5,
        color: COLORS2.muted
      });
    }
    if (layout.page === page)
      page.rect(MARGIN, top + 3, 3, layout.top - top, { fill: COLORS2.pink });
    layout.space(10);
  }
}
function monthlyPdf(recap, advice, texts, { created, today }) {
  const t = texts.monthly;
  const name = recap.child.name;
  const title = `${t.heading(recap.from)} \u2013 ${name}`;
  const layout = new Layout(title, created, (page, first) => {
    if (first) {
      page.rect(0, 0, page.width, HEADER, { fill: COLORS2.night });
      page.text(MARGIN, 32, texts.brand.toUpperCase(), {
        font: "bold",
        size: 9,
        color: COLORS2.pink
      });
      page.text(MARGIN, 60, `${t.heading(recap.from)} ${dayOf(recap.from).year}`, {
        font: "bold",
        size: 22,
        color: COLORS2.white
      });
      page.text(MARGIN, 80, `${name} \xB7 ${recap.child.grade}`, { size: 11, color: COLORS2.lavender });
    } else {
      page.rect(0, 0, page.width, 6, { fill: COLORS2.night });
    }
  });
  layout.lines(t.title(name), { font: "bold", size: 17 });
  layout.space(10);
  const color = VERDICT_COLORS[recap.verdict.level];
  const sentence = texts.verdict.sentence(name, recap.verdict, "month");
  const sentenceLines = wrapText(sentence, "regular", BODY, layout.width - 32);
  const boxHeight = 30 + sentenceLines.length * LINE;
  layout.page.rect(MARGIN, layout.top, layout.width, boxHeight, { fill: COLORS2.card, radius: 8 });
  layout.page.rect(MARGIN, layout.top, 5, boxHeight, { fill: color });
  layout.page.circle(MARGIN + 20, layout.top + 15, 4, { fill: color });
  layout.page.text(MARGIN + 30, layout.top + 18.5, texts.verdict.title[recap.verdict.level], {
    font: "bold",
    size: 11,
    color
  });
  sentenceLines.forEach((line, index) => {
    layout.page.text(MARGIN + 16, layout.top + 36 + index * LINE, line, {
      size: BODY,
      color: COLORS2.ink
    });
  });
  layout.space(boxHeight + 12);
  const s = texts.stats;
  tiles2(layout, [
    recap.planned > 0 ? { label: s.days, value: `${recap.done}`, detail: s.plannedDays(recap.planned) } : { label: s.days, value: `${recap.active}`, detail: s.played },
    { label: s.time, value: texts.duration(recap.minutes) },
    {
      label: s.success,
      value: recap.verdict.success === null ? s.none : texts.percent(recap.verdict.success)
    },
    { label: s.xp, value: `+${texts.integer(recap.xp)}` },
    { label: s.streak, value: s.streakValue(recap.streak) }
  ]);
  layout.heading(t.regularity);
  calendar(layout, texts, recap);
  if (recap.doneDates.length > 0) layout.lines(t.doneDates(recap.doneDates));
  layout.lines(recap.skippedDates.length > 0 ? t.skippedDates(recap.skippedDates) : t.noSkipped);
  const off = t.offDays(recap.offDays, recap.vacationDays);
  if (off) layout.lines(off, { color: COLORS2.muted });
  if (recap.domains.length > 0) {
    layout.heading(t.mastery);
    bars(layout, texts, recap);
    layout.lines(t.masteryNote, { size: 9, color: COLORS2.muted });
  }
  layout.heading(t.learned);
  if (recap.learned.length > 0) layout.bullets(recap.learned.map((skill) => skill.title));
  else layout.lines(t.learnedNone, { color: COLORS2.muted });
  layout.heading(t.badges);
  if (recap.badges.length > 0) layout.bullets(recap.badges.map(texts.badge));
  else layout.lines(t.badgesNone, { color: COLORS2.muted });
  layout.heading(t.rewards);
  if (recap.rewards.length > 0) layout.bullets(recap.rewards);
  else layout.lines(t.rewardsNone, { color: COLORS2.muted });
  layout.heading(t.blocking);
  if (recap.blocking.length > 0) blocking(layout, texts, recap);
  else layout.lines(t.blockingNone, { color: COLORS2.muted });
  const programme = recap.programme ? texts.programme(name, recap.programme) : null;
  if (programme) {
    layout.heading(t.programme);
    layout.lines(programme);
    layout.lines(texts.programmeNote, { size: 9, color: COLORS2.muted });
  }
  layout.heading(t.advice(recap.from));
  layout.bullets(advice.tips, true);
  layout.lines(t.adviceSource[advice.source], { size: 9, color: COLORS2.muted });
  const pages = layout.doc.pages;
  const generated = t.generated(today);
  pages.forEach((page, index) => {
    const bottom = page.height - FOOTER / 2;
    page.line(MARGIN, bottom - 14, page.width - MARGIN, bottom - 14, COLORS2.line, 0.5);
    page.text(MARGIN, bottom, `${texts.brand} \xB7 ${generated}`, { size: 8, color: COLORS2.muted });
    const number = t.page(index + 1, pages.length);
    page.text(page.width - MARGIN - textWidth(number, "regular", 8), bottom, number, {
      size: 8,
      color: COLORS2.muted
    });
  });
  return layout.doc.toBytes();
}

// src/storage.ts
var RECAPS_BUCKET = "recaps";
var SIGNED_LINK_SECONDS = 600;
var pdfPath = (familyId, childId, monthStart) => `${familyId}/${childId}/${monthStart.slice(0, 7)}.pdf`;
var encodePath = (path) => path.split("/").map(encodeURIComponent).join("/");
function supabaseStorage(url, serviceKey, fetcher = fetch) {
  const api = `${url.replace(/\/+$/, "")}/storage/v1`;
  const headers2 = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const failed = async (response) => new Error(`Storage ${response.status}: ${await response.text()}`);
  const upload = (path, bytes) => fetcher(`${api}/object/${RECAPS_BUCKET}/${encodePath(path)}`, {
    method: "POST",
    headers: { ...headers2, "Content-Type": "application/pdf", "x-upsert": "true" },
    body: bytes
  });
  return {
    async upload(path, bytes) {
      let response = await upload(path, bytes);
      if (!response.ok && /bucket not found/i.test(await response.clone().text())) {
        await fetcher(`${api}/bucket`, {
          method: "POST",
          headers: { ...headers2, "Content-Type": "application/json" },
          body: JSON.stringify({ id: RECAPS_BUCKET, name: RECAPS_BUCKET, public: false })
        });
        response = await upload(path, bytes);
      }
      if (!response.ok) throw await failed(response);
    },
    async signedUrl(path) {
      const response = await fetcher(`${api}/object/sign/${RECAPS_BUCKET}/${encodePath(path)}`, {
        method: "POST",
        headers: { ...headers2, "Content-Type": "application/json" },
        body: JSON.stringify({ expiresIn: SIGNED_LINK_SECONDS })
      });
      if (!response.ok) throw await failed(response);
      const body = await response.json();
      if (typeof body.signedURL !== "string") throw new Error("Storage: no signed link");
      return `${api}${body.signedURL}`;
    },
    async remove(paths) {
      if (paths.length === 0) return;
      const response = await fetcher(`${api}/object/${RECAPS_BUCKET}`, {
        method: "DELETE",
        headers: { ...headers2, "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: paths })
      });
      if (!response.ok) throw await failed(response);
    }
  };
}

// src/texts.ts
var rate = (verdict) => verdict.success === null ? null : percent(verdict.success);
var BADGES = {
  "streak-3": "Bien parti",
  "streak-7": "Une semaine de feu",
  "streak-14": "Deux semaines d\u2019affil\xE9e",
  "streak-30": "Un mois de feu",
  "streak-50": "Inarr\xEAtable",
  "streak-100": "Cent jours",
  "streak-365": "Une ann\xE9e de feu",
  "sessions-1": "Premi\xE8re mission",
  "sessions-10": "Dix missions",
  "sessions-25": "Vingt-cinq missions",
  "sessions-50": "Cinquante missions",
  "sessions-100": "Cent missions",
  weekend: "M\xEAme le week-end",
  comeback: "Le grand retour",
  "mastery-1": "Premi\xE8re comp\xE9tence",
  "mastery-5": "Cinq comp\xE9tences",
  "mastery-10": "Dix comp\xE9tences",
  "mastery-25": "Vingt-cinq comp\xE9tences",
  tables: "As des tables",
  "mental-math": "Calcul \xE9clair",
  "all-domains": "Touche-\xE0-tout",
  "combo-10": "Combo \xD710",
  "combo-25": "Combo \xD725",
  "perfect-5": "Cinq sans-faute",
  "perfect-20": "Vingt sans-faute",
  "answers-100": "100 bonnes r\xE9ponses",
  "answers-1000": "1 000 bonnes r\xE9ponses",
  "answers-5000": "5 000 bonnes r\xE9ponses",
  "perfect-1": "Premier sans-faute",
  "bonus-1": "Encore plus !",
  "rare-chest": "Coffre rare",
  "explorer-10": "Exploration",
  "explorer-25": "Grande exploration",
  "gems-100": "Petit tr\xE9sor",
  "level-5": "Niveau 5",
  "level-10": "Niveau 10",
  "level-20": "Niveau 20",
  "island-1": "Premi\xE8re \xEEle",
  "island-2": "Deux \xEEles",
  "island-4": "Tour des \xEEles",
  "boss-perfect": "Boss sans faute",
  "challenge-1": "Premier d\xE9fi",
  "challenge-5": "Cinq d\xE9fis",
  "first-exercise": "Premier exercice"
};
var DOMAINS3 = {
  numbers: "Nombres et calcul",
  measures: "Grandeurs et mesures",
  geometry: "Espace et g\xE9om\xE9trie",
  data: "Donn\xE9es et probl\xE8mes"
};
var EVERYDAY2 = {
  numbers: "comparez des prix au supermarch\xE9 ou doublez les quantit\xE9s d\u2019une recette",
  measures: "mesurez des objets de la maison ou calculez la dur\xE9e d\u2019un trajet",
  geometry: "cherchez des formes et des angles droits autour de vous",
  data: "lisez ensemble un tableau ou un graphique, les horaires d\u2019un bus par exemple"
};
var fr = {
  brand: "Math Genius",
  badge: (code) => code in BADGES ? BADGES[code] : code,
  domain: (domain) => DOMAINS3[domain],
  verdict: {
    title: {
      good: "\xC7a va bien",
      watch: "\xC0 surveiller",
      alert: "\xC0 reprendre en main",
      none: "Pas encore de s\xE9ance"
    },
    sentence(name, verdict, scope) {
      const success = rate(verdict);
      const sessions = (done) => count(done, "s\xE9ance", "s\xE9ances");
      const when = scope === "week" ? "cette semaine" : "ce mois-ci";
      if (verdict.level === "none") return `Pas encore de s\xE9ance pour ${name} ${when}.`;
      if (verdict.planned > 0 && verdict.active === 0) {
        return `${name} n\u2019a fait aucune des ${verdict.planned} s\xE9ances pr\xE9vues ${when} : un petit coup de pouce aidera \xE0 reprendre.`;
      }
      const regular = verdict.planned === 0 ? `${count(verdict.active, "jour", "jours")} d\u2019exercices` : scope === "week" ? `${sessions(verdict.done)} sur ${verdict.planned} pr\xE9vue${verdict.planned > 1 ? "s" : ""}` : `${count(verdict.done, "jour fait", "jours faits")} sur ${verdict.planned} pr\xE9vu${verdict.planned > 1 ? "s" : ""}`;
      if (verdict.irregular && verdict.struggling) {
        return `Des s\xE9ances manqu\xE9es (${regular}) et une r\xE9ussite en baisse (${success}) : c\u2019est le moment d\u2019en parler ensemble.`;
      }
      if (verdict.irregular) {
        const missed = verdict.level === "alert" ? "Beaucoup de s\xE9ances manqu\xE9es" : "Quelques s\xE9ances manqu\xE9es";
        return success ? `${missed} : ${regular}. Quand ${name} joue, la r\xE9ussite est bonne (${success}).` : `${missed} : ${regular}.`;
      }
      if (verdict.struggling) {
        return `La r\xE9gularit\xE9 est l\xE0 (${regular}), mais la r\xE9ussite baisse : ${success}. Les points de blocage disent o\xF9 aider.`;
      }
      return success ? `${name} a fait ${regular}, avec ${success} de bonnes r\xE9ponses.` : `${name} a fait ${regular}.`;
    }
  },
  programme(name, programme) {
    if (programme.position === null) return null;
    const met = `la classe a abord\xE9 environ ${count(programme.expected, "comp\xE9tence", "comp\xE9tences")} sur ${programme.total}`;
    const own = `${name} en ma\xEEtrise ${programme.mastered} et en travaille ${programme.working}`;
    const gaps = programme.gaps > 0 ? ` ${count(programme.gaps, "notion", "notions")} des ann\xE9es pr\xE9c\xE9dentes \xE0 consolider${programme.gapTitles.length > 0 ? ` (${joinAnd(programme.gapTitles.map((title) => `\xAB\xA0${title}\xA0\xBB`))})` : ""}.` : "";
    const lead = {
      ahead: `En avance sur le programme de ${programme.grade}`,
      on_track: `Dans le rythme du programme de ${programme.grade}`,
      behind: `Un peu en retard sur le programme de ${programme.grade}`
    }[programme.position];
    return `${lead} : ${met} ; ${own}.${gaps}`;
  },
  programmeNote: "Estimation : le programme de l\u2019ann\xE9e est r\xE9parti de septembre \xE0 juin.",
  stats: {
    sessions: "S\xE9ances",
    days: "Jours faits",
    planned: (planned) => `sur ${planned} pr\xE9vue${planned > 1 ? "s" : ""}`,
    plannedDays: (planned) => `sur ${planned} pr\xE9vu${planned > 1 ? "s" : ""}`,
    played: "jours d\u2019exercices",
    streak: "S\xE9rie",
    streakValue: (days) => count(days, "jour", "jours"),
    time: "Temps",
    success: "R\xE9ussite",
    xp: "XP gagn\xE9s",
    none: "\u2014"
  },
  duration,
  integer,
  percent,
  weekly: {
    subject: (name, from, to) => `R\xE9cap de la semaine de ${name} (${period(from, to)})`,
    heading: "R\xE9cap de la semaine",
    title: (name) => `La semaine de ${name}`,
    period,
    week: ["L", "M", "M", "J", "V", "S", "D"],
    learned: "Comp\xE9tence acquise",
    learnedNone: "Pas de nouvelle comp\xE9tence acquise cette semaine : les progr\xE8s se construisent s\xE9ance apr\xE8s s\xE9ance.",
    learnedMore: (more) => `et ${count(more, "autre", "autres")}`,
    toWork: "Point \xE0 travailler",
    toWorkNone: "Rien de particulier cette semaine.",
    mastery: (value) => `ma\xEEtrise ${value}${NBSP}%`
  },
  monthly: {
    subject: (name, from) => `R\xE9cap ${ofMonth(from)} de ${name}`,
    heading: (from) => `R\xE9cap ${ofMonth(from)}`,
    title: (name) => `Le mois de ${name}`,
    month: monthYear,
    regularity: "R\xE9gularit\xE9",
    doneDates: (dates) => `Jours faits : ${dayList(dates)}.`,
    skippedDates: (dates) => `Jours saut\xE9s : ${joinAnd(
      dates.map(({ date: date2, started }) => `${shortDay(date2)}${started ? " (commenc\xE9e)" : ""}`)
    )}.`,
    noSkipped: "Aucun jour saut\xE9.",
    offDays: (off, vacation) => [
      off > 0 && `${count(off, "jour off", "jours off")}`,
      vacation > 0 && `${count(vacation, "jour de vacances", "jours de vacances")}`
    ].filter(Boolean).join(" et ").replace(/.+/, (line) => `${line}.`) || null,
    mastery: "Ma\xEEtrise par domaine",
    masteryLine: (domain, start, end) => `${DOMAINS3[domain]} : de ${start}${NBSP}% \xE0 ${end}${NBSP}%`,
    masteryNote: "Part du programme de la classe ma\xEEtris\xE9e, au d\xE9but et \xE0 la fin du mois.",
    learned: "Appris ce mois-ci",
    learnedNone: "Pas de nouvelle comp\xE9tence ma\xEEtris\xE9e ce mois-ci.",
    badges: "Badges gagn\xE9s",
    badgesNone: "Aucun badge ce mois-ci.",
    rewards: "R\xE9compenses d\xE9bloqu\xE9es",
    rewardsNone: "Aucune r\xE9compense d\xE9bloqu\xE9e ce mois-ci.",
    blocking: "Points de blocage",
    blockingNone: "Pas de point de blocage ce mois-ci.",
    errors: (errors, answered) => `${count(errors, "erreur", "erreurs")} sur ${count(answered, "r\xE9ponse", "r\xE9ponses")}`,
    programme: "Comparaison au programme",
    advice: (from) => `3 conseils pour ${monthName(nextMonth(from))}`,
    adviceSource: {
      ai: "Conseils r\xE9dig\xE9s par le coach \xE0 partir du bilan.",
      standard: "Conseils tir\xE9s du bilan du mois."
    },
    pdf: (from) => `Le r\xE9cap complet ${ofMonth(from)} est joint en PDF et reste t\xE9l\xE9chargeable dans l\u2019app.`,
    generated: (date2) => `R\xE9cap \xE9tabli le ${longDay(date2)}`,
    page: (page, pages) => `${page} / ${pages}`
  },
  example: {
    prompt: "\xC9nonc\xE9",
    given: "R\xE9ponse",
    expected: "Bonne r\xE9ponse",
    mistake: "Erreur rep\xE9r\xE9e"
  },
  legend: {
    done: "fait",
    started: "commenc\xE9",
    missed: "manqu\xE9",
    off: "off ou vacances",
    pending: "\xE0 venir"
  },
  cta: "Voir les progr\xE8s dans l\u2019app",
  openApp: "Le d\xE9tail est dans l\u2019app, page Progr\xE8s.",
  footer: {
    why: (kind) => `Vous recevez cet email parce que le r\xE9cap ${kind === "weekly" ? "hebdomadaire" : "mensuel"} est activ\xE9 pour votre compte parent.`,
    unsubscribe: (kind) => `Ne plus recevoir le r\xE9cap ${kind === "weekly" ? "hebdomadaire" : "mensuel"} par email`,
    unsubscribeAll: "Ne plus recevoir aucun r\xE9cap par email",
    settings: "Les r\xE9glages sont aussi dans l\u2019app : R\xE9caps, depuis l\u2019accueil parent."
  },
  unsubscribed: {
    weekly: "C\u2019est not\xE9 : vous ne recevrez plus le r\xE9cap hebdomadaire par email. Vous pouvez le r\xE9activer dans l\u2019app, page R\xE9caps.",
    monthly: "C\u2019est not\xE9 : vous ne recevrez plus le r\xE9cap mensuel par email. Vous pouvez le r\xE9activer dans l\u2019app, page R\xE9caps.",
    all: "C\u2019est not\xE9 : vous ne recevrez plus aucun r\xE9cap par email. Vous pouvez les r\xE9activer dans l\u2019app, page R\xE9caps.",
    unknown: "Ce lien de d\xE9sinscription n\u2019est plus valable. Les r\xE9glages des r\xE9caps sont dans l\u2019app, page R\xE9caps."
  },
  advice: {
    regularWeekday: (weekday) => `Les ${weekdayName(weekday)}s sont souvent saut\xE9s : fixez ce jour-l\xE0 un moment pr\xE9cis pour la s\xE9ance, par exemple juste apr\xE8s le go\xFBter.`,
    keepRhythm: "Gardez ce bon rythme : une s\xE9ance courte chaque jour pr\xE9vu vaut mieux qu\u2019une longue de temps en temps.",
    setRhythm: "Installez un moment fixe pour la s\xE9ance du jour, toujours \xE0 la m\xEAme heure : l\u2019habitude fait la moiti\xE9 du travail.",
    mistake: (title, label) => `Sur \xAB\xA0${title}\xA0\xBB, votre enfant ${label} : refaites un exemple ensemble \xE0 voix haute, puis laissez-le en inventer un.`,
    hardest: (title) => `Revoyez ensemble \xAB\xA0${title}\xA0\xBB : c\u2019est la notion qui a demand\xE9 le plus d\u2019efforts ce mois-ci.`,
    explain: (title) => `Demandez \xE0 votre enfant de vous expliquer \xAB\xA0${title}\xA0\xBB : expliquer, c\u2019est retenir.`,
    showMethod: "Demandez \xE0 votre enfant de vous montrer un exercice r\xE9ussi et de vous expliquer sa m\xE9thode.",
    gaps: (title) => `Quelques bases de l\u2019an dernier sont \xE0 revoir, comme \xAB\xA0${title}\xA0\xBB : l\u2019app les propose en r\xE9vision, encouragez votre enfant \xE0 ne pas les sauter.`,
    everyday: (domain) => `C\xF4t\xE9 ${DOMAINS3[domain].toLowerCase()}, profitez du quotidien : ${EVERYDAY2[domain]}.`,
    celebrate: "F\xEAtez les progr\xE8s du mois avec votre enfant : la fiert\xE9 donne envie de continuer."
  },
  facts: {
    regularity: (done, planned, weekday) => planned > 0 ? `R\xE9gularit\xE9 : ${done} jours faits sur ${planned} pr\xE9vus${weekday ? ` ; jour le plus souvent saut\xE9 : le ${weekdayName(weekday)}` : ""}` : `R\xE9gularit\xE9 : ${done} jours d\u2019exercices, sans routine`,
    success: (success, minutes) => `R\xE9ussite : ${success === null ? "trop peu de r\xE9ponses pour juger" : `${Math.round(success * 100)} % de bonnes r\xE9ponses`} ; temps total : ${minutes} minutes`,
    learned: (titles) => titles.length > 0 ? `Comp\xE9tences ma\xEEtris\xE9es ce mois-ci : ${titles.join(" ; ")}` : "Aucune nouvelle comp\xE9tence ma\xEEtris\xE9e ce mois-ci",
    blocking: (title, errors, label) => `Point de blocage : \xAB\xA0${title}\xA0\xBB (${errors} erreurs${label ? ` ; erreur typique : ${label}` : ""})`,
    domain: (domain, start, end) => `${DOMAINS3[domain]} : ma\xEEtrise de ${start} % \xE0 ${end} %`,
    programme: (programme) => `Programme : ${{ ahead: "en avance", on_track: "dans le rythme", behind: "un peu en retard" }[programme.position ?? "on_track"]}${programme.gaps > 0 ? ` ; ${programme.gaps} notions des ann\xE9es pr\xE9c\xE9dentes \xE0 consolider` : ""}`,
    streak: (streak) => `S\xE9rie en cours : ${streak} jours`
  }
};
var textsFor = (language) => language === "fr" ? fr : fr;

// src/deliver.ts
var isRow3 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
var text3 = (value) => typeof value === "string" ? value : "";
function readDelivery(value) {
  if (!isRow3(value)) return null;
  const content = readRecap(value.content);
  const kind = value.kind === "weekly" || value.kind === "monthly" ? value.kind : null;
  if (!content || !kind || content.kind !== kind || !text3(value.id)) return null;
  return {
    id: text3(value.id),
    kind,
    childId: text3(value.child_id),
    familyId: text3(value.family_id),
    language: text3(value.language) || "fr",
    timezone: text3(value.timezone) || "Europe/Paris",
    content,
    advice: readAdvice(value.advice),
    pdfPath: typeof value.pdf_path === "string" ? value.pdf_path : null,
    summary: typeof value.summary === "string" && value.summary.trim() ? value.summary : null,
    recipients: (Array.isArray(value.recipients) ? value.recipients : []).flatMap(
      (row) => isRow3(row) && text3(row.email) && text3(row.parent_id) ? [
        {
          parentId: text3(row.parent_id),
          name: text3(row.name),
          email: text3(row.email),
          token: text3(row.token)
        }
      ] : []
    )
  };
}
function localDate(at, timeZone) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(at);
  } catch {
    return at.toISOString().slice(0, 10);
  }
}
var message = (error) => error instanceof Error ? error.message : String(error);
async function monthAdvice(delivery, recap, texts, deps) {
  if (delivery.advice) return delivery.advice;
  const tips = delivery.summary ? await deps.coach(delivery, adviceFacts(recap, texts)).catch(() => null) : null;
  const advice = tips ? { source: "ai", tips } : { source: "standard", tips: standardAdvice(recap, texts) };
  await deps.store.save(delivery.id, { advice });
  return advice;
}
var renderPdf = (delivery, recap, advice, texts, now) => monthlyPdf(recap, advice, texts, { created: now, today: localDate(now, delivery.timezone) });
async function storePdf(delivery, bytes, deps) {
  const path = pdfPath(delivery.familyId, delivery.childId, delivery.content.from);
  await deps.storage.upload(path, bytes);
  await deps.store.save(delivery.id, { pdfPath: path });
  return path;
}
function linksFor(delivery, recipient, deps) {
  const unsubscribe = (kind) => `${deps.functionsUrl.replace(/\/+$/, "")}/recaps?task=unsubscribe&kind=${kind}&token=${encodeURIComponent(recipient.token)}`;
  return {
    app: deps.appUrl ? `${deps.appUrl.replace(/\/+$/, "")}/parent/children/${delivery.childId}/progress` : null,
    unsubscribe: unsubscribe(delivery.kind),
    unsubscribeAll: unsubscribe("all")
  };
}
async function deliverRecap(delivery, deps) {
  const texts = textsFor(delivery.language);
  const recap = delivery.content;
  let advice = null;
  let pdf = null;
  if (recap.kind === "monthly") {
    advice = await monthAdvice(delivery, recap, texts, deps);
    pdf = renderPdf(delivery, recap, advice, texts, deps.now());
    if (!delivery.pdfPath)
      await storePdf(delivery, pdf, deps).catch((error) => console.error("recap pdf", error));
  }
  if (!deps.mailer) {
    await deps.store.done(delivery.id, null);
    return { sent: 0, failed: 0, emails: false };
  }
  let sent = 0;
  const problems = [];
  for (const recipient of delivery.recipients) {
    const links = linksFor(delivery, recipient, deps);
    const email = recap.kind === "weekly" ? weeklyEmail(recap, texts, links) : monthlyEmail(
      recap,
      advice ?? { source: "standard", tips: standardAdvice(recap, texts) },
      texts,
      links
    );
    try {
      const result = await deps.mailer({
        from: deps.from,
        to: recipient.email,
        ...email,
        unsubscribe: links.unsubscribe,
        attachments: pdf ? [{ filename: `recap-${recap.from.slice(0, 7)}.pdf`, content: pdf }] : void 0
      });
      await deps.store.emailResult(delivery.id, recipient.parentId, result);
      sent += 1;
    } catch (error) {
      problems.push(message(error));
      await deps.store.emailResult(delivery.id, recipient.parentId, { error: message(error) });
    }
  }
  await deps.store.done(delivery.id, problems.length > 0 ? problems.join(" ; ") : null);
  return { sent, failed: problems.length, emails: true };
}
async function recapPdfLink(delivery, deps) {
  const recap = delivery.content;
  if (recap.kind !== "monthly") throw new Error("not_monthly");
  const texts = textsFor(delivery.language);
  let path = delivery.pdfPath;
  if (!path) {
    const advice = await monthAdvice(delivery, recap, texts, deps);
    path = await storePdf(delivery, renderPdf(delivery, recap, advice, texts, deps.now()), deps);
  }
  return deps.storage.signedUrl(path);
}
var unsubscribedText = (language, kind, done) => {
  const texts = textsFor(language).unsubscribed;
  if (!done) return texts.unknown;
  return kind === "weekly" || kind === "monthly" || kind === "all" ? texts[kind] : texts.unknown;
};
function gatewayCoach(rpc, secrets, fetcher = fetch) {
  return async (delivery, facts) => {
    const context = readAdviceContext(
      await rpc("advice_context", { p_child_id: delivery.childId }),
      secrets
    );
    if (!context) return null;
    const result = await advise(
      { grade: context.grade, facts, summary: delivery.summary },
      context.settings,
      {
        logUsage: async (usage) => void await rpc("coach_log_usage", { p_usage: usageRow(usage, delivery.childId) })
      },
      fetcher
    );
    return result.ok ? result.tips : null;
  };
}

// src/resend.ts
var RESEND_URL = "https://api.resend.com/emails";
function toBase64(bytes) {
  let binary = "";
  for (let start = 0; start < bytes.length; start += 32768) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 32768));
  }
  return btoa(binary);
}
function resendMailer(apiKey, fetcher = fetch) {
  return async (email) => {
    const response = await fetcher(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: email.from,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: {
          "List-Unsubscribe": `<${email.unsubscribe}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
        },
        attachments: email.attachments?.map((file) => ({
          filename: file.filename,
          content: toBase64(file.content)
        }))
      }),
      signal: AbortSignal.timeout(15e3)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || typeof body.id !== "string") {
      throw new Error(
        `Resend ${response.status}: ${typeof body.message === "string" ? body.message : "error"}`
      );
    }
    return { id: body.id };
  };
}
export {
  RECAPS_BUCKET,
  adviceFacts,
  deliverRecap,
  fr,
  gatewayCoach,
  localDate,
  monthAdvice,
  monthlyEmail,
  monthlyPdf,
  mostSkippedWeekday,
  pdfPath,
  readDelivery,
  recapPdfLink,
  resendMailer,
  shownMistake,
  standardAdvice,
  supabaseStorage,
  textsFor,
  toBase64,
  unsubscribedText,
  weeklyEmail
};
