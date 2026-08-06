import 'server-only';

/**
 * Minimalny generator PDF — faktura proforma i faktura VAT do pobrania.
 * Bez zależności zewnętrznych: dokument budowany jest wprost w składni PDF.
 *
 * Polskie znaki: używamy fontu bazowego Helvetica z tablicą /Differences,
 * która mapuje kody 128–159 na nazwy glifów z Latin Extended-A (aogonek,
 * lslash, zdotaccent itd.). Dzięki temu diakrytyki renderują się poprawnie
 * bez osadzania pliku fontu.
 */

const POLISH_MAP: Record<string, { code: number; glyph: string }> = {
  Ą: { code: 128, glyph: 'Aogonek' },
  ą: { code: 129, glyph: 'aogonek' },
  Ć: { code: 130, glyph: 'Cacute' },
  ć: { code: 131, glyph: 'cacute' },
  Ę: { code: 132, glyph: 'Eogonek' },
  ę: { code: 133, glyph: 'eogonek' },
  Ł: { code: 134, glyph: 'Lslash' },
  ł: { code: 135, glyph: 'lslash' },
  Ń: { code: 136, glyph: 'Nacute' },
  ń: { code: 137, glyph: 'nacute' },
  Ó: { code: 138, glyph: 'Oacute' },
  ó: { code: 139, glyph: 'oacute' },
  Ś: { code: 140, glyph: 'Sacute' },
  ś: { code: 141, glyph: 'sacute' },
  Ź: { code: 142, glyph: 'Zacute' },
  ź: { code: 143, glyph: 'zacute' },
  Ż: { code: 144, glyph: 'Zdotaccent' },
  ż: { code: 145, glyph: 'zdotaccent' },
};

function differencesArray(): string {
  const entries = Object.values(POLISH_MAP).sort((a, b) => a.code - b.code);
  const parts: string[] = [];
  let previous = -2;
  for (const entry of entries) {
    if (entry.code !== previous + 1) parts.push(String(entry.code));
    parts.push(`/${entry.glyph}`);
    previous = entry.code;
  }
  return `[${parts.join(' ')}]`;
}

/** Zamienia polskie znaki na kody z tablicy Differences i escapuje składnię PDF. */
function encodeText(text: string): string {
  let out = '';
  for (const char of text) {
    const mapped = POLISH_MAP[char];
    if (mapped) {
      out += `\\${mapped.code.toString(8).padStart(3, '0')}`;
      continue;
    }
    if (char === '(' || char === ')' || char === '\\') out += `\\${char}`;
    else if (char.charCodeAt(0) > 255) out += '?';
    else out += char;
  }
  return out;
}

export interface PdfLine {
  text: string;
  size?: number;
  bold?: boolean;
  /** Dodatkowy odstęp przed linią */
  spaceBefore?: number;
  /** Tekst wyrównany do prawej krawędzi */
  right?: string;
}

/** Buduje dokument A4 z listy linii, łamiąc treść na kolejne strony. */
export function buildPdf(lines: PdfLine[]): Buffer {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginLeft = 56;
  const marginRight = pageWidth - 56;
  const topStart = pageHeight - 72;
  const bottomLimit = 64;

  const pages: string[][] = [];
  let content: string[] = [];
  let cursor = topStart;

  for (const line of lines) {
    const size = line.size ?? 10;
    const advance = (line.spaceBefore ?? 0) + size + 4;

    if (cursor - advance < bottomLimit) {
      pages.push(content);
      content = [];
      cursor = topStart;
    }

    cursor -= line.spaceBefore ?? 0;
    const font = line.bold ? '/F2' : '/F1';
    cursor -= size + 4;

    content.push(
      `BT ${font} ${size} Tf 1 0 0 1 ${marginLeft.toFixed(2)} ${cursor.toFixed(2)} Tm (${encodeText(
        line.text
      )}) Tj ET`
    );
    if (line.right) {
      // Przybliżona szerokość tekstu dla Helvetiki: 0.5 em na znak
      const width = line.right.length * size * 0.5;
      const x = marginRight - width;
      content.push(
        `BT ${font} ${size} Tf 1 0 0 1 ${x.toFixed(2)} ${cursor.toFixed(2)} Tm (${encodeText(
          line.right
        )}) Tj ET`
      );
    }
  }
  pages.push(content);

  /* Układ obiektów:
     1 Catalog · 2 Pages · 3 F1 · 4 F2 · dalej pary Page/Contents */
  const objects: string[] = [];
  const firstPageObject = 5;
  const pageIds = pages.map((_, index) => firstPageObject + index * 2);

  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`
  );
  objects.push(
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding << /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences ${differencesArray()} >> >>`
  );
  objects.push(
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding << /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences ${differencesArray()} >> >>`
  );

  pages.forEach((pageContent, index) => {
    const contentId = pageIds[index] + 1;
    const stream = pageContent.join('\n');
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`
    );
    objects.push(
      `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`
    );
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, 'latin1');
}
