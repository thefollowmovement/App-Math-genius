import {
  gradeResponse,
  liveMastery,
  planGameQuestion,
  recordAttempt,
  sumResponse,
  type ExerciseResponse,
  type PlannedGameQuestion,
  type PlannerContext,
} from '@math-genius/exercise-engine';
import type { Grade } from '@math-genius/shared';
import * as Crypto from 'expo-crypto';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import {
  finishRound,
  openRound,
  plannerContext,
  recordRoundAnswer,
  type StoredAttempt,
} from '@/data/practice/practice-store';
import { syncNow } from '@/data/practice/sync';
import { feel, playSound } from '@/games/kit/feedback';
import {
  EMPTY_FEED,
  NO_INPUT,
  type SceneEvent,
  type SceneFeed,
  type SceneInput,
} from '@/games/kit/scene';
import {
  addPoints,
  hurt,
  outOfHearts,
  type GameResult,
  type GameRules,
  type RoundState,
} from '@/games/round';
import { strings } from '@/i18n';

/** ready: the rules and « JOUER »; playing; paused; over: the end of the round. */
export type RoundPhase = 'ready' | 'playing' | 'paused' | 'over';

export type RoundOutcome = GameResult & {
  roundId: string;
  record: boolean;
  right: number;
  answered: number;
};

type Live = {
  id: string;
  context: PlannerContext;
  attempts: StoredAttempt[];
  /** Questions asked so far: the next one's index. */
  asked: number;
  /** The question on screen, or the board of pairs (Memory). */
  questions: PlannedGameQuestion[];
  /** Pairs of the board already answered: one answer each. */
  answered: Set<number>;
  matched: number;
  /** When the question appeared (or the last answer), on the round's clock. */
  shownAt: number;
  serial: number;
  ended: boolean;
};

const isBoard = (questions: readonly PlannedGameQuestion[]) =>
  questions.length > 1 || questions[0]?.question.kind === 'pair';

/** What the question shows on the scene: the answers to pick from, and the banner. */
function feedOf(
  questions: readonly PlannedGameQuestion[],
  key: number,
  previous: SceneFeed,
): SceneFeed {
  const [first] = questions;
  if (!first) return { ...previous, key, labels: [], prompt: '' };
  if (isBoard(questions)) {
    // Each pair's calculation, then its result: label 2 × n and 2 × n + 1.
    const labels = questions.flatMap(({ question }) =>
      question.kind === 'pair' ? [question.left, question.right] : [],
    );
    return { ...previous, key, labels, prompt: strings.games.play.pairs };
  }
  const { question } = first;
  switch (question.kind) {
    case 'choices':
      return {
        ...previous,
        key,
        labels: question.choices.map((choice) => choice.label),
        prompt: question.prompt,
      };
    case 'sum':
      return {
        ...previous,
        key,
        labels: question.numbers.map((number) => number.label),
        prompt: strings.games.play.target(question.target, question.operator),
      };
    case 'pair':
      return { ...previous, key, labels: [question.left, question.right], prompt: '' };
  }
}

/**
 * A board of pairs never shows the same card twice: two « 12 » would make two right pairings for
 * one calculation.
 */
function boardOf(
  plan: (index: number) => PlannedGameQuestion | null,
  from: number,
  size: number,
): PlannedGameQuestion[] {
  const board: PlannedGameQuestion[] = [];
  const seen = new Set<string>();
  for (let index = from; index < from + size * 3 && board.length < size; index++) {
    const next = plan(index);
    if (!next || next.question.kind !== 'pair') continue;
    const { left, right } = next.question;
    if (seen.has(left) || seen.has(right)) continue;
    seen.add(left);
    seen.add(right);
    board.push(next);
  }
  return board;
}

/**
 * A round of a mini-game: the engine asks the questions (the skills a session would draw from, at
 * the child's level) and grades every pick; each answer is saved on the device at once, and moves
 * the child's ratings like a session's. The scene only shows: it tells what was picked, the round
 * tells it what that was worth.
 */
export function useGameRound({
  childId,
  grade,
  rules,
  bestScore,
}: {
  childId: string;
  grade: Grade;
  rules: GameRules;
  bestScore: number | null;
}) {
  const [phase, setPhase] = useState<RoundPhase>('ready');
  const [round, setRound] = useState<RoundState>(() => rules.start());
  const [prompt, setPrompt] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null);
  const feed = useSharedValue<SceneFeed>(EMPTY_FEED);
  const input = useSharedValue<SceneInput>(NO_INPUT);
  const clock = useSharedValue(0);
  const live = useRef<Live | null>(null);
  const state = useRef(round);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [seed, setSeed] = useState(1);
  const [limitMs, setLimitMs] = useState(rules.seconds * 1000);

  const update = useCallback((next: RoundState) => {
    state.current = next;
    setRound(next);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const ask = useCallback(() => {
    const current = live.current;
    if (!current || current.ended) return;
    const plan = (index: number) =>
      planGameQuestion(
        { ...current.context, mastery: liveMastery(current.context, current.attempts) },
        index,
        rules.question,
      );
    const size = rules.board ?? 1;
    const questions =
      size > 1
        ? boardOf(plan, current.asked, size)
        : [plan(current.asked)].filter((next): next is PlannedGameQuestion => next !== null);
    current.asked += size > 1 ? size * 3 : 1;
    current.questions = questions;
    current.answered = new Set();
    current.matched = 0;
    current.shownAt = clock.get();
    const next = feedOf(questions, current.asked, feed.get());
    feed.set(next);
    setPrompt(questions.length > 0 ? next.prompt : null);
  }, [clock, feed, rules.board, rules.question]);

  const end = useCallback(() => {
    const current = live.current;
    if (!current || current.ended) return;
    current.ended = true;
    if (timer.current) clearTimeout(timer.current);
    const result = rules.onEnd(state.current);
    finishRound(childId, current.id, new Date().toISOString(), { id: rules.id, ...result });
    void syncNow();
    playSound('win');
    setOutcome({
      ...result,
      roundId: current.id,
      record: result.score > 0 && result.score > (bestScore ?? 0),
      right: state.current.right,
      answered: state.current.answered,
    });
    setPhase('over');
  }, [bestScore, childId, rules]);

  /** Records an answer to the question at `position`, graded by the engine; returns the verdict. */
  const record = useCallback(
    (position: number, response: ExerciseResponse): boolean | null => {
      const current = live.current;
      const next = current?.questions[position];
      if (!current || !next) return null;
      const correct = gradeResponse(next.question.exercise, response).correct;
      const timeMs = Math.max(0, Math.round(clock.get() - current.shownAt));
      const attempt = recordAttempt(current.context, current.attempts, next.planned, {
        correct,
        hintUsed: false,
        timeMs,
        answeredAt: new Date().toISOString(),
      });
      const stored: StoredAttempt = { ...attempt, response };
      current.attempts = [...current.attempts, stored];
      current.answered.add(position);
      current.shownAt = clock.get();
      const after = rules.onAnswer(state.current, { correct, timeMs });
      update(after);
      recordRoundAnswer(childId, current.id, stored, after.score);
      playSound(correct ? 'right' : 'wrong');
      if (correct) feel.right();
      else feel.wrong();
      return correct;
    },
    [childId, clock, rules, update],
  );

  /** Tells the scene, then moves on (or ends the round at the last heart). */
  const settle = useCallback(
    (key: number, indexes: number[], correct: boolean, moveOn: boolean) => {
      const current = live.current;
      if (!current) return;
      current.serial += 1;
      feed.set({
        ...feed.get(),
        verdict: { key, index: indexes[0] ?? 0, indexes, correct, serial: current.serial },
      });
      if (outOfHearts(state.current)) {
        end();
        return;
      }
      if (moveOn) {
        // The same key until the next question: a late pick of this one is ignored.
        current.questions = [];
        timer.current = setTimeout(ask, rules.nextDelayMs);
      }
    },
    [ask, end, feed, rules.nextDelayMs],
  );

  const choose = useCallback(
    (key: number, index: number) => {
      const current = live.current;
      const next = current?.questions[0];
      if (!current || current.ended || !next || key !== current.asked) return;
      if (next.question.kind !== 'choices') return;
      const response = next.question.choices[index]?.response;
      if (!response) return;
      const correct = record(0, response);
      if (correct === null) return;
      settle(key, [index], correct, correct || !rules.retry);
    },
    [record, rules.retry, settle],
  );

  const pick = useCallback(
    (key: number, indexes: number[], known: boolean) => {
      const current = live.current;
      const [first] = current?.questions ?? [];
      if (!current || current.ended || !first || key !== current.asked) return;
      const [a, b] = indexes;
      if (a === undefined || b === undefined || a === b) return;

      // Two bubbles: their sum (or product) is the answer.
      if (!isBoard(current.questions) && first.question.kind === 'sum') {
        const { numbers } = first.question;
        const values = [numbers[a]?.value, numbers[b]?.value].filter(
          (value): value is NonNullable<typeof value> => value !== undefined,
        );
        if (values.length !== 2) return;
        const correct = record(0, sumResponse(first.question, values));
        if (correct === null) return;
        settle(key, indexes, correct, correct || !rules.retry);
        return;
      }

      // Two cards of a board: card 2 × n is pair n's calculation, 2 × n + 1 its result.
      const pairA = Math.floor(a / 2);
      const pairB = Math.floor(b / 2);
      if (pairA === pairB) {
        const pair = current.questions[pairA]?.question;
        if (pair?.kind === 'pair' && !current.answered.has(pairA)) record(pairA, pair.response);
        else playSound('right');
        current.matched += 1;
        if (current.matched >= current.questions.length) {
          update(addPoints(state.current, rules.boardBonus ?? 0));
        }
        settle(key, indexes, true, current.matched >= current.questions.length);
        return;
      }
      // A slip of memory is not a mistake in maths: only cards the child had seen both count.
      const calculation = [a, b].find((index) => index % 2 === 0);
      const result = [a, b].find((index) => index % 2 === 1);
      if (known && calculation !== undefined && result !== undefined) {
        const position = Math.floor(calculation / 2);
        const other = current.questions[Math.floor(result / 2)]?.question;
        if (other?.kind === 'pair' && !current.answered.has(position)) {
          record(position, other.response);
        }
      }
      settle(key, indexes, false, false);
    },
    [record, rules.boardBonus, rules.retry, settle, update],
  );

  const onEvent = useCallback(
    (event: SceneEvent) => {
      if (!live.current || live.current.ended) return;
      switch (event.type) {
        case 'choice':
          choose(event.key, event.index);
          break;
        case 'pick':
          pick(event.key, event.indexes, event.known === true);
          break;
        case 'points':
          update(addPoints(state.current, event.points));
          break;
        case 'hurt': {
          const after = hurt(state.current);
          update(after);
          feel.bump();
          if (outOfHearts(after)) end();
          break;
        }
        case 'sound':
          playSound(event.sound);
          break;
        case 'time':
          end();
          break;
      }
    },
    [choose, end, pick, update],
  );

  /** A new round, as long as `limitS` (the game's length, or today's time left). */
  const start = useCallback(
    (limitS: number) => {
      const stored = openRound({
        childId,
        grade,
        game: rules.id,
        minutes: Math.max(1, Math.ceil(limitS / 60)),
        now: new Date(),
        id: Crypto.randomUUID(),
        seed: Math.floor(Math.random() * 2 ** 31),
      });
      live.current = {
        id: stored.id,
        context: plannerContext(stored),
        attempts: [],
        asked: 0,
        questions: [],
        answered: new Set(),
        matched: 0,
        shownAt: 0,
        serial: 0,
        ended: false,
      };
      clock.set(0);
      input.set(NO_INPUT);
      feed.set(EMPTY_FEED);
      update(rules.start());
      setOutcome(null);
      setSeed(stored.seed);
      setLimitMs(limitS * 1000);
      ask();
      setPhase('playing');
    },
    [ask, childId, clock, feed, grade, input, rules, update],
  );

  // Leaving the screen mid-round ends the round with what it has.
  useEffect(
    () => () => {
      if (live.current && !live.current.ended) end();
    },
    [end],
  );

  /** « Pêcher ! » and other buttons: a tap, counted on the UI thread like a touch. */
  const tap = useCallback(() => {
    input.modify((value) => {
      'worklet';
      return { ...value, taps: value.taps + 1 };
    });
  }, [input]);

  return {
    phase,
    round,
    prompt,
    outcome,
    feed,
    input,
    clock,
    seed,
    limitMs,
    start,
    pause: () => phase === 'playing' && setPhase('paused'),
    resume: () => phase === 'paused' && setPhase('playing'),
    quit: end,
    tap,
    onEvent,
  };
}
