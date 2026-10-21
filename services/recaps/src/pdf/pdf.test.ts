import { type MonthlyRecap, readRecap } from '@math-genius/shared';
import { MONTHLY_RECAP_SAMPLE } from '@math-genius/shared/src/testing/progress-samples';

import { fr } from '../texts';
import { monthlyPdf } from './monthly';
import { PdfDocument, textWidth, winAnsiCode, wrapText } from './writer';

const month = readRecap(MONTHLY_RECAP_SAMPLE) as MonthlyRecap;
const ADVICE = {
  source: 'standard' as const,
  tips: ['Premier conseil.', 'Deuxième conseil.', 'Troisième conseil.'],
};

const latin1 = (bytes: Uint8Array) => String.fromCharCode(...bytes);
// WinAnsiEncoding back to text: Latin-1, plus the few characters of 0x80–0x9F the recaps use.
const SPECIAL: Record<number, string> = { 0x92: '’', 0x85: '…', 0x96: '–', 0x9c: 'œ' };
const decode = (hex: string) =>
  (hex.match(/../g) ?? [])
    .map((pair) => {
      const code = parseInt(pair, 16);
      return SPECIAL[code] ?? String.fromCharCode(code === 0xa0 ? 0x20 : code);
    })
    .join('');

/** The text of every line drawn, page by page. */
const pageTexts = (file: string) =>
  file
    .split(/\/Type \/Page /)
    .slice(1)
    .map(() => '')
    .map((_, index) => {
      const streams = [...file.matchAll(/stream\n([\s\S]*?)\nendstream/g)].map(
        ([, body]) => body ?? '',
      );
      return [...(streams[index] ?? '').matchAll(/<([0-9A-F]+)> Tj/g)]
        .map(([, hex]) => decode(hex ?? ''))
        .join('\n');
    });

describe('the PDF writer', () => {
  it('encodes French text in WinAnsiEncoding', () => {
    expect([...'éèàçœ’«»€'].map(winAnsiCode)).toEqual([
      0xe9, 0xe8, 0xe0, 0xe7, 0x9c, 0x92, 0xab, 0xbb, 0x80,
    ]);
    expect(winAnsiCode('😀')).toBe(0x3f);
    expect(winAnsiCode(' ')).toBe(0xa0);
  });

  it('measures and wraps text with the fonts’ metrics', () => {
    // Helvetica: H 722, e 556, l 222, o 556 (thousandths of the size).
    expect(textWidth('Hello', 'regular', 10)).toBeCloseTo((722 + 556 + 222 + 222 + 556) / 100);
    expect(textWidth('Hello', 'bold', 10)).toBeGreaterThan(textWidth('Hello', 'regular', 10));
    expect(wrapText('un deux trois quatre', 'regular', 10, 40)).toEqual([
      'un deux',
      'trois',
      'quatre',
    ]);
    expect(wrapText('a\nb', 'regular', 10, 100)).toEqual(['a', 'b']);
  });

  it('writes a file whose cross-reference table points at each object', () => {
    const doc = new PdfDocument({ title: 'Récap', created: new Date('2026-10-01T07:00:00Z') });
    doc
      .addPage()
      .text(40, 60, 'Bonjour', { font: 'bold', size: 12 })
      .rect(40, 80, 100, 20, { fill: '#FF3EA5', radius: 6 });
    const file = latin1(doc.toBytes());
    expect(file.startsWith('%PDF-1.4\n')).toBe(true);
    expect(file.endsWith('%%EOF\n')).toBe(true);
    const xref = Number(/startxref\n(\d+)/.exec(file)?.[1]);
    expect(file.slice(xref, xref + 4)).toBe('xref');
    const offsets = [...file.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map(([, offset]) =>
      Number(offset),
    );
    offsets.forEach((offset, index) =>
      expect(file.slice(offset).startsWith(`${index + 1} 0 obj`)).toBe(true),
    );
    expect(file).toContain('/BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding');
    expect(file).toContain('/CreationDate (D:20261001070000Z)');
    // The stream's length is its content's.
    const [, length, body] = /\/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/.exec(file) ?? [];
    expect(body?.length).toBe(Number(length));
  });
});

describe('the monthly recap as a PDF', () => {
  const file = latin1(
    monthlyPdf(month, ADVICE, fr, {
      created: new Date('2026-10-01T07:00:00Z'),
      today: '2026-10-01',
    }),
  );
  const pages = pageTexts(file);
  const all = pages.join('\n');

  it('fits the month on two A4 pages, numbered', () => {
    expect(/\/Count (\d+)/.exec(file)?.[1]).toBe('2');
    expect(file).toContain('/MediaBox [0 0 595.28 841.89]');
    expect(pages[0]).toContain('1 / 2');
    expect(pages[1]).toContain('2 / 2');
    expect(all).toContain('Math Genius · Récap établi le jeudi 1er octobre');
  });

  it('says what the email says', () => {
    expect(pages[0]).toContain('Récap de septembre 2026');
    expect(pages[0]).toContain('À surveiller');
    expect(all).toContain('Quelques séances manquées : 13 jours faits sur 17 prévus.');
    expect(all).toContain('mercredi 9 (commencée), vendredi 11,');
    expect(all).toContain('8 jours off et 5 jours de vacances.');
    expect(all).toContain('Nombres et calcul : de 8 % à 54 %');
    expect(all).toContain('Résoudre des situations simples de proportionnalité');
    expect(all).toContain('Première mission');
    expect(all).toContain('Une sortie au cinéma');
    expect(all).toContain('Énoncé : Range ces nombres du plus petit au plus grand.');
    expect(all).toContain('Bonne réponse : 4,35 < 4,42 < 4,5 < 4,8');
    expect(all).toContain('3 conseils pour octobre');
    expect(all).toContain('Troisième conseil.');
    expect(all).toContain('Énoncé : Quel est le quotient de la division de 108 par 8 ?');
  });

  it('draws the month’s calendar in its colors', () => {
    // Green (done), orange (started), red (missed) and grey (off or holidays) circles.
    expect(file).toContain('0.12 0.62 0.39 rg');
    expect(file).toContain('0.94 0.54 0.14 rg');
    expect(file).toContain('0.84 0.23 0.23 rg');
    expect(file).toContain('0.79 0.77 0.85 rg');
  });
});
