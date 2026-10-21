/**
 * The models the gateway calls (docs/specs.md, Choix du modèle IA): the Mistral API, or a server of
 * our own (Ollama, llama.cpp, vLLM). All speak the same chat API, compatible with OpenAI's:
 * changing provider is changing a URL in the back-office.
 */

export type ProviderKind = 'mistral' | 'openai-compatible';

export type Provider = {
  kind: ProviderKind;
  /** Base URL, without /v1 (Mistral: https://api.mistral.ai). */
  baseUrl: string;
  model: string;
  /** None for a server of our own on the local network. */
  apiKey?: string;
  /** Dollars per million tokens, to keep the budget; 0 on our own server. */
  price: { input: number; output: number };
};

export const MISTRAL_URL = 'https://api.mistral.ai';

export type Fetch = (url: string, init: RequestInit) => Promise<Response>;

export type ChatRequest = {
  system: string;
  user: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
};

export type ChatResult = { text: string; tokensIn: number; tokensOut: number; latencyMs: number };

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly latencyMs: number,
  ) {
    super(message);
  }
}

type ChatResponse = {
  choices?: { message?: { content?: unknown } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

const headers = (provider: Provider) => ({
  'Content-Type': 'application/json',
  ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
});

const endpoint = (provider: Provider, path: string) =>
  `${provider.baseUrl.replace(/\/+$/, '').replace(/\/v1$/, '')}/v1/${path}`;

/** One chat completion, answered as JSON. */
export async function chat(
  provider: Provider,
  request: ChatRequest,
  fetcher: Fetch = fetch,
  now: () => number = Date.now,
): Promise<ChatResult> {
  const started = now();
  let response: Response;
  try {
    response = await fetcher(endpoint(provider, 'chat/completions'), {
      method: 'POST',
      headers: headers(provider),
      body: JSON.stringify({
        model: provider.model,
        messages: [
          { role: 'system', content: request.system },
          { role: 'user', content: request.user },
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(request.timeoutMs),
    });
  } catch (error) {
    throw new ProviderError(
      error instanceof Error ? error.message : 'unreachable',
      now() - started,
    );
  }
  const latencyMs = now() - started;
  if (!response.ok) throw new ProviderError(`HTTP ${response.status}`, latencyMs);
  const body = (await response.json()) as ChatResponse;
  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new ProviderError('empty answer', latencyMs);
  return {
    text: content,
    tokensIn: body.usage?.prompt_tokens ?? 0,
    tokensOut: body.usage?.completion_tokens ?? 0,
    latencyMs,
  };
}

type ModerationResponse = { results?: { categories?: Record<string, boolean> }[] };

/**
 * Mistral's moderation model (free on its price list): the categories it flags, none when the text
 * is fine. Only the Mistral API has it.
 */
export async function moderate(
  provider: Provider,
  text: string,
  fetcher: Fetch = fetch,
  timeoutMs = 5000,
): Promise<string[]> {
  const response = await fetcher(endpoint(provider, 'moderations'), {
    method: 'POST',
    headers: headers(provider),
    body: JSON.stringify({ model: 'mistral-moderation-latest', input: [text] }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new ProviderError(`moderation HTTP ${response.status}`, 0);
  const body = (await response.json()) as ModerationResponse;
  const categories = body.results?.[0]?.categories ?? {};
  return Object.entries(categories)
    .filter(([, flagged]) => flagged)
    .map(([category]) => category);
}

/** What a call cost, in dollars. */
export const callCost = (provider: Provider, tokensIn: number, tokensOut: number) =>
  (tokensIn * provider.price.input + tokensOut * provider.price.output) / 1_000_000;
