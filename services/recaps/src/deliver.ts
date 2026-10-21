import {
  type Fetch,
  type Secrets,
  advise,
  readAdviceContext,
  usageRow,
} from '@math-genius/ai-gateway';
import {
  type MonthlyRecap,
  type Recap,
  type RecapAdvice,
  readAdvice,
  readRecap,
} from '@math-genius/shared';

import { adviceFacts, standardAdvice } from './advice';
import { type EmailLinks, monthlyEmail, weeklyEmail } from './email';
import { monthlyPdf } from './pdf/monthly';
import type { Mailer } from './resend';
import { type Storage, pdfPath } from './storage';
import { type RecapTexts, textsFor } from './texts';

/**
 * Delivering a recap (the recaps Edge Function, with the service key): the month's tips (the coach
 * with the parent's consent, else the standard ones), its PDF (Storage, attached to the email),
 * then one email per parent who wants it, each recorded so that none goes twice. The database
 * computed everything else (recap_delivery). Every step talks to the outside through `deps`, so
 * that it runs in tests without network.
 */

export type Recipient = { parentId: string; name: string; email: string; token: string };

export type RecapDelivery = {
  id: string;
  kind: 'weekly' | 'monthly';
  childId: string;
  familyId: string;
  language: string;
  timezone: string;
  content: Recap;
  advice: RecapAdvice | null;
  pdfPath: string | null;
  /** The learning profile's summary, with the parent's consent only. */
  summary: string | null;
  recipients: Recipient[];
};

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown) => (typeof value === 'string' ? value : '');

/** recap_delivery's answer; null if damaged. */
export function readDelivery(value: unknown): RecapDelivery | null {
  if (!isRow(value)) return null;
  const content = readRecap(value.content);
  const kind = value.kind === 'weekly' || value.kind === 'monthly' ? value.kind : null;
  if (!content || !kind || content.kind !== kind || !text(value.id)) return null;
  return {
    id: text(value.id),
    kind,
    childId: text(value.child_id),
    familyId: text(value.family_id),
    language: text(value.language) || 'fr',
    timezone: text(value.timezone) || 'Europe/Paris',
    content,
    advice: readAdvice(value.advice),
    pdfPath: typeof value.pdf_path === 'string' ? value.pdf_path : null,
    summary: typeof value.summary === 'string' && value.summary.trim() ? value.summary : null,
    recipients: (Array.isArray(value.recipients) ? value.recipients : []).flatMap((row) =>
      isRow(row) && text(row.email) && text(row.parent_id)
        ? [
            {
              parentId: text(row.parent_id),
              name: text(row.name),
              email: text(row.email),
              token: text(row.token),
            },
          ]
        : [],
    ),
  };
}

export type DeliveryStore = {
  save(recapId: string, change: { advice?: RecapAdvice; pdfPath?: string }): Promise<void>;
  emailResult(
    recapId: string,
    parentId: string,
    result: { id: string } | { error: string },
  ): Promise<void>;
  done(recapId: string, error: string | null): Promise<void>;
};

/** The coach's three tips from the month's facts; null when it gives none. */
export type Coach = (delivery: RecapDelivery, facts: string[]) => Promise<string[] | null>;

export type DeliveryDeps = {
  store: DeliveryStore;
  storage: Storage;
  /** Null without RESEND_API_KEY: no email, the notifications went out already. */
  mailer: Mailer | null;
  coach: Coach;
  /** Sender of the emails, e.g. « Math Genius <recaps@example.com> ». */
  from: string;
  /** The Edge Functions' address, for the unsubscribe links. */
  functionsUrl: string;
  /** The web app, for the email's button; none: the email says to open the app. */
  appUrl: string | null;
  now: () => Date;
};

/** The family's calendar day at `at`. */
export function localDate(at: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(at);
  } catch {
    return at.toISOString().slice(0, 10);
  }
}

const message = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** The month's tips: already written, from the coach, or the standard ones. */
export async function monthAdvice(
  delivery: RecapDelivery,
  recap: MonthlyRecap,
  texts: RecapTexts,
  deps: Pick<DeliveryDeps, 'store' | 'coach'>,
): Promise<RecapAdvice> {
  if (delivery.advice) return delivery.advice;
  // Without the parent's consent, nothing about the child goes to a model.
  const tips = delivery.summary
    ? await deps.coach(delivery, adviceFacts(recap, texts)).catch(() => null)
    : null;
  const advice: RecapAdvice = tips
    ? { source: 'ai', tips }
    : { source: 'standard', tips: standardAdvice(recap, texts) };
  await deps.store.save(delivery.id, { advice });
  return advice;
}

const renderPdf = (
  delivery: RecapDelivery,
  recap: MonthlyRecap,
  advice: RecapAdvice,
  texts: RecapTexts,
  now: Date,
) => monthlyPdf(recap, advice, texts, { created: now, today: localDate(now, delivery.timezone) });

async function storePdf(
  delivery: RecapDelivery,
  bytes: Uint8Array,
  deps: Pick<DeliveryDeps, 'store' | 'storage'>,
) {
  const path = pdfPath(delivery.familyId, delivery.childId, delivery.content.from);
  await deps.storage.upload(path, bytes);
  await deps.store.save(delivery.id, { pdfPath: path });
  return path;
}

function linksFor(
  delivery: RecapDelivery,
  recipient: Recipient,
  deps: Pick<DeliveryDeps, 'functionsUrl' | 'appUrl'>,
): EmailLinks {
  const unsubscribe = (kind: string) =>
    `${deps.functionsUrl.replace(/\/+$/, '')}/recaps?task=unsubscribe&kind=${kind}&token=${encodeURIComponent(recipient.token)}`;
  return {
    app: deps.appUrl
      ? `${deps.appUrl.replace(/\/+$/, '')}/parent/children/${delivery.childId}/progress`
      : null,
    unsubscribe: unsubscribe(delivery.kind),
    unsubscribeAll: unsubscribe('all'),
  };
}

export type DeliveryResult = { sent: number; failed: number; emails: boolean };

export async function deliverRecap(
  delivery: RecapDelivery,
  deps: DeliveryDeps,
): Promise<DeliveryResult> {
  const texts = textsFor(delivery.language);
  const recap = delivery.content;
  let advice: RecapAdvice | null = null;
  let pdf: Uint8Array | null = null;
  if (recap.kind === 'monthly') {
    advice = await monthAdvice(delivery, recap, texts, deps);
    pdf = renderPdf(delivery, recap, advice, texts, deps.now());
    // A PDF that could not be stored is written again when the parent downloads it.
    if (!delivery.pdfPath)
      await storePdf(delivery, pdf, deps).catch((error) => console.error('recap pdf', error));
  }
  if (!deps.mailer) {
    await deps.store.done(delivery.id, null);
    return { sent: 0, failed: 0, emails: false };
  }

  let sent = 0;
  const problems: string[] = [];
  for (const recipient of delivery.recipients) {
    const links = linksFor(delivery, recipient, deps);
    const email =
      recap.kind === 'weekly'
        ? weeklyEmail(recap, texts, links)
        : monthlyEmail(
            recap,
            advice ?? { source: 'standard', tips: standardAdvice(recap, texts) },
            texts,
            links,
          );
    try {
      const result = await deps.mailer({
        from: deps.from,
        to: recipient.email,
        ...email,
        unsubscribe: links.unsubscribe,
        attachments: pdf
          ? [{ filename: `recap-${recap.from.slice(0, 7)}.pdf`, content: pdf }]
          : undefined,
      });
      await deps.store.emailResult(delivery.id, recipient.parentId, result);
      sent += 1;
    } catch (error) {
      problems.push(message(error));
      await deps.store.emailResult(delivery.id, recipient.parentId, { error: message(error) });
    }
  }
  await deps.store.done(delivery.id, problems.length > 0 ? problems.join(' ; ') : null);
  return { sent, failed: problems.length, emails: true };
}

/** A signed link to the month's PDF, written now if it was not yet. */
export async function recapPdfLink(
  delivery: RecapDelivery,
  deps: Pick<DeliveryDeps, 'store' | 'storage' | 'coach' | 'now'>,
): Promise<string> {
  const recap = delivery.content;
  if (recap.kind !== 'monthly') throw new Error('not_monthly');
  const texts = textsFor(delivery.language);
  let path = delivery.pdfPath;
  if (!path) {
    const advice = await monthAdvice(delivery, recap, texts, deps);
    path = await storePdf(delivery, renderPdf(delivery, recap, advice, texts, deps.now()), deps);
  }
  return deps.storage.signedUrl(path);
}

/** What the email's unsubscribe link answers. */
export const unsubscribedText = (language: string, kind: string, done: boolean) => {
  const texts = textsFor(language).unsubscribed;
  if (!done) return texts.unknown;
  return kind === 'weekly' || kind === 'monthly' || kind === 'all' ? texts[kind] : texts.unknown;
};

/** PostgREST as the server: a path under /rest/v1 and its JSON body. */
export type ServerRpc = (name: string, body: Record<string, unknown>) => Promise<unknown>;

/** The coach of services/ai-gateway: its context and usage log in the database. */
export function gatewayCoach(rpc: ServerRpc, secrets: Secrets, fetcher: Fetch = fetch): Coach {
  return async (delivery, facts) => {
    const context = readAdviceContext(
      await rpc('advice_context', { p_child_id: delivery.childId }),
      secrets,
    );
    if (!context) return null;
    const result = await advise(
      { grade: context.grade, facts, summary: delivery.summary },
      context.settings,
      {
        logUsage: async (usage) =>
          void (await rpc('coach_log_usage', { p_usage: usageRow(usage, delivery.childId) })),
      },
      fetcher,
    );
    return result.ok ? result.tips : null;
  };
}
