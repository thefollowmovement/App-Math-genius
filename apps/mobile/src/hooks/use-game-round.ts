import {
  gradeResponse,
  liveMastery,
  planGameQuestion,
  recordAttempt,
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
  question: PlannedGameQuestion | null;
  /** When the question appeared, on the round's clock. */
  shownAt: number;
  serial: number;
  ended: boolean;
};

/** What the question shows on the scene: the answers to pick from, and the banner. */
function feedOf(next: PlannedGameQuestion | null, key: number, previous: SceneFeed): SceneFeed {
  if (!next) return { ...previous, key, labels: [], prompt: '' };
  const { question } = next;
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
        prompt: question.target,
      };
    case 'pair':
      return { ...previous, key, labels: [question.left, question.right], prompt: '' };
  }
}

/** The answer a pick stands for, graded by the engine. */
function responseOf(next: PlannedGameQuestion, index: number): ExerciseResponse | null {
  const { question } = next;
  if (question.kind === 'choices') return question.choices[index]?.response ?? null;
  if (question.kind === 'pair') return question.response;
  return null;
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
    const context = { ...current.context, mastery: liveMastery(current.context, current.attempts) };
    const next = planGameQuestion(context, current.asked, rules.question);
    current.asked += 1;
    current.question = next;
    current.shownAt = clock.get();
    feed.set(feedOf(next, current.asked, feed.get()));
    setPrompt(next ? feedOf(next, current.asked, EMPTY_FEED).prompt : null);
  }, [clock, feed, rules.question]);

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

  const answer = useCallback(
    (key: number, index: number) => {
      const current = live.current;
      const next = current?.question;
      if (!current || current.ended || !next || key !== current.asked) return;
      const response = responseOf(next, index);
      if (!response) return;
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
      const after = rules.onAnswer(state.current, { correct, timeMs });
      update(after);
      recordRoundAnswer(childId, current.id, stored, after.score);
      playSound(correct ? 'right' : 'wrong');
      if (correct) feel.right();
      else feel.wrong();
      current.serial += 1;
      feed.set({ ...feed.get(), verdict: { key, index, correct, serial: current.serial } });
      if (outOfHearts(after)) {
        end();
        return;
      }
      if (correct || !rules.retry) {
        // The same key until the next question: a late pick of this one is ignored.
        current.question = null;
        timer.current = setTimeout(ask, rules.nextDelayMs);
      }
    },
    [ask, childId, clock, end, feed, rules, update],
  );

  const onEvent = useCallback(
    (event: SceneEvent) => {
      if (!live.current || live.current.ended) return;
      switch (event.type) {
        case 'choice':
          answer(event.key, event.index);
          break;
        case 'pick':
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
    [answer, end, update],
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
        question: null,
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
