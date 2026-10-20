import type { ErrorTypeCode, SkillCode } from '@math-genius/curriculum';
import type { Grade } from '@math-genius/shared';

import type { MasteryMap } from '../adaptive/mastery';
import {
  type PlannerContext,
  buildExercise,
  finishSession,
  planNext,
  recordAttempt,
} from '../adaptive/planner';
import {
  type ProfileAttempt,
  type ProfileSession,
  type TimeOfDay,
  timeOfDay,
} from '../adaptive/profile';
import { DIFFICULTY_RATINGS, expectedSuccess } from '../adaptive/ratings';
import { type SessionAttempt, sessionProgress } from '../adaptive/session';
import { diagnoseResponse, mistakeList } from '../diagnose';
import { createRng, type Rng } from '../random';
import type { Learner } from './learner';
import { responseWith } from './responses';

const DAY_MS = 86_400_000;
/** Reading the exercise and the correction, on top of the answer time. */
const OVERHEAD_MS = 6000;

/**
 * A virtual child for the learning profile: a level per skill, like `Learner`, and the habits
 * the profile should find (docs/specs.md, Profil d'apprentissage : 3 profils simulés).
 */
export type VirtualChild = {
  grade: Grade;
  level: Learner;
  /** Misconceptions: on an exercise that can show them, the child fails more, this way. */
  mistakes?: readonly ErrorTypeCode[];
  /** Time of a usual answer. */
  answerMs?: (skill: SkillCode) => number;
  /** Tiredness: rating points lost per active minute past `after` minutes. */
  fatigue?: { after: number; perMinute: number };
  /** Hour (UTC) of each day's session. */
  hour?: (day: number) => number;
  /** Rating points gained or lost depending on the time of day. */
  timeBonus?: Partial<Record<TimeOfDay, number>>;
  /** After an error: answers the next exercise at once, at random; or now and then leaves. */
  afterError?: 'guess' | 'leave';
  /** Takes the placement test before the first session. */
  placement?: boolean;
};

type Played = { session: ProfileSession; mastery: MasteryMap };

function play(
  child: VirtualChild,
  context: PlannerContext,
  rng: Rng,
  stop: (attempts: readonly SessionAttempt[]) => boolean,
): Played {
  const attempts: SessionAttempt[] = [];
  const answers: ProfileAttempt[] = [];
  const hour = new Date(context.startedAt).getUTCHours();
  let clock = Date.parse(context.startedAt);
  let left = false;
  for (;;) {
    const planned = planNext(context, attempts);
    if (!planned) break;
    const exercise = buildExercise(planned);
    const minute = (clock - Date.parse(context.startedAt)) / 60_000;
    const tired = child.fatigue ? Math.max(0, minute - child.fatigue.after) : 0;
    const level =
      child.level(planned.skill) -
      tired * (child.fatigue?.perMinute ?? 0) +
      (child.timeBonus?.[timeOfDay(hour)] ?? 0);
    const typical = mistakeList(exercise).filter((m) => child.mistakes?.includes(m.error));
    const rushed = child.afterError === 'guess' && answers.at(-1)?.correct === false;
    let chance = expectedSuccess(level, DIFFICULTY_RATINGS[planned.difficulty]);
    if (typical.length > 0) chance *= 0.7;
    if (rushed) chance *= 0.3;
    const correct = rng.chance(chance);
    const mistake = typical[rng.int(0, typical.length - 1)];
    const error =
      !correct && mistake && rng.chance(0.85)
        ? diagnoseResponse(exercise, responseWith(exercise, mistake.answer))
        : null;
    const base = child.answerMs?.(planned.skill) ?? 9000;
    const timeMs = rushed ? 1000 : Math.round(base * (0.8 + 0.4 * rng.next()));
    clock += timeMs + OVERHEAD_MS;
    const answeredAt = new Date(clock).toISOString();
    const attempt = recordAttempt(context, attempts, planned, {
      correct,
      hintUsed: false,
      timeMs,
      answeredAt,
    });
    attempts.push(attempt);
    answers.push({ ...attempt, error });
    if (!correct && child.afterError === 'leave' && rng.chance(0.12)) {
      left = true;
      break;
    }
    if (stop(attempts)) break;
  }
  const end = attempts.at(-1)?.answeredAt ?? context.startedAt;
  const completed = !left && attempts.length > 0;
  return {
    session: {
      kind: context.placement ? 'placement' : 'daily',
      grade: context.childGrade,
      startedAt: context.startedAt,
      completedAt: completed ? end : null,
      attempts: answers,
    },
    mastery: finishSession(context, attempts, { at: end, completed }),
  };
}

/** A daily 15-minute session for `days` days (after the placement test, if the child takes it). */
export function simulateChild(
  child: VirtualChild,
  options: { firstDay: string; days: number; seed: number },
) {
  const rng = createRng(options.seed ^ 0x5bd1e995);
  const sessions: ProfileSession[] = [];
  let mastery: MasteryMap = {};
  const start = (day: number) => {
    const date = new Date(Date.parse(options.firstDay) + day * DAY_MS);
    date.setUTCHours(child.hour?.(day) ?? 17, 0, 0, 0);
    return date.toISOString();
  };
  const context = (day: number, extra: Partial<PlannerContext> = {}): PlannerContext => ({
    childGrade: child.grade,
    mastery,
    itemRatings: {},
    startedAt: start(day),
    seed: options.seed * 1000 + day,
    placed: child.placement,
    ...extra,
  });
  if (child.placement) {
    // The day before the first session.
    const test = play(child, context(-1, { placement: true, placed: false }), rng, () => false);
    sessions.push(test.session);
    mastery = test.mastery;
  }
  for (let day = 0; day < options.days; day++) {
    const today = context(day);
    const goal = { type: 'duration', minutes: 15 } as const;
    const played = play(
      child,
      today,
      rng,
      (attempts) => sessionProgress(goal, today.startedAt, attempts).finished,
    );
    sessions.push(played.session);
    mastery = played.mastery;
  }
  return {
    sessions,
    mastery,
    at: new Date(Date.parse(start(options.days)) - 12 * 3_600_000).toISOString(),
  };
}
