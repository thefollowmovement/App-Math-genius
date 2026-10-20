import { getSkill } from '@math-genius/curriculum';

import { learnerProfile } from './adaptive/profile';
import { profileFromInput } from './server';
import { simulateChild } from './testing/child';

/** Postgres's way of writing a timestamptz in JSON. */
const postgres = (iso: string | null) => iso && iso.replace('Z', '+00:00').replace('.000', '');

describe('learning profile on the server', () => {
  const child = simulateChild(
    {
      grade: 'CM2',
      level: (skill) => (getSkill(skill).grade === 'CM2' ? 1500 : 1700),
      mistakes: ['area-perimeter'],
      answerMs: (skill) => (getSkill(skill).automatism ? 3000 : 9000),
    },
    { firstDay: '2026-09-07T00:00:00.000Z', days: 8, seed: 5 },
  );

  // What profile_input returns for this child (supabase/migrations/*_personalization.sql).
  const input = {
    child: { id: 'c1', grade: 'CM2', timezone: 'UTC' },
    sessions: child.sessions.map((session, index) => ({
      id: `s${index}`,
      kind: session.kind,
      grade: session.grade,
      started_at: postgres(session.startedAt),
      completed_at: postgres(session.completedAt),
      attempts: session.attempts.map((attempt, position) => ({
        position,
        skill_code: attempt.skill,
        generator_id: attempt.generatorId,
        difficulty: attempt.difficulty,
        slot: attempt.slot,
        twin_of: attempt.twinOf,
        correct: attempt.correct,
        error_type: attempt.error,
        time_ms: attempt.timeMs,
        answered_at: postgres(attempt.answeredAt),
        learner_elo: attempt.learnerElo,
      })),
    })),
    mastery: Object.entries(child.mastery).map(([code, record]) => ({
      skill_code: code,
      elo: record?.elo,
      attempts_count: record?.attempts,
      sessions_streak: record?.streak,
      mastered_at: postgres(record?.masteredAt ?? null),
      last_practiced_at: postgres(record?.practicedAt ?? null),
    })),
    item_ratings: [],
    interests: ['Minecraft', 'Foot'],
  };

  it('reads what the database gathers as the engine expects it', () => {
    const computed = profileFromInput(input, child.at);
    const direct = learnerProfile({
      childGrade: 'CM2',
      mastery: child.mastery,
      sessions: child.sessions,
      timeZone: 'UTC',
      at: child.at,
    });
    expect(computed?.profile).toEqual(direct);
    expect(computed?.summary).toContain('Centres d’intérêt : Minecraft, Foot.');
  });

  it('leaves out what this version of the engine does not know', () => {
    const odd = {
      ...input,
      child: { ...input.child, timezone: 'Mars/Olympus' },
      sessions: input.sessions.map((session) => ({
        ...session,
        attempts: [
          ...session.attempts,
          { ...session.attempts[0], skill_code: 'cm2.retired-skill', error_type: 'new-code' },
        ],
      })),
      mastery: [...input.mastery, { skill_code: 'cm2.retired-skill', elo: 1200 }],
    };
    expect(profileFromInput(odd, child.at)?.profile).toEqual(
      profileFromInput(input, child.at)?.profile,
    );
  });

  it('computes nothing without a child (no consent)', () => {
    expect(profileFromInput(null, child.at)).toBeNull();
    expect(profileFromInput({ child: { grade: 'Terminale' } }, child.at)).toBeNull();
  });
});
