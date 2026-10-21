import type { Fetch } from '@math-genius/ai-gateway';

/**
 * Emails go through Resend (https://resend.com), with the RESEND_API_KEY secret of the Edge
 * Functions. Without it, the recaps only go out as notifications.
 */

export const RESEND_URL = 'https://api.resend.com/emails';

export type OutgoingEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  /** The unsubscribe link, for the mail clients' own button (RFC 8058). */
  unsubscribe: string;
  attachments?: { filename: string; content: Uint8Array }[];
};

export type Mailer = (email: OutgoingEmail) => Promise<{ id: string }>;

/** Base 64 of a file, in pieces small enough for String.fromCharCode. */
export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let start = 0; start < bytes.length; start += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  }
  return btoa(binary);
}

export function resendMailer(apiKey: string, fetcher: Fetch = fetch): Mailer {
  return async (email) => {
    const response = await fetcher(RESEND_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: email.from,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: {
          'List-Unsubscribe': `<${email.unsubscribe}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        attachments: email.attachments?.map((file) => ({
          filename: file.filename,
          content: toBase64(file.content),
        })),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await response.json().catch(() => ({}))) as { id?: unknown; message?: unknown };
    if (!response.ok || typeof body.id !== 'string') {
      throw new Error(
        `Resend ${response.status}: ${typeof body.message === 'string' ? body.message : 'error'}`,
      );
    }
    return { id: body.id };
  };
}
