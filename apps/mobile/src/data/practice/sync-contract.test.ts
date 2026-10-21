import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { sessionPayload } from './sync-engine';
import type { StoredSession } from './practice-store';

// The keys sync_session reads, taken from the last migration that writes it.
const migrations = join(__dirname, '../../../../../supabase/migrations');
const sql =
  readdirSync(migrations)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => readFileSync(join(migrations, name), 'utf8'))
    .filter((text) => /function public\.sync_session\(/.test(text))
    .at(-1) ?? '';

function recordsetColumns(alias: string): string[] {
  const match = new RegExp(`\\) as ${alias} \\(([^)]*)\\)`, 's').exec(sql);
  return (match?.[1] ?? '')
    .split(',')
    .map((column) => column.trim().split(/\s+/)[0] ?? '')
    .filter(Boolean)
    .sort();
}

const session: StoredSession = {
  id: '00000000-0000-4000-8000-000000000001',
  childId: '00000000-0000-4000-8000-0000000000c1',
  kind: 'daily',
  localDate: '2026-10-15',
  grade: 'CM1',
  goal: { type: 'duration', minutes: 15 },
  startedAt: '2026-10-15T17:00:00.000Z',
  seed: 1,
  masteryAtStart: {},
  itemRatings: {},
  attempts: [
    {
      generatorId: 'cm1.nombres-decimaux',
      skill: 'cm1.nombres-decimaux',
      difficulty: 2,
      seed: 12,
      slot: 'current',
      twinOf: null,
      reminder: false,
      correct: true,
      hintUsed: false,
      timeMs: 5400,
      answeredAt: '2026-10-15T17:00:20.000Z',
      learnerElo: 1150,
      response: { type: 'numeric', text: '3,4' },
    },
  ],
  completedAt: '2026-10-15T17:16:00.000Z',
  synced: { attempts: 0, completed: false },
};

describe('sync_session contract', () => {
  const payload = sessionPayload(session);

  it('sends every field the server reads for an answer', () => {
    expect(Object.keys(payload.attempts[0] ?? {}).sort()).toEqual(recordsetColumns('a'));
  });

  it('sends every field the server reads for mastery', () => {
    expect(Object.keys(payload.mastery[0] ?? {}).sort()).toEqual(recordsetColumns('m'));
  });

  it('sends every session field the server reads', () => {
    const read = [...sql.matchAll(/p_session ->>? '([a-z_]+)'/g)].map((match) => match[1]);
    expect(read).toContain('game');
    for (const key of read) expect(payload).toHaveProperty(key ?? '');
    expect(payload.goal).toEqual({ type: 'duration', value: 15 });
    expect(payload.game).toBeNull();
  });

  it('sends a round with its game, score and stars, as the server reads them', () => {
    const round = sessionPayload({
      ...session,
      kind: 'game',
      goal: { type: 'duration', minutes: 2 },
      game: { id: 'vol-du-chaton', score: 640, stars: 2 },
    });
    const read = [...sql.matchAll(/p_session -> 'game' ->> '([a-z_]+)'/g)].map((match) => match[1]);
    expect(read.sort()).toEqual(['id', 'score', 'stars']);
    expect(round.game).toEqual({ id: 'vol-du-chaton', score: 640, stars: 2 });
    // A round moves the ratings, not the sessions in a row toward « maîtrisée ».
    expect(round.mastery[0]).toMatchObject({ sessions_streak: 0 });
  });
});
