import { type MonthlyRecap, type WeeklyRecap, readRecap } from '@math-genius/shared';
import {
  MONTHLY_RECAP_SAMPLE,
  WEEKLY_RECAP_SAMPLE,
} from '@math-genius/shared/src/testing/progress-samples';

import { adviceFacts, mostSkippedWeekday, standardAdvice } from './advice';
import { monthlyEmail, weeklyEmail } from './email';
import { shownMistake } from './examples';
import { dayList, duration, integer, longDay, ofMonth, percent, period } from './format';
import { fr } from './texts';

const month = readRecap(MONTHLY_RECAP_SAMPLE) as MonthlyRecap;
const week = readRecap(WEEKLY_RECAP_SAMPLE) as WeeklyRecap;
const LINKS = {
  app: 'https://app.example.fr/parent/children/c1/progress',
  unsubscribe: 'https://functions.example/recaps?task=unsubscribe&kind=monthly&token=t1',
  unsubscribeAll: 'https://functions.example/recaps?task=unsubscribe&kind=all&token=t1',
};
const plain = (text: string) => text.replace(/ /g, ' ');

describe('French formats', () => {
  it('writes days, periods, durations and rates', () => {
    expect(longDay('2026-09-01')).toBe('mardi 1er septembre');
    expect(period('2026-09-14', '2026-09-20')).toBe('du 14 au 20 septembre');
    expect(period('2026-09-28', '2026-10-04')).toBe('du 28 septembre au 4 octobre');
    expect(ofMonth('2026-10-01')).toBe('d’octobre');
    expect(ofMonth('2026-08-01')).toBe('d’août');
    expect(ofMonth('2026-09-01')).toBe('de septembre');
    expect(dayList(['2026-09-09', '2026-09-11', '2026-09-29'])).toBe(
      'mercredi 9, vendredi 11 et mardi 29',
    );
    expect(plain(duration(45))).toBe('45 min');
    expect(plain(duration(240))).toBe('4 h');
    expect(plain(duration(65))).toBe('1 h 05');
    expect(plain(percent(0.792))).toBe('79 %');
    expect(plain(integer(1050))).toBe('1 050');
  });
});

describe('the month’s tips', () => {
  it('stand in for the coach, from the month’s facts', () => {
    expect(mostSkippedWeekday(month)).toBe(5);
    expect(standardAdvice(month, fr).map(plain)).toEqual([
      'Les vendredis sont souvent sautés : fixez ce jour-là un moment précis pour la séance, par exemple juste après le goûter.',
      'Sur « Comparer et ranger des nombres décimaux », votre enfant compare les chiffres après la virgule comme des nombres entiers : refaites un exemple ensemble à voix haute, puis laissez-le en inventer un.',
      'Côté grandeurs et mesures, profitez du quotidien : mesurez des objets de la maison ou calculez la durée d’un trajet.',
    ]);
  });

  it('keep the rhythm when the month was regular, and celebrate without anything to fix', () => {
    const regular: MonthlyRecap = {
      ...month,
      done: 16,
      skippedDates: [{ date: '2026-09-29', started: false }],
      blocking: [],
      domains: [],
      programme: null,
    };
    expect(standardAdvice(regular, fr)).toEqual([
      fr.advice.keepRhythm,
      fr.advice.explain('Résoudre des situations simples de proportionnalité'),
      fr.advice.celebrate,
    ]);
    const behind: MonthlyRecap = {
      ...regular,
      programme: {
        ...(month.programme as NonNullable<MonthlyRecap['programme']>),
        position: 'behind',
      },
    };
    expect(plain(standardAdvice(behind, fr)[2] ?? '')).toContain(
      'Quelques bases de l’an dernier sont à revoir, comme « Connaître les tables',
    );
  });

  it('give the coach the facts, never the child’s name', () => {
    const facts = adviceFacts(month, fr);
    expect(facts).toContain(
      'Régularité : 13 jours faits sur 17 prévus ; jour le plus souvent sauté : le vendredi',
    );
    expect(facts).toContain('Réussite : 79 % de bonnes réponses ; temps total : 240 minutes');
    expect(facts).toContain('Nombres et calcul : maîtrise de 8 % à 54 %');
    expect(facts.join(' ')).not.toContain('Léa');
  });
});

describe('a real mistake', () => {
  it('is rebuilt by the engine from its generator, difficulty and seed', () => {
    expect(shownMistake(month.blocking[0] as MonthlyRecap['blocking'][number])).toEqual({
      prompt: 'Range ces nombres du plus petit au plus grand.',
      given: '4,5 < 4,8 < 4,35 < 4,42',
      expected: '4,35 < 4,42 < 4,5 < 4,8',
      mistake: 'compare les chiffres après la virgule comme des nombres entiers',
    });
    const point = month.blocking[1] as MonthlyRecap['blocking'][number];
    expect(shownMistake({ ...point, example: null })).toBeNull();
    expect(
      shownMistake({
        ...point,
        example: { ...(point.example as NonNullable<typeof point.example>), generatorId: 'gone' },
      }),
    ).toBeNull();
  });
});

describe('the emails', () => {
  it('sum the week up: verdict, days, figures, a skill learnt and a point to work on', () => {
    const email = weeklyEmail(week, fr, { ...LINKS, app: null });
    expect(email.subject).toBe('Récap de la semaine de Léa (du 14 au 20 septembre)');
    const text = plain(email.text);
    expect(text).toContain(
      'Ça va bien. Léa a fait 4 séances sur 5 prévues, avec 80 % de bonnes réponses.',
    );
    expect(text).toContain('Séances : 4 sur 5 prévues');
    expect(text).toContain('Série : 4 jours');
    expect(text).toContain('Compétence acquise : Lire, écrire et décomposer des nombres décimaux');
    expect(text).toContain(
      'Point à travailler : Comparer et ranger des nombres décimaux (4 erreurs sur 16 réponses)',
    );
    expect(text).toContain('Le détail est dans l’app, page Progrès.');
    const html = plain(email.html);
    // One dot a day, in the calendar's colors.
    expect(html.match(/border-radius:14px;background:#1E9E63;/g)).toHaveLength(4);
    expect(html.match(/border-radius:14px;background:#D63B3B;/g)).toHaveLength(1);
    expect(html).toContain('Énoncé :</span> Range ces nombres du plus petit au plus grand.');
  });

  it('sum the month up, with the dates done and skipped, mastery, badges, rewards and tips', () => {
    const advice = { source: 'ai' as const, tips: ['Un.', 'Deux.', 'Trois.'] };
    const email = monthlyEmail(month, advice, fr, LINKS);
    expect(email.subject).toBe('Récap de septembre de Léa');
    const text = plain(email.text);
    expect(text).toContain(
      'À surveiller. Quelques séances manquées : 13 jours faits sur 17 prévus. Quand Léa joue, la réussite est bonne (79 %).',
    );
    expect(text).toContain(
      'Jours faits : mardi 1er, mercredi 2, jeudi 3, vendredi 4, lundi 7, mardi 8, jeudi 10, samedi 12, lundi 14, mardi 15, mercredi 16, jeudi 17, mercredi 23, lundi 28 et mercredi 30.',
    );
    expect(text).toContain(
      'Jours sautés : mercredi 9 (commencée), vendredi 11, vendredi 18 et mardi 29.',
    );
    expect(text).toContain('8 jours off et 5 jours de vacances.');
    expect(text).toContain('- Nombres et calcul : de 8 % à 54 %');
    expect(text).toContain('Badges gagnés : Première mission, Bien parti');
    expect(text).toContain('Récompenses débloquées : Une sortie au cinéma');
    expect(text).toContain(
      '- Comparer et ranger des nombres décimaux : 17 erreurs sur 64 réponses',
    );
    expect(text).toContain('Dans le rythme du programme de CM1');
    expect(text).toContain('3 conseils pour octobre\n1. Un.\n2. Deux.\n3. Trois.');
    expect(text).toContain(`Voir les progrès dans l’app : ${LINKS.app}`);
    expect(email.html).toContain(fr.monthly.adviceSource.ai);
    expect(email.html).not.toContain('undefined');
  });

  it('always carry the unsubscribe links, and escape what they show', () => {
    const named = { ...week, child: { ...week.child, name: 'Léa <b>&</b>' } };
    const email = weeklyEmail(named, fr, LINKS);
    expect(email.html).toContain('Léa &lt;b&gt;&amp;&lt;/b&gt;');
    expect(email.html).not.toContain('<b>&</b>');
    expect(email.html).toContain(`href="${LINKS.unsubscribe.replace(/&/g, '&amp;')}"`);
    expect(email.html).toContain(`href="${LINKS.unsubscribeAll.replace(/&/g, '&amp;')}"`);
    expect(email.text).toContain(LINKS.unsubscribe);
  });

  it('word the verdict for a week without a routine, an inactive week, and difficulties', () => {
    const sentence = (verdict: Partial<WeeklyRecap['verdict']>) =>
      plain(fr.verdict.sentence('Léa', { ...week.verdict, ...verdict }, 'week'));
    expect(sentence({ planned: 0, active: 2, success: null })).toBe(
      'Léa a fait 2 jours d’exercices.',
    );
    expect(sentence({ planned: 5, done: 0, active: 0, level: 'alert' })).toBe(
      'Léa n’a fait aucune des 5 séances prévues cette semaine : un petit coup de pouce aidera à reprendre.',
    );
    expect(sentence({ struggling: true, success: 0.55 })).toBe(
      'La régularité est là (4 séances sur 5 prévues), mais la réussite baisse : 55 %. Les points de blocage disent où aider.',
    );
    expect(sentence({ level: 'none' })).toBe('Pas encore de séance pour Léa cette semaine.');
  });
});
