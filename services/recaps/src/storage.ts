import type { Fetch } from '@math-genius/ai-gateway';

/**
 * The month's PDFs in Supabase Storage: a private bucket, read through signed links that expire.
 * The Edge Function calls the Storage API with the service key; the bucket is created by the
 * migration, or here when it is missing (a project whose storage came later).
 */

export const RECAPS_BUCKET = 'recaps';
/** A signed link lasts 10 minutes: the app opens it at once. */
export const SIGNED_LINK_SECONDS = 600;

export type Storage = {
  upload(path: string, bytes: Uint8Array): Promise<void>;
  signedUrl(path: string): Promise<string>;
  remove(paths: readonly string[]): Promise<void>;
};

/** Where a month's PDF is kept: <family>/<child>/<YYYY-MM>.pdf. */
export const pdfPath = (familyId: string, childId: string, monthStart: string) =>
  `${familyId}/${childId}/${monthStart.slice(0, 7)}.pdf`;

const encodePath = (path: string) => path.split('/').map(encodeURIComponent).join('/');

export function supabaseStorage(url: string, serviceKey: string, fetcher: Fetch = fetch): Storage {
  const api = `${url.replace(/\/+$/, '')}/storage/v1`;
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const failed = async (response: Response) =>
    new Error(`Storage ${response.status}: ${await response.text()}`);

  const upload = (path: string, bytes: Uint8Array) =>
    fetcher(`${api}/object/${RECAPS_BUCKET}/${encodePath(path)}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/pdf', 'x-upsert': 'true' },
      body: bytes,
    });

  return {
    async upload(path, bytes) {
      let response = await upload(path, bytes);
      if (!response.ok && /bucket not found/i.test(await response.clone().text())) {
        await fetcher(`${api}/bucket`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: RECAPS_BUCKET, name: RECAPS_BUCKET, public: false }),
        });
        response = await upload(path, bytes);
      }
      if (!response.ok) throw await failed(response);
    },
    async signedUrl(path) {
      const response = await fetcher(`${api}/object/sign/${RECAPS_BUCKET}/${encodePath(path)}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: SIGNED_LINK_SECONDS }),
      });
      if (!response.ok) throw await failed(response);
      const body = (await response.json()) as { signedURL?: unknown };
      if (typeof body.signedURL !== 'string') throw new Error('Storage: no signed link');
      return `${api}${body.signedURL}`;
    },
    async remove(paths) {
      if (paths.length === 0) return;
      const response = await fetcher(`${api}/object/${RECAPS_BUCKET}`, {
        method: 'DELETE',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefixes: paths }),
      });
      if (!response.ok) throw await failed(response);
    },
  };
}
