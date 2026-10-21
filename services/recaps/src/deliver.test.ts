import type { Fetch } from '@math-genius/ai-gateway';
import type { RecapAdvice } from '@math-genius/shared';
import {
  MONTHLY_RECAP_SAMPLE,
  WEEKLY_RECAP_SAMPLE,
} from '@math-genius/shared/src/testing/progress-samples';

import {
  type Coach,
  type DeliveryDeps,
  type RecapDelivery,
  deliverRecap,
  gatewayCoach,
  localDate,
  readDelivery,
  recapPdfLink,
  unsubscribedText,
} from './deliver';
import type { OutgoingEmail } from './resend';
import { resendMailer, toBase64 } from './resend';
import { pdfPath, supabaseStorage } from './storage';

const delivery = (fields: Record<string, unknown> = {}) =>
  readDelivery({
    id: 'r1',
    kind: 'monthly',
    child_id: 'c1',
    family_id: 'f1',
    grade: 'CM1',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    language: 'fr',
    timezone: 'Europe/Paris',
    content: MONTHLY_RECAP_SAMPLE,
    advice: null,
    pdf_path: null,
    summary: 'Points forts : calcul.',
    recipients: [
      { parent_id: 'p1', name: 'Alice', email: 'alice@example.com', token: 'token-alice' },
      { parent_id: 'p2', name: 'Carla', email: 'carla@example.com', token: 'token-carla' },
    ],
    ...fields,
  }) as RecapDelivery;

const TIPS = ['Un conseil du coach.', 'Un autre conseil.', 'Un dernier conseil.'];

function fakes(options: { coach?: Coach; failFor?: string; mailer?: boolean } = {}) {
  const saved: { advice?: RecapAdvice; pdfPath?: string }[] = [];
  const results: [string, unknown][] = [];
  const done: (string | null)[] = [];
  const uploads: [string, number][] = [];
  const emails: OutgoingEmail[] = [];
  const coachCalls: string[][] = [];
  const deps: DeliveryDeps = {
    store: {
      save: async (_, change) => void saved.push(change),
      emailResult: async (_, parentId, result) => void results.push([parentId, result]),
      done: async (_, error) => void done.push(error),
    },
    storage: {
      upload: async (path, bytes) => void uploads.push([path, bytes.length]),
      signedUrl: async (path) => `https://storage.example/${path}?token=signed`,
      remove: async () => undefined,
    },
    mailer:
      options.mailer === false
        ? null
        : async (email) => {
            if (email.to === options.failFor) throw new Error('Resend 500: down');
            emails.push(email);
            return { id: `email-${emails.length}` };
          },
    coach:
      options.coach ??
      (async (_, facts) => {
        coachCalls.push(facts);
        return TIPS;
      }),
    from: 'Math Genius <recaps@example.com>',
    functionsUrl: 'https://project.supabase.co/functions/v1/',
    appUrl: null,
    now: () => new Date('2026-10-01T07:05:00Z'),
  };
  return { deps, saved, results, done, uploads, emails, coachCalls };
}

describe('reading what the database sends', () => {
  it('reads a delivery and leaves out a damaged one', () => {
    const read = delivery();
    expect(read).toMatchObject({
      id: 'r1',
      kind: 'monthly',
      familyId: 'f1',
      language: 'fr',
      advice: null,
    });
    expect(read.recipients.map((recipient) => recipient.email)).toEqual([
      'alice@example.com',
      'carla@example.com',
    ]);
    expect(read.content.kind).toBe('monthly');
    expect(readDelivery({ id: 'r1', kind: 'weekly', content: MONTHLY_RECAP_SAMPLE })).toBeNull();
    expect(readDelivery(null)).toBeNull();
  });

  it('knows the family’s day', () => {
    expect(localDate(new Date('2026-09-30T22:30:00Z'), 'Europe/Paris')).toBe('2026-10-01');
    expect(localDate(new Date('2026-09-30T22:30:00Z'), 'not/a-zone')).toBe('2026-09-30');
  });
});

describe('delivering a monthly recap', () => {
  it('writes the coach’s tips and the PDF, then emails each parent with the PDF attached', async () => {
    const { deps, saved, results, done, uploads, emails, coachCalls } = fakes();
    expect(await deliverRecap(delivery(), deps)).toEqual({ sent: 2, failed: 0, emails: true });
    expect(saved).toEqual([
      { advice: { source: 'ai', tips: TIPS } },
      { pdfPath: 'f1/c1/2026-09.pdf' },
    ]);
    expect(coachCalls[0]?.join(' ')).not.toContain('Léa');
    expect(uploads[0]?.[0]).toBe('f1/c1/2026-09.pdf');
    expect(emails.map((email) => email.to)).toEqual(['alice@example.com', 'carla@example.com']);
    expect(emails[0]?.subject).toBe('Récap de septembre de Léa');
    expect(emails[0]?.html).toContain('Un conseil du coach.');
    expect(emails[0]?.attachments?.[0]?.filename).toBe('recap-2026-09.pdf');
    expect(emails[0]?.unsubscribe).toBe(
      'https://project.supabase.co/functions/v1/recaps?task=unsubscribe&kind=monthly&token=token-alice',
    );
    expect(emails[1]?.unsubscribe).toContain('token=token-carla');
    expect(results).toEqual([
      ['p1', { id: 'email-1' }],
      ['p2', { id: 'email-2' }],
    ]);
    expect(done).toEqual([null]);
  });

  it('keeps the standard tips without the parent’s consent: nothing goes to the coach', async () => {
    const { deps, saved, coachCalls } = fakes();
    await deliverRecap(delivery({ summary: null }), deps);
    expect(coachCalls).toHaveLength(0);
    expect(saved[0]?.advice?.source).toBe('standard');
    expect(saved[0]?.advice?.tips).toHaveLength(3);
  });

  it('keeps the standard tips when the coach gives none or fails', async () => {
    for (const coach of [
      async () => null,
      async () => Promise.reject(new Error('down')),
    ] as Coach[]) {
      const { deps, saved } = fakes({ coach });
      await deliverRecap(delivery(), deps);
      expect(saved[0]?.advice?.source).toBe('standard');
    }
  });

  it('keeps tips and PDF already written', async () => {
    const { deps, saved, uploads, coachCalls } = fakes();
    await deliverRecap(
      delivery({ advice: { source: 'ai', tips: TIPS }, pdf_path: 'f1/c1/2026-09.pdf' }),
      deps,
    );
    expect(saved).toEqual([]);
    expect(uploads).toEqual([]);
    expect(coachCalls).toEqual([]);
  });

  it('sends no email without a Resend key: the notifications went out already', async () => {
    const { deps, emails, done, uploads } = fakes({ mailer: false });
    expect(await deliverRecap(delivery(), deps)).toEqual({ sent: 0, failed: 0, emails: false });
    expect(emails).toEqual([]);
    expect(uploads).toHaveLength(1);
    expect(done).toEqual([null]);
  });

  it('records a failed email, so that the next run sends it again', async () => {
    const { deps, results, done } = fakes({ failFor: 'carla@example.com' });
    expect(await deliverRecap(delivery(), deps)).toEqual({ sent: 1, failed: 1, emails: true });
    expect(results[1]).toEqual(['p2', { error: 'Resend 500: down' }]);
    expect(done).toEqual(['Resend 500: down']);
  });

  it('gives a signed link to the PDF, written on demand', async () => {
    const { deps, uploads } = fakes();
    expect(await recapPdfLink(delivery(), deps)).toBe(
      'https://storage.example/f1/c1/2026-09.pdf?token=signed',
    );
    expect(uploads).toHaveLength(1);
    const again = fakes();
    await recapPdfLink(delivery({ pdf_path: 'f1/c1/2026-09.pdf' }), again.deps);
    expect(again.uploads).toHaveLength(0);
    await expect(
      recapPdfLink(delivery({ kind: 'weekly', content: WEEKLY_RECAP_SAMPLE }), deps),
    ).rejects.toThrow('not_monthly');
  });
});

describe('delivering a weekly recap', () => {
  it('emails it, without tips nor PDF', async () => {
    const { deps, saved, uploads, emails } = fakes();
    await deliverRecap(delivery({ kind: 'weekly', content: WEEKLY_RECAP_SAMPLE }), deps);
    expect(saved).toEqual([]);
    expect(uploads).toEqual([]);
    expect(emails[0]?.subject).toBe('Récap de la semaine de Léa (du 14 au 20 septembre)');
    expect(emails[0]?.attachments).toBeUndefined();
    expect(emails[0]?.unsubscribe).toContain('kind=weekly');
  });
});

describe('the coach through services/ai-gateway', () => {
  it('reads its context, asks the model and logs the call for the child', async () => {
    const calls: [string, Record<string, unknown>][] = [];
    const rpc = async (name: string, body: Record<string, unknown>) => {
      calls.push([name, body]);
      if (name !== 'advice_context') return null;
      return {
        grade: 'CM1',
        settings: {
          enabled: true,
          realtime_provider: {
            kind: 'mistral',
            model: 'ministral-8b-latest',
            price_input: 0.15,
            price_output: 0.15,
          },
          daily_cap_usd: 2,
          monthly_cap_usd: 30,
        },
        banned: [],
        spent: { today: 0, month: 0 },
      };
    };
    const model: Fetch = async () =>
      Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                tips: [
                  'Proposez une courte séance chaque mercredi après le goûter.',
                  'Revoyez ensemble les nombres décimaux avec des prix.',
                  'Félicitez votre enfant pour sa belle régularité ce mois-ci.',
                ],
              }),
            },
          },
        ],
        usage: { prompt_tokens: 400, completion_tokens: 90 },
      });
    const coach = gatewayCoach(rpc, { mistralKey: 'key' }, model);
    expect(await coach(delivery(), ['Régularité : 13 jours faits sur 17 prévus'])).toHaveLength(3);
    const usage = calls.find(([name]) => name === 'coach_log_usage')?.[1].p_usage;
    expect(usage).toMatchObject({ task: 'advice', child_id: 'c1', outcome: 'ok' });
    // Without a Mistral key, no model: the standard tips.
    expect(await gatewayCoach(rpc, {}, model)(delivery(), [])).toBeNull();
  });
});

describe('Resend and Storage', () => {
  it('sends an email through Resend, with its unsubscribe headers and attachment', async () => {
    const requests: { url: string; init: RequestInit }[] = [];
    const fetcher: Fetch = async (url, init) => {
      requests.push({ url, init });
      return Response.json({ id: 'resend-id' });
    };
    const send = resendMailer('re_key', fetcher);
    const result = await send({
      from: 'Math Genius <recaps@example.com>',
      to: 'alice@example.com',
      subject: 'Récap',
      html: '<p>Bonjour</p>',
      text: 'Bonjour',
      unsubscribe: 'https://u.example',
      attachments: [{ filename: 'recap.pdf', content: new Uint8Array([37, 80, 68, 70]) }],
    });
    expect(result).toEqual({ id: 'resend-id' });
    const body = JSON.parse(String(requests[0]?.init.body)) as Record<string, unknown>;
    expect(requests[0]?.url).toBe('https://api.resend.com/emails');
    expect(new Headers(requests[0]?.init.headers).get('Authorization')).toBe('Bearer re_key');
    expect(body).toMatchObject({
      to: ['alice@example.com'],
      headers: {
        'List-Unsubscribe': '<https://u.example>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      attachments: [{ filename: 'recap.pdf', content: 'JVBERg==' }],
    });
    const failing = resendMailer('re_key', async () =>
      Response.json({ message: 'invalid from' }, { status: 422 }),
    );
    await expect(failing({ ...(JSON.parse('{}') as OutgoingEmail), to: 'a@b.c' })).rejects.toThrow(
      'Resend 422: invalid from',
    );
  });

  it('encodes big files in base 64', () => {
    const bytes = new Uint8Array(100_000).map((_, index) => index % 256);
    expect(Buffer.from(toBase64(bytes), 'base64').equals(Buffer.from(bytes))).toBe(true);
  });

  it('stores PDFs in the private bucket, creating it when missing, and signs links', async () => {
    const requests: string[] = [];
    let bucket = false;
    const fetcher: Fetch = async (url, init) => {
      requests.push(`${init.method} ${url}`);
      if (url.endsWith('/storage/v1/bucket')) {
        bucket = true;
        return Response.json({ name: 'recaps' });
      }
      if (url.includes('/object/sign/'))
        return Response.json({ signedURL: '/object/sign/recaps/f1/c1/2026-09.pdf?token=t' });
      if (!bucket) return Response.json({ message: 'Bucket not found' }, { status: 400 });
      return Response.json({ Key: 'recaps/f1/c1/2026-09.pdf' });
    };
    const storage = supabaseStorage('https://project.supabase.co/', 'service', fetcher);
    await storage.upload(pdfPath('f1', 'c1', '2026-09-01'), new Uint8Array([1]));
    expect(requests).toEqual([
      'POST https://project.supabase.co/storage/v1/object/recaps/f1/c1/2026-09.pdf',
      'POST https://project.supabase.co/storage/v1/bucket',
      'POST https://project.supabase.co/storage/v1/object/recaps/f1/c1/2026-09.pdf',
    ]);
    expect(await storage.signedUrl('f1/c1/2026-09.pdf')).toBe(
      'https://project.supabase.co/storage/v1/object/sign/recaps/f1/c1/2026-09.pdf?token=t',
    );
    await storage.remove(['f1/c1/2026-09.pdf']);
    expect(requests.at(-1)).toBe('DELETE https://project.supabase.co/storage/v1/object/recaps');
  });
});

describe('the unsubscribe link', () => {
  it('answers in the family’s language', () => {
    expect(unsubscribedText('fr', 'weekly', true)).toContain('plus le récap hebdomadaire');
    expect(unsubscribedText('fr', 'all', true)).toContain('plus aucun récap');
    expect(unsubscribedText('de', 'monthly', true)).toContain('plus le récap mensuel');
    expect(unsubscribedText('fr', 'weekly', false)).toContain('n’est plus valable');
  });
});
