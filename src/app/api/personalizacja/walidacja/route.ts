import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

import {
  PERSONALIZATION_SHEET_EXTENSIONS,
  PERSONALIZATION_SHEET_EXTENSIONS_LABEL,
  personalizationScope,
} from '@/lib/catalog';
import { plural } from '@/lib/pricing';
import { storeFile } from '@/lib/storage';

export const runtime = 'nodejs';

/**
 * Walidacja uzupełnionego szablonu (pkt 1.3): sprawdza format pliku,
 * liczbę wypełnionych wierszy względem zamówionej ilości kopert
 * oraz kompletność pól wymaganych w wybranym wariancie.
 *
 * Wymagane pola czytamy z `PERSONALIZATION_SCOPES`, a nie z listy wpisanej
 * tutaj. Wariant `imiona` nie ma pól adresowych, więc lista samych nazwisk
 * przechodzi walidację — wcześniej odrzucał ją brak ulicy.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get('file');
  const quantity = Number.parseInt((form.get('quantity') as string) ?? '0', 10) || 0;
  const scope = personalizationScope(form.get('zakres') as string | null);

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Brak pliku w żądaniu.' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!PERSONALIZATION_SHEET_EXTENSIONS.includes(ext)) {
    return NextResponse.json(
      { ok: false, error: `Obsługujemy pliki ${PERSONALIZATION_SHEET_EXTENSIONS_LABEL}.` },
      { status: 415 }
    );
  }

  let rows: Record<string, unknown>[];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Nie udało się odczytać arkusza — plik może być uszkodzony.' },
      { status: 422 }
    );
  }

  const value = (row: Record<string, unknown>, keys: string[]) => {
    for (const key of Object.keys(row)) {
      if (keys.some((k) => key.toLowerCase().includes(k))) {
        return String(row[key] ?? '').trim();
      }
    }
    return '';
  };

  const filled = rows.filter((row) => value(row, scope.identityMatch) !== '');

  if (filled.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'Arkusz nie zawiera wypełnionych wierszy.' },
      { status: 422 }
    );
  }

  const requiredColumns = scope.columns.filter((column) => column.required);
  const incomplete = filled.filter((row) =>
    requiredColumns.some((column) => value(row, column.match) === '')
  );

  if (incomplete.length > 0) {
    const missingLabel = requiredColumns
      .map((column) => column.label.toLowerCase())
      .join(', ')
      .replace(/, ([^,]*)$/, ' lub $1');

    return NextResponse.json(
      {
        ok: false,
        rows: filled.length,
        error: `W ${incomplete.length} ${
          incomplete.length === 1 ? 'wierszu brakuje' : 'wierszach brakuje'
        } pola: ${missingLabel}. Prosimy uzupełnić arkusz i wgrać go ponownie.`,
      },
      { status: 422 }
    );
  }

  if (quantity > 0 && filled.length !== quantity) {
    return NextResponse.json(
      {
        ok: false,
        rows: filled.length,
        error: `Arkusz zawiera ${filled.length} ${plural(
          filled.length,
          'wiersz',
          'wiersze',
          'wierszy'
        )}, a zamówienie obejmuje ${quantity} ${plural(
          quantity,
          'kopertę',
          'koperty',
          'kopert'
        )}. Prosimy wyrównać liczbę wierszy albo skorygować ilość w kroku 3.`,
      },
      { status: 422 }
    );
  }

  const stored = await storeFile(file, 'personalizacja');
  return NextResponse.json({ ok: true, rows: filled.length, path: stored.path, url: stored.url });
}
