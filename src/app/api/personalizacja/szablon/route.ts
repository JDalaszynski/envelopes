import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

import {
  PERSONALIZATION_SHEET_COLUMNS,
  PERSONALIZATION_SHEET_MAX_ROWS,
} from '@/lib/catalog';

export const runtime = 'nodejs';

/**
 * Generuje szablon Excel do adresowania (pkt 1.3).
 * Liczba wierszy odpowiada wybranej w konfiguratorze ilości kopert,
 * dzięki czemu klient widzi wprost, ile kompletów ma uzupełnić.
 *
 * Nagłówki pochodzą z `PERSONALIZATION_SHEET_COLUMNS` — tej samej listy,
 * którą opisuje strona `/koperty-personalizowane`. Zmiana kolumny przepisuje
 * szablon i treść ofertową jednocześnie.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quantity = Math.min(
    Math.max(Number.parseInt(searchParams.get('ilosc') ?? '1', 10) || 1, 1),
    PERSONALIZATION_SHEET_MAX_ROWS
  );

  const header = PERSONALIZATION_SHEET_COLUMNS.map((column) => column.label);

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
