import { type ErrorTypeCode, type SkillCode, getSkill } from '@math-genius/curriculum';
import type { Grade } from '@math-genius/shared';

import { simulateChild, type VirtualChild } from '../testing/child';
import { at } from '../testing/learner';
import type { MasteryRecord } from './mastery';
import {
  FLAWLESS_RUN,
  MENTAL_FAST_MS,
  RECURRENT_ERROR,
  RUSHED_MS,
  type LearnerProfile,
  type ProfileAttempt,
  type ProfileInput,
  type ProfileSession,
  learnerProfile,
  localHour,
  timeOfDay,
} from './profile';
import { profileSummary } from './profile-summary';

const NOW = '2026-10-20T03:00:00.000Z';
const DAY = 86_400;

/** An answer with sensible defaults: right, 8 seconds, on a CM1 skill. */
const answer = (fields: Partial<ProfileAttempt> & { skill?: SkillCode } = {}): ProfileAttempt => ({
  generatorId: fields.skill ?? 'cm1.perimetre',
  skill: 'cm1.perimetre',
  difficulty: 3,
  slot: 'current',
  twinOf: null,
  correct: true,
  timeMs: 8000,
  answeredAt: at(NOW, -DAY),
  learnerElo: 1200,
  error: null,
  ...fields,
});

/** A completed session of `attempts`, answers 20 s apart from `startedAt`. */
const session = (
  attempts: readonly Partial<ProfileAttempt>[],
  fields: Partial<Omit<ProfileSession, 'attempts'>> = {},
): ProfileSession => {
  const startedAt = fields.startedAt ?? at(NOW, -DAY);
  const answers = attempts.map((fields, index) =>
    answer({ answeredAt: at(startedAt, (index + 1) * 20), ...fields }),
  );
  return {
    kind: 'daily',
    grade: 'CM1',
    startedAt,
    completedAt: answers.at(-1)?.answeredAt ?? startedAt,
    attempts: answers,
    ...fields,
  };
};

const record = (fields: Partial<MasteryRecord>): MasteryRecord => ({
  elo: 1200,
  attempts: 30,
  streak: 0,
  masteredAt: null,
  practicedAt: at(NOW, -DAY),
  ...fields,
});

const profile = (input: Partial<ProfileInput>) =>
  learnerProfile({
    childGrade: 'CM1',
    mastery: {},
    sessions: [],
    timeZone: 'Europe/Paris',
    at: NOW,
    ...input,
  });

const wrong = (error: ErrorTypeCode | null, skill: SkillCode = 'cm1.perimetre') => ({
  skill,
  correct: false,
  error,
});

describe('points to work on', () => {
  it('names a typical mistake made 3 times, most frequent first', () => {
    const attempts = [
      ...Array.from({ length: RECURRENT_ERROR }, () => wrong('area-perimeter')),
      ...Array.from({ length: 4 }, () => wrong('half-perimeter')),
      wrong('reverse-order', 'cm1.comparer-decimaux'),
      wrong('reverse-order', 'cm1.comparer-decimaux'),
      {},
    ];
    const { weaknesses } = profile({ sessions: [session(attempts)] });
    expect(weaknesses).toEqual([
      expect.objectContaining({ kind: 'error', error: 'half-perimeter', count: 4 }),
      expect.objectContaining({ kind: 'error', error: 'area-perimeter', count: 3 }),
    ]);
  });

  it('leaves out a mistake lost among many other errors on its skills', () => {
    const attempts = [
      ...Array.from({ length: 3 }, () => wrong('area-perimeter')),
      ...Array.from({ length: 10 }, () => wrong(null)),
    ];
    expect(profile({ sessions: [session(attempts)] }).weaknesses).toEqual([]);
  });

  it('forgets what is older than 30 days', () => {
    const old = session(
      Array.from({ length: 5 }, () => wrong('area-perimeter')),
      { startedAt: at(NOW, -31 * DAY) },
    );
    expect(profile({ sessions: [old] }).weaknesses).toEqual([]);
  });

  it('names a skill mastered once and fading since, and a skill the child is stuck on', () => {
    const mastery = {
      'cm1.perimetre': record({
        elo: 1500,
        masteredAt: at(NOW, -40 * DAY),
        practicedAt: at(NOW, -40 * DAY),
      }),
      'cm1.division-euclidienne': record({ elo: 900, attempts: 40 }),
      'cm1.nombres-decimaux': record({ elo: 1500, masteredAt: at(NOW, -DAY) }),
    };
    const sessions = [session([{ skill: 'cm1.division-euclidienne', correct: false }])];
    expect(profile({ mastery, sessions }).weaknesses).toEqual([
      { kind: 'fading', skill: 'cm1.perimetre', mastery: 69 },
      { kind: 'stuck', skill: 'cm1.division-euclidienne', mastery: 13, answers: 40 },
    ]);
  });
});

describe('strengths', () => {
  it('finds fast and accurate mental calculation', () => {
    const mental = Array.from({ length: 24 }, (_, i) => ({
      skill: 'ce2.tables-multiplication' as const,
      slot: 'automatism' as const,
      timeMs: MENTAL_FAST_MS - 1000,
      correct: i % 6 !== 0,
    }));
    expect(profile({ sessions: [session(mental)] }).strengths).toEqual([
      { kind: 'mental_speed', medianMs: MENTAL_FAST_MS - 1000, rate: 20 / 24 },
    ]);
    const slow = mental.map((attempt) => ({ ...attempt, timeMs: 7000 }));
    expect(profile({ sessions: [session(slow)] }).strengths).not.toContainEqual(
      expect.objectContaining({ kind: 'mental_speed' }),
    );
  });

  it('counts right answers in a row within a session', () => {
    const long = session(Array.from({ length: FLAWLESS_RUN }, () => ({})));
    expect(profile({ sessions: [long] }).strengths).toContainEqual({
      kind: 'flawless',
      run: FLAWLESS_RUN,
    });
    const split = [
      session(Array.from({ length: FLAWLESS_RUN - 5 }, () => ({}))),
      session(
        Array.from({ length: 10 }, () => ({})),
        { startedAt: at(NOW, -2 * DAY) },
      ),
    ];
    expect(profile({ sessions: split }).strengths).toEqual([]);
  });

  it('calls a strand solid with two skills of the year mastered', () => {
    const mastery = {
      'cm1.division-euclidienne': record({ elo: 1500, masteredAt: at(NOW, -DAY) }),
      'cm1.calcul-mental': record({ elo: 1500, masteredAt: at(NOW, -DAY) }),
      'cm1.perimetre': record({ elo: 1500, masteredAt: at(NOW, -DAY) }),
    };
    expect(profile({ mastery }).strengths).toEqual([
      { kind: 'solid', strand: 'calcul', mastered: 2 },
    ]);
  });

  it('falls back on the best strand of the moment, never on a weak one', () => {
    const practised = (skill: SkillCode) => Array.from({ length: 10 }, () => ({ skill }));
    const sessions = [
      session([...practised('cm1.perimetre'), ...practised('cm1.division-euclidienne')]),
    ];
    const mastery = {
      'cm1.perimetre': record({ elo: 1350 }),
      'cm1.division-euclidienne': record({ elo: 1100 }),
    };
    expect(profile({ mastery, sessions }).strengths).toEqual([
      { kind: 'best', strand: getSkill('cm1.perimetre').strand },
    ]);
    const weak = { ...mastery, 'cm1.perimetre': record({ elo: 1100 }) };
    expect(profile({ mastery: weak, sessions }).strengths).toEqual([]);
  });
});

describe('learning style', () => {
  const errors = (next: Partial<ProfileAttempt>) =>
    Array.from({ length: 12 }, () => [wrong(null), next]).flat();

  it('tells a child who guesses after an error from one who keeps trying', () => {
    const guess = profile({ sessions: [session(errors({ timeMs: RUSHED_MS - 800 }))] });
    expect(guess.style.afterError).toBe('guesses');
    const tries = profile({ sessions: [session(errors({}))] });
    expect(tries.style.afterError).toBe('perseveres');
    expect(profile({ sessions: [session([wrong(null), {}])] }).style.afterError).toBeNull();
  });

  it('sees a child leave sessions after an error', () => {
    const left = (day: number) =>
      session([{}, wrong(null)], { startedAt: at(NOW, -day * DAY), completedAt: null });
    const sessions = [session(errors({})), left(2), left(3), left(4)];
    expect(profile({ sessions }).style.afterError).toBe('gives_up');
  });

  it('measures the success of twin exercises', () => {
    const twins = Array.from({ length: 6 }, (_, i) => ({ twinOf: 0, correct: i < 3 }));
    expect(profile({ sessions: [session(twins)] }).style.twinSuccess).toBe(0.5);
    expect(profile({ sessions: [session(twins.slice(0, 4))] }).style.twinSuccess).toBeNull();
  });

  it('reads the time of day in the family’s time zone', () => {
    expect(localHour('2026-10-20T15:30:00Z', 'Europe/Paris')).toBe(17);
    expect(localHour('2026-12-20T15:30:00Z', 'Europe/Paris')).toBe(16);
    expect(localHour('2026-10-20T15:30:00Z', 'America/Martinique')).toBe(11);
    expect([7, 13, 18, 2].map(timeOfDay)).toEqual(['morning', 'afternoon', 'evening', 'evening']);
  });

  it('says nothing about attention or time of day from a single session', () => {
    const style = profile({ sessions: [session(Array.from({ length: 40 }, () => ({})))] }).style;
    expect(style.attention).toBeNull();
    expect(style.bestTime).toBeNull();
  });

  it('leaves the placement test out of the learning style', () => {
    const test = session(errors({ timeMs: 500 }), { kind: 'placement' });
    expect(profile({ sessions: [test] }).style.afterError).toBeNull();
  });
});

describe('summary for the coach', () => {
  const full: LearnerProfile = {
    grade: 'CM2',
    answers: 900,
    mastered: 14,
    inProgress: 3,
    strengths: [
      { kind: 'mental_speed', medianMs: 2840, rate: 0.91 },
      { kind: 'ahead', strand: 'fractions' },
      { kind: 'solid', strand: 'calcul', mastered: 3 },
      { kind: 'flawless', run: 34 },
    ],
    weaknesses: [
      { kind: 'error', error: 'area-perimeter', count: 6, lastSeenAt: NOW },
      { kind: 'error', error: 'forgot-carry', count: 3, lastSeenAt: NOW },
      { kind: 'behind', strand: 'mesures' },
      { kind: 'fading', skill: 'ce2.tables-multiplication', mastery: 70 },
      { kind: 'stuck', skill: 'cm1.division-euclidienne', mastery: 30, answers: 40 },
    ],
    style: {
      attention: { kind: 'drops', after: 10 },
      bestTime: 'evening',
      afterError: 'perseveres',
      twinSuccess: 0.8,
    },
    computedAt: NOW,
  };

  it('fits the profile and the universes in about 150 words', () => {
    const summary = profileSummary(full, ['Minecraft', 'Football', 'Pokémon']);
    expect(summary).toContain('Élève de CM2');
    expect(summary).toContain('calcul mental rapide (2,8 s par calcul, 91 % de réussite)');
    expect(summary).toContain('confond aire et périmètre (6 fois)');
    expect(summary).toContain('perd sa concentration après 10 minutes environ');
    expect(summary).toContain('plus efficace en fin de journée');
    expect(summary).toContain('Centres d’intérêt : Minecraft, Football, Pokémon.');
    expect(summary.split(/\s+/).length).toBeLessThanOrEqual(170);
  });

  it('says what is not known yet, and falls back on everyday examples', () => {
    const empty = profile({});
    expect(profileSummary(empty)).toBe(
      [
        'Élève de CM1, 0 compétences maîtrisées, 0 en cours.',
        'Points forts : encore à découvrir.',
        'À travailler : rien de particulier pour l’instant.',
        'Façon d’apprendre : encore à observer.',
        'Centres d’intérêt : non renseignés, prendre des exemples de la vie courante.',
      ].join('\n'),
    );
  });
});

/**
 * Phase 7b criterion (docs/specs.md): strengths and points to work on that make sense for three
 * simulated children, three weeks of daily sessions each, and nothing invented for a child
 * without particular habits.
 */
describe('three simulated children', () => {
  const FIRST_DAY = '2026-09-07T00:00:00.000Z';
  const levels = (grade: Grade, onGrade: number, earlier: number) => (skill: SkillCode) =>
    getSkill(skill).grade === grade ? onGrade : earlier;

  function profileOf(child: VirtualChild, seed = 3) {
    const { sessions, mastery, at } = simulateChild(child, { firstDay: FIRST_DAY, days: 21, seed });
    const result = learnerProfile({
      childGrade: child.grade,
      mastery,
      sessions,
      timeZone: 'UTC',
      at,
    });
    return { profile: result, summary: profileSummary(result, ['Minecraft']) };
  }
  const errorsOf = (profile: LearnerProfile) =>
    profile.weaknesses.flatMap((item) => (item.kind === 'error' ? [item.error] : []));
  const kindsOf = (profile: LearnerProfile) => profile.strengths.map((item) => item.kind);

  it('Inès, CM2, quick at mental calculation, mixes up area and perimeter', () => {
    const { profile, summary } = profileOf({
      grade: 'CM2',
      level: levels('CM2', 1500, 1700),
      mistakes: ['area-perimeter'],
      answerMs: (skill) => (getSkill(skill).automatism ? 3000 : 9000),
    });
    expect(profile.strengths[0]).toMatchObject({ kind: 'mental_speed' });
    expect(errorsOf(profile)[0]).toBe('area-perimeter');
    expect(errorsOf(profile)).not.toContain('forgot-carry');
    expect(profile.style).toMatchObject({
      attention: { kind: 'steady' },
      afterError: 'perseveres',
    });
    expect(summary).toContain('calcul mental rapide');
    expect(summary).toContain('confond aire et périmètre');
  });

  it('Hugo, CE2, forgets carries, tires mid-session and guesses after an error', () => {
    const { profile, summary } = profileOf({
      grade: 'CE2',
      level: levels('CE2', 1250, 1400),
      mistakes: ['forgot-carry'],
      fatigue: { after: 8, perMinute: 40 },
      afterError: 'guess',
      answerMs: () => 11_000,
    });
    expect(kindsOf(profile)).not.toContain('mental_speed');
    expect(kindsOf(profile)).not.toContain('flawless');
    expect(errorsOf(profile)[0]).toBe('forgot-carry');
    // Tired from the 8th minute: the 5-minute stretch where it shows depends on the draws.
    expect(profile.style.attention).toEqual({ kind: 'drops', after: expect.any(Number) });
    expect(
      profile.style.attention?.kind === 'drops' && profile.style.attention.after,
    ).toBeLessThanOrEqual(15);
    expect(profile.style.afterError).toBe('guesses');
    expect(profile.style.twinSuccess).toBeLessThan(0.5);
    expect(summary).toContain('oublie la retenue');
    expect(summary).toContain('répond vite au hasard après une erreur');
  });

  it('Adam, 6e, ahead in calculation, at his best in the morning, ignores priorities', () => {
    const { profile, summary } = profileOf({
      grade: '6e',
      level: levels('6e', 1650, 1850),
      mistakes: ['left-to-right'],
      placement: true,
      answerMs: () => 7000,
      hour: (day) => (day % 2 ? 8 : 17),
      timeBonus: { morning: 200 },
    });
    expect(profile.strengths).toContainEqual({ kind: 'ahead', strand: 'calcul' });
    expect(errorsOf(profile)[0]).toBe('left-to-right');
    expect(profile.weaknesses).not.toContainEqual(expect.objectContaining({ kind: 'behind' }));
    expect(profile.style).toMatchObject({ bestTime: 'morning', afterError: 'perseveres' });
    expect(summary).toContain('en avance en calcul');
    expect(summary).toContain('calcule de gauche à droite sans les priorités');
    expect(summary).toContain('plus efficace le matin');
  });

  it('Zoé, CM1, no particular habit: nothing invented', () => {
    const { profile } = profileOf({ grade: 'CM1', level: levels('CM1', 1400, 1600) });
    expect(errorsOf(profile)).toEqual([]);
    expect(kindsOf(profile)).not.toContain('mental_speed');
    expect(profile.style).toMatchObject({
      attention: { kind: 'steady' },
      bestTime: null,
      afterError: 'perseveres',
    });
  });
});
