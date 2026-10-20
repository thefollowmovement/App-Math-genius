import { getSkill } from '@math-genius/curriculum';

import {
  type MasteryRecord,
  applyAnswer,
  closeSession,
  decayedElo,
  isAcquired,
  masteryFromElo,
  masteryOf,
  masteryStatus,
  startingRecord,
} from './mastery';

const day = (n: number) => new Date(Date.UTC(2026, 9, 1 + n, 17)).toISOString();
const tables = getSkill('ce2.tables-multiplication');
const decimals = getSkill('cm1.nombres-decimaux');

function practise(record: MasteryRecord, answers: boolean[], at: string, item = 1400) {
  return answers.reduce((current, correct) => applyAnswer(current, { item, correct, at }), record);
}

describe('mastery', () => {
  it('starts earlier grades presumed known and the own grade low', () => {
    expect(masteryFromElo(startingRecord(tables, 'CM1').elo)).toBe(81);
    expect(masteryFromElo(startingRecord(decimals, 'CM1').elo)).toBe(44);
    expect(masteryFromElo(startingRecord(decimals, 'CE2').elo)).toBe(19);
    expect(masteryStatus(startingRecord(tables, 'CM1'), day(0))).toBe('to_discover');
  });

  it('maps ratings to 0–100', () => {
    expect(masteryFromElo(500)).toBe(0);
    expect(masteryFromElo(800)).toBe(0);
    expect(masteryFromElo(1440)).toBe(80);
    expect(masteryFromElo(2000)).toBe(100);
  });

  it('fades after two days without practice, by 200 points at most', () => {
    const record = { ...startingRecord(decimals, 'CM1'), elo: 1500, practicedAt: day(0) };
    expect(decayedElo(record, day(2))).toBe(1500);
    expect(decayedElo(record, day(7))).toBe(1480);
    expect(decayedElo(record, day(400))).toBe(1300);
    expect(decayedElo(startingRecord(decimals, 'CM1'), day(400))).toBe(1150);
  });

  it('goes from in progress to mastered after two sessions at 80 or more', () => {
    let record = practise(startingRecord(decimals, 'CM1'), Array(12).fill(true), day(0));
    expect(masteryStatus(record, day(0))).toBe('in_progress');
    expect(masteryOf(record, day(0))).toBeGreaterThanOrEqual(80);

    record = closeSession(record, day(0));
    expect(record.streak).toBe(1);
    expect(masteryStatus(record, day(0))).toBe('in_progress');

    record = closeSession(practise(record, [true, true], day(1)), day(1));
    expect(record.streak).toBe(2);
    expect(record.masteredAt).toBe(day(1));
    expect(masteryStatus(record, day(1))).toBe('mastered');
  });

  it('resets the streak after a session below 80', () => {
    let record = closeSession(
      practise(startingRecord(decimals, 'CM1'), Array(12).fill(true), day(0)),
      day(0),
    );
    record = closeSession(practise(record, Array(8).fill(false), day(1)), day(1));
    expect(record.streak).toBe(0);
    expect(record.masteredAt).toBeNull();
  });

  it('needs a review once a mastered skill fades', () => {
    const record: MasteryRecord = {
      elo: 1480,
      attempts: 30,
      streak: 2,
      masteredAt: day(0),
      practicedAt: day(0),
    };
    expect(masteryStatus(record, day(5))).toBe('mastered');
    expect(masteryStatus(record, day(30))).toBe('to_review');
    expect(masteryStatus(practise(record, Array(6).fill(true), day(30)), day(30))).toBe('mastered');
  });

  it('presumes earlier grades known until answers show otherwise', () => {
    const start = startingRecord(tables, 'CM1');
    expect(isAcquired(undefined, tables, 'CM1', day(0))).toBe(true);
    expect(isAcquired(undefined, decimals, 'CM1', day(0))).toBe(false);
    expect(isAcquired(practise(start, [false, false, false], day(0)), tables, 'CM1', day(0))).toBe(
      true,
    );
    expect(
      isAcquired(practise(start, [false, false, false, false], day(0)), tables, 'CM1', day(0)),
    ).toBe(false);
    const mastered = { ...start, attempts: 20, masteredAt: day(0), practicedAt: day(0) };
    expect(isAcquired(mastered, decimals, 'CM1', day(90))).toBe(true);
  });

  it('trusts the placement test once the child is placed', () => {
    const start = startingRecord(tables, 'CM1');
    // Two errors in the test: not acquired for a placed child, still presumed otherwise.
    const failed = practise(start, [false, false], day(0));
    expect(isAcquired(failed, tables, 'CM1', day(0))).toBe(true);
    expect(isAcquired(failed, tables, 'CM1', day(0), true)).toBe(false);
    // A skill the test could not reach is still presumed.
    expect(isAcquired(undefined, tables, 'CM1', day(0), true)).toBe(true);
    // Found acquired by the test: mastered before any practice, and it does not fade.
    const found = { ...start, masteredAt: day(0) };
    expect(isAcquired(found, tables, 'CM1', day(0), true)).toBe(true);
    expect(masteryStatus(found, day(60))).toBe('mastered');
  });
});
