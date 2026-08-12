import { NextResponse } from 'next/server';

import { buildPdf, type PdfLine } from '@/lib/pdf';
import { CONTACT_DETAILS } from '@/lib/orders';

export const runtime = 'nodejs';

/**
 * Wzór formularza odstąpienia od umowy (Załącznik nr 1 do Regulaminu).
 *
 * Udostępnienie wzoru jest obowiązkiem informacyjnym wobec Konsumenta
 * i przedsiębiorcy na prawach konsumenta. Formularz jest przeznaczony do
 * wydrukowania i odręcznego uzupełnienia, dlatego pola mają postać linii
 * kropkowanych, a nie pól formularza PDF.
 */
export async function GET() {
  const line = '.'.repeat(84);
  const half = '.'.repeat(38);

  const lines: PdfLine[] = [
    { text: 'Envelopes', size: 18, bold: true },
    { text: 'FORMULARZ ODSTĄPIENIA OD UMOWY', size: 14, bold: true, spaceBefore: 6 },
    {
      text: 'Załącznik nr 1 do Regulaminu sklepu Envelopes (envelopes.pl)',
      size: 9,
      spaceBefore: 4,
    },
    {
      text: 'Formularz należy wypełnić i odesłać tylko w przypadku chęci odstąpienia od umowy.',
      size: 9,
      spaceBefore: 10,
    },
    {
      text: 'Skorzystanie z niego jest dobrowolne — oświadczenie można złożyć w dowolnej innej formie.',
      size: 9,
    },

    { text: 'Adresat', size: 11, bold: true, spaceBefore: 18 },
    { text: CONTACT_DETAILS.company, size: 10 },
    { text: CONTACT_DETAILS.returnAddress, size: 10 },
    { text: `e-mail: ${CONTACT_DETAILS.email}`, size: 10 },

    { text: 'Oświadczenie', size: 11, bold: true, spaceBefore: 18 },
    {
      text: 'Ja/My (*) niniejszym informuję/informujemy (*) o moim/naszym (*) odstąpieniu',
      size: 10,
    },
    { text: 'od umowy sprzedaży następujących towarów:', size: 10 },
    { text: line, size: 10, spaceBefore: 6 },
    { text: line, size: 10, spaceBefore: 6 },

    { text: 'Numer zamówienia (ENV-RRRRMMDD-XXXX)', size: 10, spaceBefore: 16 },
    { text: line, size: 10, spaceBefore: 4 },

    { text: 'Data zawarcia umowy (*) / odbioru towaru (*)', size: 10, spaceBefore: 14 },
    { text: line, size: 10, spaceBefore: 4 },

    { text: 'Imię i nazwisko konsumenta(-ów)', size: 10, spaceBefore: 14 },
    { text: line, size: 10, spaceBefore: 4 },

    { text: 'Adres konsumenta(-ów)', size: 10, spaceBefore: 14 },
    { text: line, size: 10, spaceBefore: 4 },
    { text: line, size: 10, spaceBefore: 6 },

    { text: 'Numer rachunku bankowego do zwrotu płatności', size: 10, spaceBefore: 14 },
    { text: line, size: 10, spaceBefore: 4 },

    { text: half, size: 10, spaceBefore: 26, right: half },
    {
      text: 'Data',
      size: 9,
      spaceBefore: 2,
      right: 'Podpis konsumenta(-ów)',
    },
    {
      text: '',
      size: 9,
      right: '(tylko dla wersji papierowej)',
    },

    { text: '(*) Niepotrzebne skreślić.', size: 8, spaceBefore: 22 },
    {
      text: 'Prawo odstąpienia nie przysługuje w odniesieniu do kopert z nadrukiem oraz z personalizacją —',
      size: 8,
      spaceBefore: 6,
    },
    {
      text: 'są to towary wykonane według specyfikacji Klienta (art. 38 ust. 1 pkt 3 ustawy o prawach',
      size: 8,
    },
    {
      text: 'konsumenta oraz §12 ust. 3 Regulaminu). Koperty gładkie podlegają zwrotowi na zasadach ogólnych.',
      size: 8,
    },
  ];

  const pdf = buildPdf(lines);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'attachment; filename="envelopes-formularz-odstapienia.pdf"',
    },
  });
}
