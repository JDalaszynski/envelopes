import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';

/**
 * Generuje szablon Excel do adresowania (pkt 1.3).
 * Liczba wierszy odpowiada wybranej w konfiguratorze ilości kopert,
 * dzięki czemu klient widzi wprost, ile kompletów ma uzupełnić.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quantity = Math.min(
    Math.max(Number.parseInt(searchParams.get('ilosc') ?? '1', 10) || 1, 1),
    20000
  );

  const header = [
    'Lp.',
    'Imię i nazwisko',
    'Firma (opcjonalnie)',
    'Ulica i numer',
    'Kod pocztowy',
    'Miejscowość',
    'Kraj',
  ];

  const rows: (string | number)[][] = [header];
  for (let i = 1; i <= quantity; i += 1) {
    rows.push([i, '', '', '', '', '', 'Polska']);
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 28 },
    { wch: 32 },
    { wch: 14 },
    { wch: 22 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Adresy');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'content-type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="envelopes-adresy-${quantity}.xlsx"`,
      'cache-control': 'no-store',
    },
  });
}
