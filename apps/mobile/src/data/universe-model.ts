import { type Grade, type Tables, universeDue } from '@math-genius/shared';

/**
 * « Ton univers » (docs/specs.md): the questions and choices of the catalogue that suit the child's
 * grade, the child's answers, and when to ask. Pure; the queries are in universe.ts.
 */

export type Catalogue = {
  questions: Pick<
    Tables<'interest_questions'>,
    'id' | 'title' | 'grades' | 'position' | 'other_grades'
  >[];
  options: Pick<Tables<'interest_options'>, 'question_id' | 'universe_id' | 'icon' | 'position'>[];
  universes: Pick<Tables<'universes'>, 'id' | 'name' | 'grades' | 'status'>[];
};

export type UniverseOption = { universeId: string; name: string; icon: string };

export type UniverseQuestion = {
  id: string;
  title: string;
  options: UniverseOption[];
  /** A free « Autre » answer (collège). */
  allowsOther: boolean;
};

/** The questions asked at this grade, each with the choices allowed for it (age and PEGI). */
export function questionsFor(catalogue: Catalogue, grade: Grade): UniverseQuestion[] {
  const universes = new Map(
    catalogue.universes
      .filter((universe) => universe.status === 'active' && universe.grades.includes(grade))
      .map((universe) => [universe.id, universe]),
  );
  return [...catalogue.questions]
    .filter((question) => question.grades.includes(grade))
    .sort((a, b) => a.position - b.position)
    .map((question) => ({
      id: question.id,
      title: question.title,
      allowsOther: question.other_grades.includes(grade),
      options: catalogue.options
        .filter((option) => option.question_id === question.id)
        .sort((a, b) => a.position - b.position)
        .flatMap((option) => {
          const universe = universes.get(option.universe_id);
          return universe
            ? [{ universeId: universe.id, name: universe.name, icon: option.icon }]
            : [];
        }),
    }))
    .filter((question) => question.options.length > 0);
}

export type Interests = {
  chosen: Pick<Tables<'child_interests'>, 'universe_id' | 'question_id' | 'source'>[];
  others: Pick<Tables<'interest_other_answers'>, 'question_id' | 'answer' | 'status'>[];
};

/** Per question: the universes chosen and the free answer. */
export type Answers = Readonly<Record<string, { universes: readonly string[]; other: string }>>;

export function answersOf(interests: Interests | undefined): Answers {
  const answers: Record<string, { universes: string[]; other: string }> = {};
  const entry = (question: string) => (answers[question] ??= { universes: [], other: '' });
  for (const { question_id, universe_id } of interests?.chosen ?? []) {
    entry(question_id).universes.push(universe_id);
  }
  for (const { question_id, answer } of interests?.others ?? []) entry(question_id).other = answer;
  return answers;
}

/** Adds or removes a universe from a question's answer. */
export function toggled(answers: Answers, question: string, universe: string): Answers {
  const current = answers[question] ?? { universes: [], other: '' };
  const universes = current.universes.includes(universe)
    ? current.universes.filter((id) => id !== universe)
    : [...current.universes, universe];
  return { ...answers, [question]: { ...current, universes } };
}

/**
 * What set_child_interests receives: every question shown, so that a choice removed is removed,
 * and only the universes still offered.
 */
export function answersPayload(questions: readonly UniverseQuestion[], answers: Answers) {
  return questions.map((question) => {
    const answer = answers[question.id];
    const offered = new Set(question.options.map((option) => option.universeId));
    return {
      question: question.id,
      universes: (answer?.universes ?? []).filter((id) => offered.has(id)),
      other: question.allowsOther ? (answer?.other.trim() ?? '') : '',
    };
  });
}

/** The universes chosen, in the questionnaire's order. */
export function chosenOf(
  questions: readonly UniverseQuestion[],
  answers: Answers,
): UniverseOption[] {
  return questions.flatMap((question) =>
    question.options.filter((option) =>
      answers[question.id]?.universes.includes(option.universeId),
    ),
  );
}

export type UniverseOffer = 'first' | 'again' | null;

/**
 * Whether the child's home offers « Ton univers »: only once the parent agreed, the first time,
 * then every 3 months and at each school year (« Tes goûts ont changé ? »).
 */
export function universeOffer(
  child: { personalization_consent_at: string | null; universe_asked_at: string | null },
  now: Date,
): UniverseOffer {
  if (!child.personalization_consent_at) return null;
  if (!child.universe_asked_at) return 'first';
  return universeDue(child.universe_asked_at, now) ? 'again' : null;
}
