import { FONT_WIDTHS, type FontName } from './metrics';

/**
 * A small PDF 1.4 writer, enough for the monthly recap: text in the standard fonts Helvetica and
 * Helvetica-Bold (WinAnsiEncoding: French accents, quotes and « » included, no font to embed),
 * rectangles, rounded rectangles, circles and lines. Positions are given from the top-left
 * corner, in points (A4: 595 × 842). Pure TypeScript, so that the Edge Function runs it as is.
 */

export type { FontName } from './metrics';

/** Characters of WinAnsiEncoding outside Latin-1 (its 0x80–0x9F range), and look-alikes. */
const WIN_ANSI: Record<string, number> = {
  '€': 0x80,
  '‚': 0x82,
  ƒ: 0x83,
  '„': 0x84,
  '…': 0x85,
  '†': 0x86,
  '‡': 0x87,
  ˆ: 0x88,
  '‰': 0x89,
  Š: 0x8a,
  '‹': 0x8b,
  Œ: 0x8c,
  Ž: 0x8e,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
  '˜': 0x98,
  '™': 0x99,
  š: 0x9a,
  '›': 0x9b,
  œ: 0x9c,
  ž: 0x9e,
  Ÿ: 0x9f,
  // Narrow and thin spaces (French typography) become a no-break or a plain space.
  ' ': 0xa0,
  ' ': 0x20,
  '→': 0x9b,
  '×': 0xd7,
};

/** The WinAnsiEncoding byte of a character; « ? » when it has none. */
export function winAnsiCode(char: string): number {
  const code = char.codePointAt(0) ?? 0x3f;
  if (code >= 0x20 && code < 0x7f) return code;
  if (code >= 0xa0 && code <= 0xff) return code;
  return WIN_ANSI[char] ?? 0x3f;
}

/** Width of a text in points. */
export function textWidth(text: string, font: FontName, size: number): number {
  let total = 0;
  for (const char of text) total += FONT_WIDTHS[font][winAnsiCode(char) - 32] ?? 556;
  return (total * size) / 1000;
}

/** Lines of at most `width` points, cut between words (a longer word keeps its own line). */
export function wrapText(text: string, font: FontName, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/ +/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && textWidth(candidate, font, size) > width) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    lines.push(line);
  }
  return lines;
}

const hex = (bytes: Iterable<number>) =>
  [...bytes]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
const pdfText = (text: string) => `<${hex([...text].map(winAnsiCode))}>`;
const n = (value: number) => (Math.round(value * 100) / 100).toString();

function rgb(color: string): string {
  const value = /^#([0-9a-f]{6})$/i.exec(color)?.[1] ?? '000000';
  return [0, 2, 4].map((start) => n(parseInt(value.slice(start, start + 2), 16) / 255)).join(' ');
}

const FONT_RESOURCES: Record<FontName, string> = { regular: 'F1', bold: 'F2' };
/** Bézier handle of a quarter circle. */
const K = 0.5523;

export type TextStyle = { font?: FontName; size?: number; color?: string };
export type ShapeStyle = { fill?: string; stroke?: string; lineWidth?: number; radius?: number };

export class PdfPage {
  private readonly ops: string[] = [];

  constructor(
    readonly width: number,
    readonly height: number,
  ) {}

  /** Text whose baseline is `top` points from the top of the page. */
  text(x: number, top: number, value: string, style: TextStyle = {}): this {
    const { font = 'regular', size = 11, color = '#000000' } = style;
    this.ops.push(
      `BT /${FONT_RESOURCES[font]} ${n(size)} Tf ${rgb(color)} rg ${n(x)} ${n(this.height - top)} Td ${pdfText(value)} Tj ET`,
    );
    return this;
  }

  rect(x: number, top: number, width: number, height: number, style: ShapeStyle): this {
    const radius = Math.min(style.radius ?? 0, width / 2, height / 2);
    const bottom = this.height - top - height;
    const path =
      radius > 0
        ? roundedPath(x, bottom, width, height, radius)
        : `${n(x)} ${n(bottom)} ${n(width)} ${n(height)} re`;
    this.ops.push(this.paint(path, style));
    return this;
  }

  circle(cx: number, cy: number, r: number, style: ShapeStyle): this {
    const y = this.height - cy;
    const k = r * K;
    const path = [
      `${n(cx + r)} ${n(y)} m`,
      `${n(cx + r)} ${n(y + k)} ${n(cx + k)} ${n(y + r)} ${n(cx)} ${n(y + r)} c`,
      `${n(cx - k)} ${n(y + r)} ${n(cx - r)} ${n(y + k)} ${n(cx - r)} ${n(y)} c`,
      `${n(cx - r)} ${n(y - k)} ${n(cx - k)} ${n(y - r)} ${n(cx)} ${n(y - r)} c`,
      `${n(cx + k)} ${n(y - r)} ${n(cx + r)} ${n(y - k)} ${n(cx + r)} ${n(y)} c h`,
    ].join(' ');
    this.ops.push(this.paint(path, style));
    return this;
  }

  line(x1: number, top1: number, x2: number, top2: number, color: string, width = 1): this {
    this.ops.push(
      `${rgb(color)} RG ${n(width)} w ${n(x1)} ${n(this.height - top1)} m ${n(x2)} ${n(this.height - top2)} l S`,
    );
    return this;
  }

  content(): string {
    return this.ops.join('\n');
  }

  private paint(path: string, style: ShapeStyle): string {
    const colors = [
      style.fill ? `${rgb(style.fill)} rg` : '',
      style.stroke ? `${rgb(style.stroke)} RG ${n(style.lineWidth ?? 1)} w` : '',
    ].filter(Boolean);
    const operator = style.fill && style.stroke ? 'B' : style.fill ? 'f' : 'S';
    return `${colors.join(' ')} ${path} ${operator}`.trim();
  }
}

function roundedPath(x: number, y: number, width: number, height: number, r: number): string {
  const k = r * K;
  const right = x + width;
  const top = y + height;
  return [
    `${n(x + r)} ${n(y)} m`,
    `${n(right - r)} ${n(y)} l`,
    `${n(right - r + k)} ${n(y)} ${n(right)} ${n(y + r - k)} ${n(right)} ${n(y + r)} c`,
    `${n(right)} ${n(top - r)} l`,
    `${n(right)} ${n(top - r + k)} ${n(right - r + k)} ${n(top)} ${n(right - r)} ${n(top)} c`,
    `${n(x + r)} ${n(top)} l`,
    `${n(x + r - k)} ${n(top)} ${n(x)} ${n(top - r + k)} ${n(x)} ${n(top - r)} c`,
    `${n(x)} ${n(y + r)} l`,
    `${n(x)} ${n(y + r - k)} ${n(x + r - k)} ${n(y)} ${n(x + r)} ${n(y)} c h`,
  ].join(' ');
}

/** A PDF text string in UTF-16 (document information: the title, with its accents). */
const utf16 = (text: string) => {
  const units: number[] = [0xfe, 0xff];
  for (let index = 0; index < text.length; index += 1) {
    const unit = text.charCodeAt(index);
    units.push(unit >> 8, unit & 0xff);
  }
  return `<${hex(units)}>`;
};

const pdfDate = (date: Date) => `D:${date.toISOString().replace(/[-:T]/g, '').slice(0, 14)}Z`;

export const A4 = { width: 595.28, height: 841.89 } as const;

export class PdfDocument {
  readonly pages: PdfPage[] = [];

  constructor(private readonly info: { title: string; created: Date }) {}

  addPage(width: number = A4.width, height: number = A4.height): PdfPage {
    const page = new PdfPage(width, height);
    this.pages.push(page);
    return page;
  }

  /** The file: ASCII apart from the binary marker of the second line. */
  toBytes(): Uint8Array {
    const objects: string[] = [];
    const pageIds = this.pages.map((_, index) => 6 + index * 2);
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${this.pages.length} >>`;
    objects[3] =
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[4] =
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    objects[5] = `<< /Title ${utf16(this.info.title)} /Producer (Math Genius) /CreationDate (${pdfDate(this.info.created)}) >>`;
    this.pages.forEach((page, index) => {
      const id = pageIds[index] ?? 0;
      const content = page.content();
      objects[id] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${n(page.width)} ${n(page.height)}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${id + 1} 0 R >>`;
      objects[id + 1] = `<< /Length ${content.length} >>\nstream\n${content}\nendstream`;
    });

    let file = '%PDF-1.4\n%âãÏÓ\n';
    const offsets: number[] = [];
    for (let id = 1; id < objects.length; id += 1) {
      offsets[id] = file.length;
      file += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }
    const xref = file.length;
    file += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let id = 1; id < objects.length; id += 1) {
      file += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
    }
    file += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    const bytes = new Uint8Array(file.length);
    for (let index = 0; index < file.length; index += 1)
      bytes[index] = file.charCodeAt(index) & 0xff;
    return bytes;
  }
}
