import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

import { PERSONALIZATION_SHEET_MAX_ROWS, personalizationScope } from '@/lib/catalog';

export const runtime = 'nodejs';

/**
 * Generuje szablon Excel do personalizacji (pkt 1.3).
 * Liczba wierszy odpowiada wybranej w konfiguratorze ilości kopert,
 * dzięki czemu klient widzi wprost, ile kompletów ma uzupełnić.
 *
 * Kolumny pochodzą z wariantu w `PERSONALIZATION_SCOPES` — tej samej
 * definicji, którą opisuje strona `/koperty-personalizowane` i którą
 * sprawdza walidacja wgranego pliku. Wariant `imiona` nie ma pól adresowych,
 * bo koperty wręczane do ręki adresu nie potrzebują.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quantity = Math.min(
    Math.max(Number.parseInt(searchParams.get('ilosc') ?? '1', 10) || 1, 1),
    PERSONALIZATION_SHEET_MAX_ROWS
  );
  const scope = personalizationScope(searchParams.get('zakres'));

  const rows: (string | number)[][] = [scope.columns.map((column) => column.label)];
  for (let i = 1; i <= quantity; i += 1) {
    rows.push(scope.columns.map((column) => (column.ordinal ? i : (column.prefill ?? ''))));
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = scope.columns.map((column) => ({ wch: column.width }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, scope.sheetName);

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'content-type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="envelopes-${scope.fileStem}-${quantity}.xlsx"`,
      'cache-control': 'no-store',
    },
  });
}
