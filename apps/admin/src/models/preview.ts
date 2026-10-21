import type { Explanation } from '@math-genius/exercise-engine';

import { readExplanation } from './coach';

export type PreviewView =
  | { kind: 'refused-request'; reason: string }
  | {
      kind: 'done';
      exercise: string;
      given: string;
      solution: string;
      raw: string | null;
      /** Shown to a child, numbers checked; null when refused or failed. */
      shown: Explanation | null;
      problems: string[];
      tokens: number;
      latencyMs: number;
    };

const record = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown) => (typeof value === 'string' ? value : '');
const count = (value: unknown) => (typeof value === 'number' ? value : 0);

/** The gateway's answer to a prompt test. */
export function previewView(value: unknown): PreviewView {
  const answer = record(value);
  if (answer.ok !== true) return { kind: 'refused-request', reason: text(answer.reason) };
  const generated = record(answer.generated);
  const usage = record(generated.usage);
  const problems = Array.isArray(generated.problems)
    ? generated.problems.filter((item): item is string => typeof item === 'string')
    : [];
  return {
    kind: 'done',
    exercise: text(answer.exercise),
    given: text(answer.given),
    solution: text(answer.solution),
    raw: typeof generated.raw === 'string' ? generated.raw : null,
    shown: generated.ok === true ? readExplanation(generated.rendered) : null,
    problems,
    tokens: count(usage.tokensIn) + count(usage.tokensOut),
    latencyMs: Math.round(count(usage.latencyMs)),
  };
}

/** The next version of a prompt. */
export const nextVersion = (versions: readonly { version: number }[]) =>
  Math.max(0, ...versions.map((item) => item.version)) + 1;
