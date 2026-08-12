import { NextResponse } from 'next/server';

import { buildPdf, type PdfLine } from '@/lib/pdf';
import { LEGAL_SELLER_LINE, TERMS } from '@/lib/legal';
import { formatDate } from '@/lib/pricing';

export const runtime = 'nodejs';

/**
 * Regulamin do pobrania w formacie PDF.
 *
 * Numeracja ustępów i podpunktów odwzorowuje układ ze strony, żeby odesłania
 * w treści („zgodnie z §8 ust. 6”) prowadziły w obu wersjach w to samo miejsce.
 */
export async function GET() {
  const lines: PdfLine[] = [
    { text: 'Envelopes', size: 18, bold: true },
    { text: TERMS.title, size: 14, bold: true, spaceBefore: 6 },
    { text: LEGAL_SELLER_LINE, size: 9, spaceBefore: 4 },
    { text: `Data ostatniej aktualizacji: ${formatDate(TERMS.updated)}`, size: 9 },
    ...wrap(TERMS.intro, 96).map((text) => ({ text, size: 9 })),
  ];

  for (const section of TERMS.sections) {
    lines.push({ text: section.heading, size: 11, bold: true, spaceBefore: 14 });

    for (const paragraph of section.paragraphs ?? []) {
      for (const text of wrap(paragraph, 96)) lines.push({ text, size: 9 });
    }

    section.clauses?.forEach((clause, index) => {
      pushIndented(lines, `${index + 1}. ${clause.text}`, 3);
      clause.points?.forEach((point, pointIndex) => {
        pushIndented(lines, `${LETTERS[pointIndex] ?? '-'}) ${point}`, 7);
      });
    });

    for (const entry of section.list ?? []) {
      pushIndented(lines, `- ${entry}`, 2);
    }

    if (section.table) {
      for (const row of section.table.rows) {
        // Tabelę spłaszczamy do par „nagłówek: wartość” — kolumnowy układ
        // nie mieści się w szerokości strony przy tej długości treści.
        row.forEach((cell, index) => {
          const label = section.table?.headers[index] ?? '';
          pushIndented(lines, index === 0 ? `- ${label}: ${cell}` : `  ${label}: ${cell}`, 2);
        });
        lines.push({ text: ' ', size: 4 });
      }
    }

    if (section.note) {
      for (const text of wrap(section.note, 100)) lines.push({ text, size: 8 });
    }
  }

  const pdf = buildPdf(lines);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'attachment; filename="envelopes-regulamin.pdf"',
    },
  });
}

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

/** Dokłada wcięcie do kolejnych linii zawiniętego akapitu. */
function pushIndented(lines: PdfLine[], text: string, indent: number) {
  const pad = ' '.repeat(indent);
  const parts = wrap(text, 96 - indent);
  parts.forEach((part, index) => {
    lines.push({ text: index === 0 ? `${pad}${part}` : `${pad}   ${part}`, size: 9 });
  });
}

/** Prosty zawijacz tekstu — dokument PDF budujemy linia po linii. */
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if ((current + (current ? ' ' : '') + word).length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current += (current ? ' ' : '') + word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
