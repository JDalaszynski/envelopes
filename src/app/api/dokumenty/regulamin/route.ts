import { NextResponse } from 'next/server';

import { buildPdf, type PdfLine } from '@/lib/pdf';
import { TERMS } from '@/lib/legal';
import { formatDate } from '@/lib/pricing';

export const runtime = 'nodejs';

/** Regulamin do pobrania w formacie PDF (pkt 6.4). */
export async function GET() {
  const lines: PdfLine[] = [
    { text: 'Envelopes', size: 18, bold: true },
    { text: TERMS.title, size: 14, bold: true, spaceBefore: 6 },
    { text: `Data ostatniej aktualizacji: ${formatDate(TERMS.updated)}`, size: 9, spaceBefore: 4 },
    ...wrap(TERMS.intro, 96).map((text) => ({ text, size: 9 })),
  ];

  for (const section of TERMS.sections) {
    lines.push({ text: section.heading, size: 11, bold: true, spaceBefore: 10 });
    for (const paragraph of section.paragraphs ?? []) {
      for (const text of wrap(paragraph, 96)) lines.push({ text, size: 9 });
    }
    for (const entry of section.list ?? []) {
      const parts = wrap(entry, 92);
      parts.forEach((text, index) =>
        lines.push({ text: index === 0 ? `- ${text}` : `  ${text}`, size: 9 })
      );
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
